import type { Category, CategoryId } from '@/types';

// Frontend taxonomy. Static by design: category pages, nav and footer render
// from this list. Database categories (clusters.category) are mapped onto
// these ids in lib/supabase/mappers.ts. Categories with no real rows simply
// return empty results from the service layer.
export const categories: Category[] = [
  { id: 'politics', label: 'Politics', slug: 'politics' },
  { id: 'technology', label: 'Tech & AI', slug: 'tech-ai' },
  { id: 'science', label: 'Science', slug: 'science' },
  { id: 'health', label: 'Health', slug: 'health' },
  { id: 'business', label: 'Business', slug: 'business' },
  { id: 'sports', label: 'Sports', slug: 'sports' },
  { id: 'entertainment', label: 'Entertainment', slug: 'entertainment' },
  { id: 'world', label: 'World', slug: 'world' },
];

export function getCategoryLabel(id: CategoryId): string {
  return categories.find((c) => c.id === id)?.label ?? id;
}
