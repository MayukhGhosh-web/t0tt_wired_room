import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getEntityById,
  getRelatedEntities,
  getStoriesByEntityId,
} from '@/services/data';
import { EntityGraph } from '@/components/entity-graph';
import { StoryCard } from '@/components/story-card';
import { TrendingScore } from '@/components/trending-score';
import { SourceDistribution } from '@/components/source-list';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import { MentionsChart } from '@/components/mentions-chart';

const typeLabels: Record<string, string> = {
  person: 'Person',
  organization: 'Organization',
  institution: 'Institution',
  location: 'Location',
};

export default async function EntityPage({
  params,
}: {
  params: { id: string };
}) {
  const entity = await getEntityById(params.id);
  if (!entity) notFound();

  const related = await getRelatedEntities(entity);
  const stories = await getStoriesByEntityId(entity.id);

  const chartData =
    entity.mentionsOverTime?.map((m) => ({
      date: m.date.slice(5),
      count: m.count,
    })) ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-sm border-2 border-foreground font-serif text-xl font-bold">
              {entity.name.charAt(0)}
            </span>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                {typeLabels[entity.type] ?? entity.type}
              </div>
              {entity.subtitle && (
                <div className="text-sm text-muted-foreground">
                  {entity.subtitle}
                </div>
              )}
            </div>
          </div>

          <h1 className="mb-2 font-serif text-3xl font-bold tracking-tight md:text-4xl">
            {entity.name}
          </h1>

          <div className="mb-8 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4" />
              {entity.mentionCount} total mentions
            </span>
            <span>·</span>
            <span>{stories.length} stories</span>
          </div>

          <section className="mb-10">
            <h2 className="mb-3 font-serif text-xl font-bold tracking-tight">
              About
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              {entity.description}
            </p>
          </section>

          {chartData.length > 0 && (
            <section className="mb-10">
              <h2 className="mb-4 font-serif text-xl font-bold tracking-tight">
                Mentions Over Time
              </h2>
              <div className="border border-border bg-card p-4">
                <MentionsChart data={chartData} />
              </div>
            </section>
          )}

          <section className="mb-10">
            <h2 className="mb-4 font-serif text-xl font-bold tracking-tight">
              Latest Coverage
            </h2>
            {stories.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {stories.map((s) => (
                  <StoryCard key={s.id} story={s} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No stories found for this entity.
              </p>
            )}
          </section>

          {stories.length > 0 && (
            <section className="mb-10">
              <h2 className="mb-4 font-serif text-xl font-bold tracking-tight">
                Source Distribution
              </h2>
              <div className="border border-border bg-card p-5">
                <SourceDistribution stories={stories} />
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <EntityGraph center={entity} related={related} />

          {related.length > 0 && (
            <div className="border border-border bg-card p-5">
              <h3 className="mb-3 font-serif text-lg font-bold tracking-tight">
                Related Entities
              </h3>
              <ul className="space-y-1">
                {related.map((e) => (
                  <li key={e.id}>
                    <Link
                      href={`/entity/${e.id}`}
                      className="flex items-center gap-2 rounded-sm px-1.5 py-1 text-sm transition-colors hover:bg-accent"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border border-border text-[10px] font-bold text-muted-foreground">
                        {e.type.charAt(0).toUpperCase()}
                      </span>
                      <span className="hover:underline">{e.name}</span>
                      {e.subtitle && (
                        <span className="truncate text-xs text-muted-foreground">
                          · {e.subtitle}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
