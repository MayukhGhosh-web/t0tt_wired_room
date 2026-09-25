'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, TrendingUp, FileText, Users, Tag, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchResult {
  stories: { id: string; title: string; categoryLabel: string }[];
  entities: { id: string; name: string; type: string; subtitle?: string }[];
  topics: { id: string; label: string; count: number }[];
  sources: { id: string; name: string; count: number }[];
}

export function SearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults(null);
    }
  }, [open]);

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults(null);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query)}`
        );
        const data = await res.json();
        setResults(data);
      } catch {
        setResults(null);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(handler);
  }, [query]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim()) {
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        onOpenChange(false);
      }
    },
    [query, router, onOpenChange]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center">
      <div
        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative mt-20 w-full max-w-2xl mx-4 animate-fade-in rounded-lg border border-border bg-background shadow-lg">
        <form onSubmit={handleSubmit} className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stories, people, organizations, topics..."
            className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </form>

        <div className="max-h-[60vh] overflow-y-auto">
          {loading && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          )}

          {!loading && !results && query.trim().length < 2 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Type at least 2 characters to search
            </div>
          )}

          {!loading && results && (
            <div className="py-2">
              {results.stories.length > 0 && (
                <ResultGroup
                  icon={<FileText className="h-4 w-4" />}
                  label={`Stories (${results.stories.length})`}
                >
                  {results.stories.slice(0, 5).map((s) => (
                    <ResultRow
                      key={s.id}
                      title={s.title}
                      subtitle={s.categoryLabel}
                      onClick={() => {
                        router.push(`/story/${s.id}`);
                        onOpenChange(false);
                      }}
                    />
                  ))}
                </ResultGroup>
              )}

              {results.entities.length > 0 && (
                <ResultGroup
                  icon={<Users className="h-4 w-4" />}
                  label={`Entities (${results.entities.length})`}
                >
                  {results.entities.slice(0, 5).map((e) => (
                    <ResultRow
                      key={e.id}
                      title={e.name}
                      subtitle={e.subtitle || e.type}
                      onClick={() => {
                        router.push(`/entity/${e.id}`);
                        onOpenChange(false);
                      }}
                    />
                  ))}
                </ResultGroup>
              )}

              {results.topics.length > 0 && (
                <ResultGroup
                  icon={<Tag className="h-4 w-4" />}
                  label={`Topics (${results.topics.length})`}
                >
                  {results.topics.map((t) => (
                    <ResultRow
                      key={t.id}
                      title={t.label}
                      subtitle={`${t.count} stories`}
                      onClick={() => {
                        router.push(`/search?q=${encodeURIComponent(t.label)}`);
                        onOpenChange(false);
                      }}
                    />
                  ))}
                </ResultGroup>
              )}

              {results.sources.length > 0 && (
                <ResultGroup
                  icon={<Globe className="h-4 w-4" />}
                  label={`Sources (${results.sources.length})`}
                >
                  {results.sources.map((s) => (
                    <ResultRow
                      key={s.id}
                      title={s.name}
                      subtitle={`${s.count} stories`}
                      onClick={() => {
                        router.push(`/search?q=${encodeURIComponent(s.name)}`);
                        onOpenChange(false);
                      }}
                    />
                  ))}
                </ResultGroup>
              )}

              {results.stories.length === 0 &&
                results.entities.length === 0 &&
                results.topics.length === 0 &&
                results.sources.length === 0 && (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No results found for &ldquo;{query}&rdquo;
                  </div>
                )}
            </div>
          )}

          {!loading && !results && query.trim().length >= 2 && (
            <div className="py-2">
              <button
                onClick={handleSubmit}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent"
              >
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span>
                  Search for <strong>&ldquo;{query}&rdquo;</strong>
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultGroup({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-1">
      <div className="flex items-center gap-2 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      {children}
    </div>
  );
}

function ResultRow({
  title,
  subtitle,
  onClick,
}: {
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-start gap-3 px-4 py-2 text-left transition-colors hover:bg-accent'
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{title}</div>
        <div className="truncate text-xs text-muted-foreground">{subtitle}</div>
      </div>
    </button>
  );
}
