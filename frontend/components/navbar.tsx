'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Search, Menu, X, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCategories } from '@/services/data';
import { SearchDialog } from '@/components/search-dialog';

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const cats = getCategories();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/trending', label: 'Trending' },
    ...cats.map((c) => ({ href: `/${c.slug}`, label: c.label })),
  ];

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 bg-background/95 backdrop-blur-sm transition-shadow',
          scrolled && 'shadow-[0_1px_0_0_hsl(var(--border))]'
        )}
      >
        <div className="border-b border-border">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-baseline gap-2">
                <span className="font-serif text-2xl font-black tracking-tight">
                  PULSE
                </span>
                <span className="hidden text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground sm:inline">
                  Media Intelligence
                </span>
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSearchOpen(true)}
                className="flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="Search"
              >
                <Search className="h-4 w-4" />
                <span className="hidden md:inline">Search PULSE</span>
              </button>
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-border transition-colors hover:bg-accent lg:hidden"
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
              <div className="hidden h-9 w-9 items-center justify-center rounded-full border border-border lg:flex">
                <Globe className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>

        <nav className="border-b border-border bg-background">
          <div className="mx-auto max-w-7xl px-4">
            <div className="no-scrollbar flex items-center gap-1 overflow-x-auto py-2">
              {navItems.map((item) => {
                const isActive =
                  item.href === '/'
                    ? pathname === '/'
                    : pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-accent'
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        {mobileOpen && (
          <nav className="border-b border-border bg-background lg:hidden">
            <div className="grid grid-cols-2 gap-1 p-4">
              {navItems.map((item) => {
                const isActive =
                  item.href === '/'
                    ? pathname === '/'
                    : pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-accent'
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </header>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
