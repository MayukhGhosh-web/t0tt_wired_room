import type { CategoryId, Entity, SearchResult, Story } from '@/types';
import { categories, getCategoryLabel } from '@/lib/categories';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';
import {
  dbCategoriesFor,
  mapClusterToStory,
  mapEntityRow,
  type ArticleEntityRow,
  type ArticleRow,
  type ClusterRow,
  type EntityRow,
} from '@/lib/supabase/mappers';

// ---------------------------------------------------------------------------
// Real Supabase data layer.
//
// clusters  -> stories  (headline/label, synthesis_shared_facts, category,
//                        heat_index/velocity, last_updated)
// articles  -> sources  (source_name, title, url, published_at, snippet)
// entities  -> entities  (canonical_name, description)
// article_entities -> story/entity relationships + mention counts
//
// Performance budget (bounded result sets, no select('*'), no vectors):
// - list queries cap clusters at <= 25 rows
// - article hydration is ONE batched `in (cluster_ids)` query (cap 400 rows)
//   plus ONE batched article_entities query (cap 1000 rows) — never N+1
// - detail queries cap articles at 50 rows per story
// - search issues a handful of small ilike queries (each <= 20 rows)
// PostgREST max_rows=1000 server-side; every query below stays far under it.
// ---------------------------------------------------------------------------

const CLUSTER_COLS =
  'id,headline,label,category,heat_index,velocity,last_updated,created_at,synthesis_shared_facts,entity_set,social_discussions';
const ARTICLE_COLS =
  'id,source_name,title,snippet,url,published_at,cluster_id,created_at';
const ARTICLE_ID_COLS = 'id,cluster_id';
const ENTITY_COLS = 'id,canonical_name,entity_type,description';

const LIST_CLUSTER_LIMIT = 50;
const DETAIL_ARTICLE_LIMIT = 50;
const HYDRATE_ARTICLE_CAP = 400;
const LINK_ROW_CAP = 1000;
const SEARCH_CLUSTER_LIMIT = 12;
const SEARCH_ENTITY_LIMIT = 10;

function sb() {
  return getSupabaseClient();
}

function logError(fn: string, err: unknown) {
  // Server-side only signal; callers receive empty results (never demo data).
  console.error(`[services/data] ${fn} failed:`, err);
}

// PostgREST `.in()` with an empty list is a client error — guard everywhere.
function unique(ids: Array<string | null | undefined>): string[] {
  return Array.from(new Set(ids.filter((v): v is string => !!v)));
}

// Escape LIKE metacharacters; commas are replaced because they separate
// filters in PostgREST query grammar.
function escapeLike(raw: string): string {
  return raw.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_').replace(/,/g, ' ');
}

// ---------------------------------------------------------------------------
// Hydration: clusters + batched articles + batched links -> Story[]
// ---------------------------------------------------------------------------

async function fetchArticlesForClusters(clusterIds: string[]) {
  const client = sb();
  if (!client || clusterIds.length === 0) return [] as ArticleRow[];
  const { data, error } = await client
    .from('articles')
    .select(ARTICLE_COLS)
    .in('cluster_id', clusterIds)
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(Math.min(HYDRATE_ARTICLE_CAP, Math.max(25, clusterIds.length * 25)));
  if (error) throw error;
  return (data ?? []) as ArticleRow[];
}

async function fetchLinksForArticles(articleIds: string[]) {
  // Chunked: a single `.in()` with hundreds of UUIDs builds a multi-KB URL
  // that remote servers / fetch reject — batch in chunks of 50 instead.
  return fetchInBatches<ArticleEntityRow>(
    'article_entities',
    'article_id,entity_id',
    'article_id',
    articleIds.slice(0, 500),
    (q) => q.limit(LINK_ROW_CAP)
  );
}

