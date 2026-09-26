'use client';

import { useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Story } from '@/types';
import { StoryCard } from '@/components/story-card';

export function StoryCarousel({
  items,
  title,
  href,
}: {
  items: React.ReactNode[];
  title: string;
  href?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = useCallback((direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const scrollAmount = container.clientWidth * 0.8;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  }, []);

  return (
    <section className="py-8">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <h2 className="font-serif text-xl font-bold tracking-tight">{title}</h2>
          {href && (
            <a
              href={href}
              className="text-sm text-muted-foreground hover:text-foreground hover:underline"
            >
              View all →
            </a>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => scroll('left')}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border transition-colors hover:bg-accent"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border transition-colors hover:bg-accent"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="no-scrollbar flex gap-4 overflow-x-auto scroll-smooth pb-2"
      >
        {items.map((node, i) => (
          <div
            key={i}
            className="w-[300px] shrink-0 md:w-[340px]"
          >
            {node}
          </div>
        ))}
      </div>
    </section>
  );
}
