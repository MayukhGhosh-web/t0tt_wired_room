import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getStoryById, getRelatedStories, getEntitiesByIds } from '@/services/data';
import { SourceList } from '@/components/source-list';
import { EntitySidebar } from '@/components/entity-sidebar';
import { StoryCard } from '@/components/story-card';
import { TrendingScore } from '@/components/trending-score';
import { formatRelativeTime, formatFullDate } from '@/lib/format';
import { ArrowLeft, ArrowRight, ExternalLink, KeyRound } from 'lucide-react';
import { getUnsplashImageForStory } from '@/lib/unsplash';

export default async function StoryPage({
  params,
}: {
  params: { id: string };
}) {
  const story = await getStoryById(params.id);
  if (!story) notFound();

  const entities = await getEntitiesByIds(story.entityIds);
  const relatedStories = await getRelatedStories(story, 4);
  const thumbnail = story.thumbnail || await getUnsplashImageForStory(story);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <article className="min-w-0">
          <div className="mb-4 flex items-center gap-3">
            <Link
              href={`/${story.category}`}
              className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground"
            >
              {story.categoryLabel}
            </Link>
            {story.isBreaking && (
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-600">
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-red-600" />
                Breaking
              </span>
            )}
          </div>

          {thumbnail && (
            <div className="mb-6 w-full h-64 md:h-96 overflow-hidden rounded-md relative border border-border">
               <img src={thumbnail} alt="" className="object-cover w-full h-full" />
            </div>
          )}

          <h1 className="mb-4 font-serif text-3xl font-bold leading-tight tracking-tight md:text-4xl lg:text-5xl">
            {story.title}
          </h1>

          <div className="mb-8 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span>AI-generated synthesis of {story.sourceCount} reports</span>
            <span>·</span>
            <span>Updated {formatRelativeTime(story.updatedAt)}</span>
            <span>·</span>
            <TrendingScore score={story.trendingScore} size="md" />
          </div>

          <div className="mb-8 border-l-2 border-foreground pl-4">
            <p className="font-serif text-lg leading-relaxed text-foreground md:text-xl">
              {story.summary}
            </p>
          </div>

          {story.detailedSummary && (
            <section className="mb-10">
              <h2 className="mb-4 font-serif text-xl font-bold tracking-tight">
                What Happened
              </h2>
              <p className="text-base leading-relaxed text-muted-foreground">
                {story.detailedSummary}
              </p>
            </section>
          )}

          {story.keyDevelopments && story.keyDevelopments.length > 0 && (
            <section className="mb-10">
              <h2 className="mb-4 font-serif text-xl font-bold tracking-tight">
                Key Developments
              </h2>
              <ul className="space-y-3">
                {story.keyDevelopments.map((dev, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                    <span className="text-base leading-relaxed text-foreground">
                      {dev}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mb-10">
            <div className="mb-4 flex items-center gap-2 border-b border-border pb-3">
              <h2 className="font-serif text-xl font-bold tracking-tight">
                Original Coverage
              </h2>
              <span className="text-sm text-muted-foreground">
                ({story.sources.length} sources)
              </span>
            </div>
            <SourceList sources={story.sources} />
            <p className="mt-4 text-xs text-muted-foreground">
              Wire Room aggregates headlines and summaries from multiple sources.
              Original articles remain the property of their publishers. Click
              through to read the full reporting.
            </p>
          </section>

          {relatedStories.length > 0 && (
            <section className="mb-10">
              <h2 className="mb-4 font-serif text-xl font-bold tracking-tight">
                Related Stories
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {relatedStories.map((s) => (
                  <StoryCard key={s.id} story={s} />
                ))}
              </div>
            </section>
          )}
        </article>

        <aside className="space-y-4">
          <EntitySidebar entities={entities} />

          <div className="border border-border bg-card p-5">
            <h3 className="mb-3 font-serif text-lg font-bold tracking-tight">
              Story Info
            </h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Category</dt>
                <dd className="font-medium">{story.categoryLabel}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Sources</dt>
                <dd className="font-medium">{story.sourceCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Published</dt>
                <dd className="font-medium">
                  {formatRelativeTime(story.publishedAt)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Updated</dt>
                <dd className="font-medium">
                  {formatRelativeTime(story.updatedAt)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Trending Score</dt>
                <dd className="font-mono font-bold">{story.trendingScore}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