// Generic batched `.in()` select. Keeps URLs small (chunkSize ids per
// request) while avoiding N+1 query patterns — chunks run in parallel and
// the total request count stays bounded by ids.length / chunkSize.
type QueryModifier = (q: any) => any; // eslint-disable-line @typescript-eslint/no-explicit-any

async function fetchInBatches<T>(
  table: string,
  columns: string,
  column: string,
  ids: string[],
  modify?: QueryModifier,
  chunkSize = 50
): Promise<T[]> {
  const client = sb();
  const list = unique(ids);
  if (!client || list.length === 0) return [];
  const chunks: string[][] = [];
  for (let i = 0; i < list.length; i += chunkSize) chunks.push(list.slice(i, i + chunkSize));
  const pages = await Promise.all(
    chunks.map(async (c) => {
      let q: any = client.from(table).select(columns).in(column, c); // eslint-disable-line @typescript-eslint/no-explicit-any
      if (modify) q = modify(q);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as T[];
    })
  );
  const merged: T[] = [];
  for (const page of pages) {
    for (const row of page) merged.push(row);
  }
  return merged;
}

async function hydrateStories(clusters: ClusterRow[]): Promise<Story[]> {
  if (clusters.length === 0) return [];
  const ids = clusters.map((c) => c.id);
  const articles = await fetchArticlesForClusters(ids);
  const byCluster = new Map<string, ArticleRow[]>();
  for (const a of articles) {
    if (!a.cluster_id) continue;
    const list = byCluster.get(a.cluster_id) ?? [];
    list.push(a);
    byCluster.set(a.cluster_id, list);
  }
  const articleIdToCluster = new Map<string, string>();
  for (const a of articles) {
    if (a.cluster_id) articleIdToCluster.set(a.id, a.cluster_id);
  }
  const links = await fetchLinksForArticles(articles.map((a) => a.id));
  const entitiesByCluster = new Map<string, Set<string>>();
  for (const l of links) {
    const cid = articleIdToCluster.get(l.article_id);
    if (!cid) continue;
    let set = entitiesByCluster.get(cid);
    if (!set) {
      set = new Set();
      entitiesByCluster.set(cid, set);
    }
    set.add(l.entity_id);
  }
  return clusters.map((c) =>
    mapClusterToStory(c, byCluster.get(c.id) ?? [], Array.from(entitiesByCluster.get(c.id) ?? []))
  );
}

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export async function getTrendingStories(limit?: number): Promise<Story[]> {
  try {
    const client = sb();
    if (!client) return [];
    const n = Math.min(limit ?? 20, LIST_CLUSTER_LIMIT);
    const { data, error } = await client
      .from('clusters')
      .select(CLUSTER_COLS)
      .eq('status', 'active')
      .order('heat_index', { ascending: false })
      .order('velocity', { ascending: false })
      .order('last_updated', { ascending: false })
      .limit(n);
    if (error) throw error;
    return hydrateStories((data ?? []) as ClusterRow[]);
  } catch (err) {
    logError('getTrendingStories', err);
    return [];
  }
}

export async function getBreakingStories(): Promise<Story[]> {
  try {
    const client = sb();
    if (!client) return [];
    // Display heuristic over real metrics: hot AND fast-moving clusters.
    const { data, error } = await client
      .from('clusters')
      .select(CLUSTER_COLS)
      .eq('status', 'active')
      .gte('heat_index', 85)
      .gte('velocity', 2)
      .order('heat_index', { ascending: false })
      .order('last_updated', { ascending: false })
      .limit(12);
    if (error) throw error;
    return hydrateStories((data ?? []) as ClusterRow[]);
  } catch (err) {
    logError('getBreakingStories', err);
    return [];
  }
}

