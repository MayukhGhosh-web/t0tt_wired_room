'use client';

import { getTickerHeadlines } from '@/services/data';

export function HeadlineTicker() {
  const headlines = getTickerHeadlines();
  const doubled = [...headlines, ...headlines];

  return (
    <div className="border-b border-border bg-background">
      <div className="mx-auto max-w-7xl overflow-hidden px-4">
        <div className="flex items-center gap-4 py-2">
          <span className="flex shrink-0 items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-foreground">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-600" />
            Live
          </span>
          <div className="relative flex-1 overflow-hidden">
            <div className="ticker-track flex gap-8 whitespace-nowrap">
              {doubled.map((h, i) => (
                <span key={i} className="flex items-center gap-2 text-sm">
                  <span className="font-semibold uppercase tracking-wide text-muted-foreground">
                    {h.label}
                  </span>
                  <span className="text-foreground">{h.text}</span>
                  <span className="text-border">/</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
