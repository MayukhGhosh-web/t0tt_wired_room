import Link from 'next/link';
import { getCategories } from '@/services/data';
import type { Category } from '@/types';

export function Footer() {
  const cats = getCategories();
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-6">
          <div className="col-span-2">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Wire Room" className="h-20 w-auto" />
            </div>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Aggregating news from multiple sources to show what the world is
              talking about right now.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Sections
            </h4>
            <ul className="space-y-2">
              {cats.slice(0, 5).map((c: Category) => (
                <li key={c.id}>
                  <Link
                    href={`/${c.slug}`}
                    className="text-sm text-foreground hover:underline"
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              More
            </h4>
            <ul className="space-y-2">
              {cats.slice(5).map((c: Category) => (
                <li key={c.id}>
                  <Link
                    href={`/${c.slug}`}
                    className="text-sm text-foreground hover:underline"
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Platform
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-foreground hover:underline">
                  Trending
                </Link>
              </li>
              <li>
                <Link href="/search" className="text-sm text-foreground hover:underline">
                  Search
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              About
            </h4>
            <ul className="space-y-2">
              <li className="text-sm text-foreground">How it works</li>
              <li className="text-sm text-foreground">Source diversity</li>
              <li className="text-sm text-foreground">Editorial policy</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6">
          <p className="text-xs text-muted-foreground">
            Wire Room aggregates and summarizes news from multiple sources. All
            original articles remain the property of their respective
            publishers. Wire Room does not reproduce complete articles. Always
            refer to the original source for full reporting.
          </p>
        </div>
      </div>
    </footer>
  );
}
