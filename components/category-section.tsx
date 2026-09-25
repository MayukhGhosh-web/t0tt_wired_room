import Link from 'next/link';
import type { Story } from '@/types';
import { StoryCard } from '@/components/story-card';
import { ArrowRight } from 'lucide-react';

export function CategorySection({
  title,
  stories,
  href,
}: {
  title: string;
  stories: Story[];
  href: string;
}) {
  if (stories.length === 0) return null;

  return (
    <section className="py-8">
      <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
        <h2 className="font-serif text-xl font-bold tracking-tight">{title}</h2>
        <Link
          href={href}
          className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          View all
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stories.slice(0, 3).map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}
      </div>
    </section>
  );
}