export async function getStoryById(id: string): Promise<Story | null> {
  try {
    const client = sb();
    if (!client || !id) return null;
    const { data: cluster, error: clusterError } = await client
      .from('clusters')
      .select(CLUSTER_COLS)
      .eq('id', id)
      .maybeSingle();
    if (clusterError) throw clusterError;
    if (!cluster) return null;
    const row = cluster as ClusterRow;
    const { data: articles, error: articlesError } = await client
      .from('articles')
      .select(ARTICLE_COLS)
      .eq('cluster_id', id)
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(DETAIL_ARTICLE_LIMIT);
    if (articlesError) throw articlesError;
    const articleRows = (articles ?? []) as ArticleRow[];
    const links = await fetchLinksForArticles(articleRows.map((a) => a.id));
    return mapClusterToStory(
      row,
      articleRows,
      unique(links.map((l) => l.entity_id))
    );
  } catch (err) {
    logError('getStoryById', err);
    return null;
  }
}

export async function getStoriesByCategory(
  category: CategoryId,
  limit?: number
): Promise<Story[]> {
  try {
    const client = sb();
    if (!client) return [];
    const buckets = dbCategoriesFor(category);
    if (buckets.length === 0) return [];
    const n = Math.min(limit ?? 50, LIST_CLUSTER_LIMIT);
    const { data, error } = await client
      .from('clusters')
      .select(CLUSTER_COLS)
      .eq('status', 'active')
      .in('category', buckets)
      .order('heat_index', { ascending: false })
      .order('velocity', { ascending: false })
      .order('last_updated', { ascending: false })
      .limit(n);
    if (error) throw error;
    return hydrateStories((data ?? []) as ClusterRow[]);
  } catch (err) {
    logError('getStoriesByCategory', err);
    return [];
  }
}

export async function getLatestStories(limit?: number): Promise<Story[]> {
  try {
    const client = sb();
    if (!client) return [];
    // last_updated is always populated; articles.published_at is often null,
    // so recency is ordered in the database on the cluster timestamp.
    const n = Math.min(limit ?? 20, LIST_CLUSTER_LIMIT);
    const { data, error } = await client
      .from('clusters')
      .select(CLUSTER_COLS)
      .eq('status', 'active')
      .order('last_updated', { ascending: false })
      .limit(n);
    if (error) throw error;
    return hydrateStories((data ?? []) as ClusterRow[]);
  } catch (err) {
    logError('getLatestStories', err);
    return [];
  }
}

export async function getStoriesByEntityId(entityId: string): Promise<Story[]> {
  try {
    const client = sb();
    if (!client || !entityId) return [];
    const { data: links, error: linksError } = await client
      .from('article_entities')
      .select('article_id')
      .eq('entity_id', entityId)
      .limit(200);
    if (linksError) throw linksError;
    const articleIds = unique(((links ?? []) as { article_id: string }[]).map((l) => l.article_id));
    if (articleIds.length === 0) return [];
    const articles = await fetchInBatches<{ cluster_id: string | null }>(
      'articles',
      ARTICLE_ID_COLS,
      'id',
      articleIds.slice(0, 200),
      (q) => q.limit(200)
    );
    const clusterIds = unique(
      ((articles ?? []) as { cluster_id: string | null }[]).map((a) => a.cluster_id)
    ).slice(0, LIST_CLUSTER_LIMIT);
    if (clusterIds.length === 0) return [];
    const { data: clusters, error: clustersError } = await client
      .from('clusters')
      .select(CLUSTER_COLS)
      .in('id', clusterIds)
      .order('heat_index', { ascending: false })
      .limit(clusterIds.length);
    if (clustersError) throw clustersError;
    return hydrateStories((clusters ?? []) as ClusterRow[]);
  } catch (err) {
    logError('getStoriesByEntityId', err);
    return [];
  }
}

