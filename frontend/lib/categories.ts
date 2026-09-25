import type { Category, CategoryId } from '@/types';

// Frontend taxonomy. Static by design: category pages, nav and footer render
// from this list. Database categories (clusters.category) are mapped onto
// these ids in lib/supabase/mappers.ts. Categories with no real rows simply
// return empty results from the service layer.
export const categories: Category[] = [
  { id: 'politics', label: 'Politics', slug: 'politics' },
  { id: 'technology', label: 'Technology', slug: 'technology' },
  { id: 'science', label: 'Science', slug: 'science' },
  { id: 'business', label: 'Business', slug: 'business' },
  { id: 'world', label: 'World', slug: 'world' },
  { id: 'india', label: 'India', slug: 'india' },
  { id: 'education', label: 'Education', slug: 'education' },
  { id: 'health', label: 'Health', slug: 'health' },
  { id: 'environment', label: 'Environment', slug: 'environment' },
  { id: 'culture', label: 'Culture', slug: 'culture' },
  { id: 'sports', label: 'Sports', slug: 'sports' },
];

export function getCategoryLabel(id: CategoryId): string {
  return categories.find((c) => c.id === id)?.label ?? id;
}
