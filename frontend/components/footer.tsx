import Link from 'next/link';
import { getCategories } from '@/services/data';

export function Footer() {
  const cats = getCategories();
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-6">
          <div className="col-span-2">
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-2xl font-black tracking-tight">
                PULSE
              </span>
              <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                Media Intelligence
              </span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Aggregating news from multiple sources to show what the world is
              talking about right now.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Sections
            </h4>
            <ul className="space-y-2">
              {cats.slice(0, 5).map((c) => (
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
              {cats.slice(5).map((c) => (
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
                <Link href="/trending" className="text-sm text-foreground hover:underline">
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
            PULSE aggregates and summarizes news from multiple sources. All
            original articles remain the property of their respective
            publishers. PULSE does not reproduce complete articles. Always
            refer to the original source for full reporting.
          </p>
        </div>
      </div>
    </footer>
  );
}
