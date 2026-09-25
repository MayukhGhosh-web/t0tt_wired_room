export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Search as SearchIcon } from 'lucide-react';
import { search } from '@/services/data';
import { StoryCard } from '@/components/story-card';
import { EntityCard } from '@/components/entity-sidebar';
import { EmptyState } from '@/components/states';

export const metadata = {
  title: 'Search — PULSE',
  description: 'Search stories, entities, topics and sources.',
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const query = (searchParams?.q ?? '').trim();
  const result = query.length >= 2 ? await search(query) : null;
  const hasResults =
    result &&
    (result.stories.length > 0 ||
      result.entities.length > 0 ||
      result.topics.length > 0 ||
      result.sources.length > 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-8 border-b border-border pb-6">
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Search
        </div>
        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight md:text-4xl">
          {query ? (
            <>
              Results for &ldquo;{query}&rdquo;
            </>
          ) : (
            'Search PULSE'
          )}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Search stories and entities across all categories.
        </p>
      </div>

      <form
        action="/search"
        method="get"
        className="mb-8 flex items-center gap-2 border border-border bg-card p-2"
      >
        <SearchIcon className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Search stories, people, organizations, topics..."
          className="flex-1 bg-transparent px-1 py-2 text-sm outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Search
        </button>
      </form>

      {!result ? (
        <EmptyState
          title={query ? 'Keep typing to search' : 'Type to search'}
          message="Enter at least 2 characters to search stories and entities."
        />
      ) : !hasResults ? (
        <EmptyState
          title={`No results for "${query}"`}
          message="Try a different keyword, person, organization or topic."
        />
      ) : (
        <div className="space-y-10">
          {result.stories.length > 0 && (
            <section>
              <h2 className="mb-4 font-serif text-xl font-bold tracking-tight">
                Stories ({result.stories.length})
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {result.stories.map((s) => (
                  <StoryCard key={s.id} story={s} />
                ))}
              </div>
            </section>
          )}

          {result.entities.length > 0 && (
            <section>
              <h2 className="mb-4 font-serif text-xl font-bold tracking-tight">
                Entities ({result.entities.length})
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {result.entities.map((e) => (
                  <EntityCard key={e.id} entity={e} />
                ))}
              </div>
            </section>
          )}

          {(result.topics.length > 0 || result.sources.length > 0) && (
            <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {result.topics.length > 0 && (
                <div className="border border-border bg-card p-5">
                  <h3 className="mb-3 font-serif text-lg font-bold tracking-tight">
                    Topics
                  </h3>
                  <ul className="space-y-1">
                    {result.topics.map((t) => (
                      <li key={t.id}>
                        <Link
                          href={`/search?q=${encodeURIComponent(t.label)}`}
                          className="flex items-center justify-between rounded-sm px-1.5 py-1 text-sm transition-colors hover:bg-accent"
                        >
                          <span>{t.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {t.count} {t.count === 1 ? 'story' : 'stories'}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.sources.length > 0 && (
                <div className="border border-border bg-card p-5">
                  <h3 className="mb-3 font-serif text-lg font-bold tracking-tight">
                    Sources
                  </h3>
                  <ul className="space-y-1">
                    {result.sources.map((s) => (
                      <li key={s.id}>
                        <Link
                          href={`/search?q=${encodeURIComponent(s.name)}`}
                          className="flex items-center justify-between rounded-sm px-1.5 py-1 text-sm transition-colors hover:bg-accent"
                        >
                          <span>{s.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {s.count} {s.count === 1 ? 'story' : 'stories'}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
