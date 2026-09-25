export type CategoryId =
  | 'politics'
  | 'technology'
  | 'science'
  | 'business'
  | 'world'
  | 'india'
  | 'education'
  | 'health'
  | 'environment'
  | 'culture'
  | 'sports';

export interface Category {
  id: CategoryId;
  label: string;
  slug: string;
}

export interface Source {
  id: string;
  name: string;
  url: string;
  articleUrl?: string;
  articleHeadline?: string;
  publishedAt: string;
}

export interface StorySource {
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  articleUrl: string;
  articleHeadline: string;
  publishedAt: string;
}

export interface Story {
  id: string;
  title: string;
  summary: string;
  detailedSummary?: string;
  keyDevelopments?: string[];
  category: CategoryId;
  categoryLabel: string;
  trendingScore: number;
  sourceCount: number;
  publishedAt: string;
  updatedAt: string;
  thumbnail?: string;
  sources: StorySource[];
  entityIds: string[];
  isBreaking?: boolean;
}

export type EntityType = 'person' | 'organization' | 'institution' | 'location';

export interface Entity {
  id: string;
  name: string;
  type: EntityType;
  description: string;
  subtitle?: string;
  relatedEntityIds: string[];
  mentionCount: number;
  mentionsOverTime?: { date: string; count: number }[];
}

export interface EntityRelationship {
  fromId: string;
  toId: string;
  label?: string;
}

export interface SearchResult {
  stories: Story[];
  entities: Entity[];
  topics: { id: string; label: string; count: number }[];
  sources: { id: string; name: string; count: number }[];
}

export interface TimeFilter {
  id: 'last-hour' | 'today' | 'this-week' | 'custom';
  label: string;
}

export interface TrendingLevel {
  id: 'all' | 'rising' | 'high' | 'viral';
  label: string;
  minScore: number;
}
