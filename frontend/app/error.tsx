'use client';

import Link from 'next/link';
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16">
      <div className="mx-auto max-w-xl border border-border bg-card p-10 text-center">
        <div className="mb-4 flex justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-sm border border-border">
            <AlertCircle className="h-6 w-6 text-muted-foreground" />
          </span>
        </div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Something went wrong
        </div>
        <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight">
          Unable to load this section.
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {error?.message || 'An unexpected error occurred while loading this page.'}
        </p>
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
