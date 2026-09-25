import { AlertCircle, SearchX, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ErrorState({
  message = 'Unable to load content.',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center border border-border bg-card py-16 text-center">
      <AlertCircle className="mb-4 h-8 w-8 text-muted-foreground" />
      <p className="mb-4 text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title = 'No results found',
  message = 'Try changing your filters or search terms.',
  icon = 'search',
}: {
  title?: string;
  message?: string;
  icon?: 'search' | 'empty';
}) {
  return (
    <div className="flex flex-col items-center justify-center border border-border bg-card py-16 text-center">
      {icon === 'search' ? (
        <SearchX className="mb-4 h-8 w-8 text-muted-foreground" />
      ) : (
        <div className={cn('mb-4 h-8 w-8 rounded-full border border-border')} />
      )}
      <h3 className="mb-1 font-serif text-base font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
