import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

// Fonts are intentionally provided via system/local stacks defined in
// `app/globals.css` (`--font-sans` / `--font-serif`) so the app works fully
// offline without requesting Google Fonts at build/dev time.

export const metadata: Metadata = {
  title: 'PULSE — Media Intelligence Platform',
  description:
    'Aggregate news and trending content from many different outlets, organized by topic, with multi-source summaries and entity exploration.',
  openGraph: {
    title: 'PULSE — Media Intelligence Platform',
    description:
      'What the world is talking about right now — multi-source news aggregation and media intelligence.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
