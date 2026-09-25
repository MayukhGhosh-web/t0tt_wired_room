import Link from 'next/link';
import { ArrowLeft, FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16">
      <div className="mx-auto max-w-xl border border-border bg-card p-10 text-center">
        <div className="mb-4 flex justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-sm border border-border">
            <FileQuestion className="h-6 w-6 text-muted-foreground" />
          </span>
        </div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          404
        </div>
        <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight">
          This page doesn&apos;t exist.
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
          The story or section you&apos;re looking for couldn&apos;t be found.
          It may have been moved, or the link may be incorrect.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
