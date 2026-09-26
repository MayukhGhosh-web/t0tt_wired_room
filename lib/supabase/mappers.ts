import type { CategoryId, Entity, EntityType, Story, StorySource } from '@/types';
import { getCategoryLabel } from '@/lib/categories';

// ---------------------------------------------------------------------------
// Raw Supabase row shapes (subset of columns actually selected — vectors such
// as clusters.centroid / articles.embedding are NEVER fetched).
// ---------------------------------------------------------------------------

export interface ClusterRow {
  id: string;
  headline: string | null;
  label: string | null;
  category: string | null;
  heat_index: number | null;
  velocity: number | string | null;
  last_updated: string | null;
  created_at: string | null;
  synthesis_shared_facts: string[] | null;
  entity_set: string[] | null;
}

export interface ArticleRow {
  id: string;
  source_name: string | null;
  title: string | null;
  snippet: string | null;
  url: string | null;
  published_at: string | null;
  cluster_id: string | null;
  created_at: string | null;
}

export interface EntityRow {
  id: string;
  canonical_name: string | null;
  entity_type: string | null;
  description: string | null;
}

export interface ArticleEntityRow {
  article_id: string;
  entity_id: string;
}

// ---------------------------------------------------------------------------
// Category mapping
// clusters.category is an uppercase editorial bucket (POLITICS, TECH & AI,
// ENTERTAINMENT, ...). It is mapped onto the frontend CategoryId taxonomy.
// Unknown buckets fall back to 'world' so the Story type contract holds.
// ---------------------------------------------------------------------------

const DB_CATEGORY_TO_ID: Record<string, CategoryId> = {
  POLITICS: 'politics',
  BUSINESS: 'business',
  SCIENCE: 'science',
  HEALTH: 'health',
  SPORTS: 'sports',
  WORLD: 'world',
  INDIA: 'world',
  EDUCATION: 'world',
  ENVIRONMENT: 'world',
  CULTURE: 'entertainment',
  ENTERTAINMENT: 'entertainment',
  TECHNOLOGY: 'technology',
  'TECH & AI': 'technology',
  TECH: 'technology',
};

export function categoryIdFromDb(raw: string | null): CategoryId {
  if (!raw) return 'world';
  const key = raw.trim().toUpperCase();
  return DB_CATEGORY_TO_ID[key] ?? 'world';
}

// Reverse map: which DB buckets to query for a frontend category.
const ID_TO_DB_CATEGORIES: Record<CategoryId, string[]> = {
  politics: ['POLITICS'],
  business: ['BUSINESS'],
  science: ['SCIENCE'],
  health: ['HEALTH'],
  sports: ['SPORTS'],
  world: ['WORLD', 'INDIA', 'EDUCATION', 'ENVIRONMENT'],
  entertainment: ['ENTERTAINMENT', 'CULTURE'],
  technology: ['TECH & AI', 'TECHNOLOGY', 'TECH'],
};

export function dbCategoriesFor(id: CategoryId): string[] {
  return ID_TO_DB_CATEGORIES[id] ?? [];
}

// ---------------------------------------------------------------------------
// Trending mapping (documented, no invented scores)
// trendingScore IS clusters.heat_index (0-100 scale in the DB), clamped to
// 0-100. Ordering uses heat_index DESC, velocity DESC, last_updated DESC so
// velocity acts as a tiebreaker instead of being folded into a fake composite.
// A story is flagged breaking when heat_index >= 85 AND velocity >= 2.0 —
// a display heuristic over real backend metrics, not a stored fact.
// ---------------------------------------------------------------------------

export function trendingScoreFromHeat(heat: number | null): number {
  if (typeof heat !== 'number' || Number.isNaN(heat)) return 0;
  return Math.max(0, Math.min(100, Math.round(heat)));
}

function velocityAsNumber(v: number | string | null): number {
  const n = typeof v === 'string' ? parseFloat(v) : (v ?? 0);
  return Number.isFinite(n) ? (n as number) : 0;
}

export function isBreakingStory(
  heat: number | null,
  velocity: number | string | null
): boolean {
  return (heat ?? 0) >= 85 && velocityAsNumber(velocity) >= 2.0;
}

// ---------------------------------------------------------------------------
// Small pure helpers
// ---------------------------------------------------------------------------

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function sourceUrlFromArticleUrl(articleUrl: string): string {
  try {
    return new URL(articleUrl).origin;
  } catch {
    return articleUrl;
  }
}

function firstNonEmpty(...values: Array<string | null | undefined>): string {
  for (const v of values) {
    if (v && v.trim().length > 0) return v;
  }
  return '';
}

