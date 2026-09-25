import type { Story, Entity, CategoryId, SearchResult } from '@/types';
import { demoStories, demoEntities, categories, tickerHeadlines, getCategoryLabel } from '@/lib/demo/data';
import { isSupabaseConfigured } from '@/lib/supabase/client';

// This service layer abstracts data access. When the Supabase schema is
// connected, replace the demo data reads with real Supabase queries.
// The function signatures remain the same so UI components don't change.

export async function getTrendingStories(limit?: number): Promise<Story[]> {
  const sorted = [...demoStories].sort((a, b) => b.trendingScore - a.trendingScore);
  return limit ? sorted.slice(0, limit) : sorted;
}

export async function getBreakingStories(): Promise<Story[]> {
  return demoStories.filter((s) => s.isBreaking);
}

export async function getStoryById(id: string): Promise<Story | null> {
  return demoStories.find((s) => s.id === id) ?? null;
}

export async function getStoriesByCategory(
  category: CategoryId,
  limit?: number
): Promise<Story[]> {
  const filtered = demoStories.filter((s) => s.category === category);
  const sorted = filtered.sort((a, b) => b.trendingScore - a.trendingScore);
  return limit ? sorted.slice(0, limit) : sorted;
}

export async function getLatestStories(limit?: number): Promise<Story[]> {
  const sorted = [...demoStories].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
  return limit ? sorted.slice(0, limit) : sorted;
}

export async function getStoriesByEntityId(entityId: string): Promise<Story[]> {
  return demoStories.filter((s) => s.entityIds.includes(entityId));
}

export async function getRelatedStories(story: Story, limit?: number): Promise<Story[]> {
  const related = demoStories.filter(
    (s) =>
      s.id !== story.id &&
      (s.category === story.category ||
        s.entityIds.some((e) => story.entityIds.includes(e)))
  );
  const sorted = related.sort((a, b) => b.trendingScore - a.trendingScore);
  return limit ? sorted.slice(0, limit) : sorted;
}

export async function getEntityById(id: string): Promise<Entity | null> {
  return demoEntities.find((e) => e.id === id) ?? null;
}

export async function getEntitiesByIds(ids: string[]): Promise<Entity[]> {
  return demoEntities.filter((e) => ids.includes(e.id));
}

export async function getRelatedEntities(entity: Entity): Promise<Entity[]> {
  return demoEntities.filter((e) => entity.relatedEntityIds.includes(e.id));
}

export async function getAllEntities(): Promise<Entity[]> {
  return [...demoEntities].sort((a, b) => b.mentionCount - a.mentionCount);
}

export async function getTopEntities(limit?: number): Promise<Entity[]> {
  const sorted = [...demoEntities].sort((a, b) => b.mentionCount - a.mentionCount);
  return limit ? sorted.slice(0, limit) : sorted;
}

export async function search(query: string): Promise<SearchResult> {
  const q = query.toLowerCase().trim();
  if (!q) {
    return { stories: [], entities: [], topics: [], sources: [] };
  }

  const stories = demoStories.filter(
    (s) =>
      s.title.toLowerCase().includes(q) ||
      s.summary.toLowerCase().includes(q) ||
      s.categoryLabel.toLowerCase().includes(q)
  );

  const entities = demoEntities.filter(
    (e) =>
      e.name.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      (e.subtitle ?? '').toLowerCase().includes(q)
  );

  const topicMap = new Map<string, number>();
  stories.forEach((s) => {
    const key = s.categoryLabel;
    topicMap.set(key, (topicMap.get(key) ?? 0) + 1);
  });
  const topics = Array.from(topicMap.entries()).map(([label, count], i) => ({
    id: `topic-${i}`,
    label,
    count,
  }));

  const sourceMap = new Map<string, number>();
  stories.forEach((s) => {
    s.sources.forEach((src) => {
      sourceMap.set(src.sourceName, (sourceMap.get(src.sourceName) ?? 0) + 1);
    });
  });
  const sources = Array.from(sourceMap.entries()).map(([name, count], i) => ({
    id: `source-${i}`,
    name,
    count,
  }));

  return { stories, entities, topics, sources };
}

export function getCategories() {
  return categories;
}

export function getTickerHeadlines() {
  return tickerHeadlines;
}

export { getCategoryLabel, isSupabaseConfigured };
