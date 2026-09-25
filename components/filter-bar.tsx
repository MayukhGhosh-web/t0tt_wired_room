'use client';

import { useState, useCallback } from 'react';
import { Clock, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterState {
  time: string;
  trendingLevel: string;
}

const timeFilters = [
  { id: 'all', label: 'All time' },
  { id: 'last-hour', label: 'Last hour' },
  { id: 'today', label: 'Today' },
  { id: 'this-week', label: 'This week' },
];

const trendingLevels = [
  { id: 'all', label: 'All', minScore: 0 },
  { id: 'rising', label: 'Rising', minScore: 60 },
  { id: 'high', label: 'High', minScore: 75 },
  { id: 'viral', label: 'Viral', minScore: 85 },
];

export function FilterBar({
  onFilterChange,
}: {
  onFilterChange?: (filters: FilterState) => void;
}) {
  const [time, setTime] = useState('all');
  const [trendingLevel, setTrendingLevel] = useState('all');
  const [isOpen, setIsOpen] = useState(false);

  const handleTimeChange = useCallback(
    (value: string) => {
      setTime(value);
      onFilterChange?.({ time: value, trendingLevel });
    },
    [trendingLevel, onFilterChange]
  );

  const handleTrendingChange = useCallback(
    (value: string) => {
      setTrendingLevel(value);
      onFilterChange?.({ time, trendingLevel: value });
    },
    [time, onFilterChange]
  );

  const hasActiveFilters = time !== 'all' || trendingLevel !== 'all';

  return (
    <div className="border border-border bg-card">
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters</span>
          {hasActiveFilters && (
            <span className="flex h-1.5 w-1.5 rounded-full bg-foreground" />
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={() => {
                setTime('all');
                setTrendingLevel('all');
                onFilterChange?.({ time: 'all', trendingLevel: 'all' });
              }}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {isOpen ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="space-y-4 border-t border-border p-4">
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Clock className="h-3 w-3" />
              Time
            </div>
            <div className="flex flex-wrap gap-1.5">
              {timeFilters.map((f) => (
                <button
                  key={f.id}
                  onClick={() => handleTimeChange(f.id)}
                  className={cn(
                    'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
                    time === f.id
                      ? 'border-foreground bg-primary text-primary-foreground'
                      : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Trending Level
            </div>
            <div className="flex flex-wrap gap-1.5">
              {trendingLevels.map((l) => (
                <button
                  key={l.id}
                  onClick={() => handleTrendingChange(l.id)}
                  className={cn(
                    'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
                    trendingLevel === l.id
                      ? 'border-foreground bg-primary text-primary-foreground'
                      : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