// Summary fallback chain, all real data, in preference order:
// 1. first synthesis_shared_fact  2. first non-empty article snippet
// 3. first article title  4. '' (honest empty state, never fabricated).
export function storySummaryFrom(
  cluster: ClusterRow,
  articles: ArticleRow[]
): string {
  const fact = cluster.synthesis_shared_facts?.find((f) => f && f.trim().length > 0);
  if (fact) return fact;
  const snippet = firstNonEmpty(...articles.map((a) => a.snippet));
  if (snippet) return snippet;
  return firstNonEmpty(...articles.map((a) => a.title));
}

export function storyKeyDevelopmentsFrom(cluster: ClusterRow): string[] | undefined {
  const facts = (cluster.synthesis_shared_facts ?? []).filter(
    (f) => f && f.trim().length > 0
  );
  return facts.length > 0 ? facts.slice(0, 5) : undefined;
}

export function mapArticlesToSources(articles: ArticleRow[]): StorySource[] {
  return articles
    .filter((a) => a.url && a.title)
    .map((a) => {
      const name = a.source_name?.trim() || 'Unknown source';
      const publishedAt = a.published_at ?? a.created_at ?? new Date(0).toISOString();
      return {
        sourceId: `${slugify(name) || 'source'}-${a.id.slice(0, 8)}`,
        sourceName: name,
        sourceUrl: sourceUrlFromArticleUrl(a.url as string),
        articleUrl: a.url as string,
        articleHeadline: (a.title as string) || '',
        publishedAt,
      };
    });
}

// ---------------------------------------------------------------------------
// clusters (+ its articles + resolved entity ids) -> Story
// ---------------------------------------------------------------------------

export function mapClusterToStory(
  cluster: ClusterRow,
  articles: ArticleRow[],
  entityIds: string[]
): Story {
  const category = categoryIdFromDb(cluster.category);
  const trendingScore = trendingScoreFromHeat(cluster.heat_index);
  const sorted = [...articles].sort((a, b) => {
    const at = a.published_at ? Date.parse(a.published_at) : 0;
    const bt = b.published_at ? Date.parse(b.published_at) : 0;
    return bt - at;
  });
  const sources = mapArticlesToSources(sorted);
  const title =
    firstNonEmpty(cluster.headline, cluster.label, sorted[0]?.title) ||
    'Untitled story';
  const summary = storySummaryFrom(cluster, sorted);
  const publishedAt =
    sorted.length > 0
      ? (sorted[sorted.length - 1].published_at ??
        sorted[sorted.length - 1].created_at ??
        cluster.created_at ??
        new Date(0).toISOString())
      : (cluster.created_at ?? new Date(0).toISOString());
  const updatedAt = cluster.last_updated ?? cluster.created_at ?? publishedAt;

  return {
    id: cluster.id,
    title,
    summary,
    detailedSummary:
      (cluster.synthesis_shared_facts ?? []).length > 1
        ? (cluster.synthesis_shared_facts as string[]).join('\n\n')
        : undefined,
    keyDevelopments: storyKeyDevelopmentsFrom(cluster),
    category,
    categoryLabel: getCategoryLabel(category),
    trendingScore,
    sourceCount: articles.length,
    publishedAt,
    updatedAt,
    thumbnail: undefined, // backend stores no story images
    sources,
    entityIds,
    isBreaking: isBreakingStory(cluster.heat_index, cluster.velocity)
      ? true
      : undefined,
  };
}

// ---------------------------------------------------------------------------
// entities -> Entity
// NOTE: backend entity_type is uniformly 'Unknown' (no classification
// pipeline yet). It is mapped to the 'organization' display bucket so the
// frontend EntityType contract holds; the sidebar groups accordingly.
// mentionsOverTime has no backend source and is left undefined (UI optional).
// ---------------------------------------------------------------------------

export function normalizeEntityType(raw: string | null): EntityType {
  const v = (raw ?? '').trim().toLowerCase();
  if (v === 'person' || v === 'organization' || v === 'institution' || v === 'location') {
    return v;
  }
  return 'organization';
}

export function mapEntityRow(
  row: EntityRow,
  mentionCount: number,
  relatedEntityIds: string[]
): Entity {
  return {
    id: row.id,
    name: row.canonical_name?.trim() || row.id,
    type: normalizeEntityType(row.entity_type),
    description: row.description?.trim() || '',
    subtitle: undefined, // no backend source
    relatedEntityIds,
    mentionCount,
    mentionsOverTime: undefined, // no backend time-series source
  };
}