export async function getRelatedStories(story: Story, limit?: number): Promise<Story[]> {
  try {
    const client = sb();
    if (!client || !story) return [];
    const n = limit ?? 4;
    const buckets = dbCategoriesFor(story.category);
    const candidates = new Map<string, ClusterRow>();

    if (buckets.length > 0) {
      const { data, error } = await client
        .from('clusters')
        .select(CLUSTER_COLS)
        .eq('status', 'active')
        .in('category', buckets)
        .neq('id', story.id)
        .order('heat_index', { ascending: false })
        .limit(12);
      if (error) throw error;
      for (const c of (data ?? []) as ClusterRow[]) candidates.set(c.id, c);
    }

    // Clusters sharing at least one resolved entity with the story.
    const entityIds = (story.entityIds ?? []).slice(0, 20);
    if (entityIds.length > 0) {
      const { data: links, error: linksError } = await client
        .from('article_entities')
        .select('article_id')
        .in('entity_id', entityIds)
        .limit(300);
      if (linksError) throw linksError;
      const articleIds = unique(
        ((links ?? []) as { article_id: string }[]).map((l) => l.article_id)
      ).slice(0, 200);
      if (articleIds.length > 0) {
        const articles = await fetchInBatches<{ cluster_id: string | null }>(
          'articles',
          ARTICLE_ID_COLS,
          'id',
          articleIds,
          (q) => q.limit(200)
        );
        const clusterIds = unique(
          ((articles ?? []) as { cluster_id: string | null }[]).map((a) => a.cluster_id)
        ).filter((id) => id !== story.id).slice(0, 8);
        if (clusterIds.length > 0) {
          const { data: shared, error: sharedError } = await client
            .from('clusters')
            .select(CLUSTER_COLS)
            .in('id', clusterIds)
            .limit(clusterIds.length);
          if (sharedError) throw sharedError;
          for (const c of (shared ?? []) as ClusterRow[]) candidates.set(c.id, c);
        }
      }
    }

    const ranked = Array.from(candidates.values())
      .sort((a, b) => (b.heat_index ?? 0) - (a.heat_index ?? 0))
      .slice(0, Math.min(Math.max(n, 1), 12));
    return (await hydrateStories(ranked)).slice(0, n);
  } catch (err) {
    logError('getRelatedStories', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------

async function enrichEntities(rows: EntityRow[]): Promise<Entity[]> {
  if (rows.length === 0) return [];
  const client = sb();
  if (!client) return rows.map((r) => mapEntityRow(r, 0, []));
  const ids = rows.map((r) => r.id);

  // Mention counts from real article_entities rows (capped scan).
  const linkRows = await fetchInBatches<ArticleEntityRow>(
    'article_entities',
    'article_id,entity_id',
    'entity_id',
    ids,
    (q) => q.limit(LINK_ROW_CAP)
  );
  const counts = new Map<string, number>();
  const articleIds = new Set<string>();
  for (const l of linkRows) {
    counts.set(l.entity_id, (counts.get(l.entity_id) ?? 0) + 1);
    articleIds.add(l.article_id);
  }

  // Related entities = co-occurrence: entities sharing an article.
  const related = new Map<string, Map<string, number>>();
  if (articleIds.size > 0) {
    const coLinks = await fetchInBatches<ArticleEntityRow>(
      'article_entities',
      'article_id,entity_id',
      'article_id',
      Array.from(articleIds).slice(0, 200),
      (q) => q.limit(LINK_ROW_CAP)
    );
    const byArticle = new Map<string, Set<string>>();
    for (const l of (coLinks ?? []) as ArticleEntityRow[]) {
      let set = byArticle.get(l.article_id);
      if (!set) {
        set = new Set();
        byArticle.set(l.article_id, set);
      }
      set.add(l.entity_id);
    }
    byArticle.forEach((set) => {
      set.forEach((a) => {
        if (!ids.includes(a)) return;
        let m = related.get(a);
        if (!m) {
          m = new Map<string, number>();
          related.set(a, m);
        }
        const bucket = m;
        set.forEach((b) => {
          if (b === a) return;
          bucket.set(b, (bucket.get(b) ?? 0) + 1);
        });
      });
    });
  }

  return rows.map((r) => {
    const co = related.get(r.id);
    const top = co
      ? Array.from(co.entries()).sort((x, y) => y[1] - x[1]).slice(0, 8).map(([id]) => id)
      : [];
    return mapEntityRow(r, counts.get(r.id) ?? 0, top);
  });
}

export async function getEntityById(id: string): Promise<Entity | null> {
  try {
    const client = sb();
    if (!client || !id) return null;
    const { data, error } = await client
      .from('entities')
      .select(ENTITY_COLS)
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const enriched = await enrichEntities([(data as EntityRow)]);
    return enriched[0] ?? null;
  } catch (err) {
    logError('getEntityById', err);
    return null;
  }
}

export async function getEntitiesByIds(ids: string[]): Promise<Entity[]> {
  try {
    const client = sb();
    if (!client) return [];
    const list = unique(ids).slice(0, 50);
    if (list.length === 0) return [];
    const { data, error } = await client
      .from('entities')
      .select(ENTITY_COLS)
      .in('id', list)
      .limit(list.length);
    if (error) throw error;
    return enrichEntities((data ?? []) as EntityRow[]);
  } catch (err) {
    logError('getEntitiesByIds', err);
    return [];
  }
}

export async function getRelatedEntities(entity: Entity): Promise<Entity[]> {
  try {
    if (!entity) return [];
    // enrichEntities already computes co-occurrence based related ids, so the
    // common path is a single batched fetch. Only recompute when empty.
    if (entity.relatedEntityIds.length > 0) {
      return getEntitiesByIds(entity.relatedEntityIds.slice(0, 12));
    }
    const fresh = await getEntityById(entity.id);
    if (!fresh || fresh.relatedEntityIds.length === 0) return [];
    return getEntitiesByIds(fresh.relatedEntityIds.slice(0, 12));
  } catch (err) {
    logError('getRelatedEntities', err);
    return [];
  }
}

async function getEntitiesOrderedByMentions(limit: number): Promise<Entity[]> {
  const client = sb();
  if (!client) return [];
  const { data, error } = await client
    .from('entities')
    .select(ENTITY_COLS)
    .order('created_at', { ascending: false })
    .limit(60);
  if (error) throw error;
  const enriched = await enrichEntities((data ?? []) as EntityRow[]);
  return enriched.sort((a, b) => b.mentionCount - a.mentionCount).slice(0, limit);
}

export async function getAllEntities(): Promise<Entity[]> {
  try {
    return await getEntitiesOrderedByMentions(60);
  } catch (err) {
    logError('getAllEntities', err);
    return [];
  }
}

export async function getTopEntities(limit?: number): Promise<Entity[]> {
  try {
    return await getEntitiesOrderedByMentions(Math.min(limit ?? 10, 60));
  } catch (err) {
    logError('getTopEntities', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Search (Supabase-backed; bounded ilike queries, no client-side dataset)
// ---------------------------------------------------------------------------

export async function search(query: string): Promise<SearchResult> {
  const empty: SearchResult = { stories: [], entities: [], topics: [], sources: [] };
  try {
    const client = sb();
    const q = query.trim();
    if (!client || q.length < 2) return empty;
    const pattern = `%${escapeLike(q)}%`;

    // 1. Clusters by headline / label (two small queries, merged).
    const [byHeadline, byLabel] = await Promise.all([
      client.from('clusters').select(CLUSTER_COLS).ilike('headline', pattern).limit(8),
      client.from('clusters').select(CLUSTER_COLS).ilike('label', pattern).limit(8),
    ]);
    if (byHeadline.error) throw byHeadline.error;
    if (byLabel.error) throw byLabel.error;
    const clusterMap = new Map<string, ClusterRow>();
    for (const c of [...((byHeadline.data ?? []) as ClusterRow[]), ...((byLabel.data ?? []) as ClusterRow[])]) {
      clusterMap.set(c.id, c);
    }

    // 2. Articles by title / snippet -> parent clusters.
    const [byTitle, bySnippet] = await Promise.all([
      client.from('articles').select('cluster_id').ilike('title', pattern).limit(15),
      client.from('articles').select('cluster_id').ilike('snippet', pattern).limit(15),
    ]);
    if (byTitle.error) throw byTitle.error;
    if (bySnippet.error) throw bySnippet.error;
    const extraClusterIds = unique(
      [...((byTitle.data ?? []) as { cluster_id: string | null }[]), ...((bySnippet.data ?? []) as { cluster_id: string | null }[])].map(
        (a) => a.cluster_id
      )
    ).filter((id) => !clusterMap.has(id)).slice(0, 8);
    if (extraClusterIds.length > 0) {
      const { data, error } = await client
        .from('clusters')
        .select(CLUSTER_COLS)
        .in('id', extraClusterIds)
        .limit(extraClusterIds.length);
      if (error) throw error;
      for (const c of (data ?? []) as ClusterRow[]) clusterMap.set(c.id, c);
    }

    const stories = (await hydrateStories(Array.from(clusterMap.values()).slice(0, SEARCH_CLUSTER_LIMIT))).slice(
      0,
      SEARCH_CLUSTER_LIMIT
    );

    // 3. Entities by name / description.
    const [byName, byDesc] = await Promise.all([
      client.from('entities').select(ENTITY_COLS).ilike('canonical_name', pattern).limit(6),
      client.from('entities').select(ENTITY_COLS).ilike('description', pattern).limit(6),
    ]);
    if (byName.error) throw byName.error;
    if (byDesc.error) throw byDesc.error;
    const entityMap = new Map<string, EntityRow>();
    for (const e of [...((byName.data ?? []) as EntityRow[]), ...((byDesc.data ?? []) as EntityRow[])]) {
      entityMap.set(e.id, e);
    }
    const entities = (await enrichEntities(Array.from(entityMap.values()))).slice(0, SEARCH_ENTITY_LIMIT);

    // Topics + sources aggregated from the real matched stories.
    const topicMap = new Map<string, number>();
    for (const s of stories) topicMap.set(s.categoryLabel, (topicMap.get(s.categoryLabel) ?? 0) + 1);
    const topics = Array.from(topicMap.entries()).map(([label, count]) => ({
      id: `topic-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      label,
      count,
    }));

    const sourceMap = new Map<string, number>();
    for (const s of stories) {
      for (const src of s.sources) sourceMap.set(src.sourceName, (sourceMap.get(src.sourceName) ?? 0) + 1);
    }
    const sources = Array.from(sourceMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({
        id: `source-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`,
        name,
        count,
      }));

    return { stories, entities, topics, sources };
  } catch (err) {
    logError('search', err);
    return empty;
  }
}

// ---------------------------------------------------------------------------
// Taxonomy (static frontend structure) + ticker
// ---------------------------------------------------------------------------

export function getCategories() {
  return categories;
}

// Live Supabase-backed ticker headlines for standalone callers.
// Returns real headlines linked to /story/[id] without demo fallback.
export async function getTickerHeadlines(): Promise<{ label: string; text: string; href: string }[]> {
  try {
    const stories = await getTrendingStories(10);
    const seenTitles = new Set<string>();
    const headlines: { label: string; text: string; href: string }[] = [];
    for (const s of stories) {
      const cleanTitle = s.title?.trim();
      if (!cleanTitle || seenTitles.has(cleanTitle)) continue;
      seenTitles.add(cleanTitle);
      headlines.push({
        label: s.categoryLabel,
        text: cleanTitle,
        href: `/story/${s.id}`,
      });
      if (headlines.length >= 10) break;
    }
    return headlines;
  } catch (err) {
    logError('getTickerHeadlines', err);
    return [];
  }
}

export { getCategoryLabel, isSupabaseConfigured };
