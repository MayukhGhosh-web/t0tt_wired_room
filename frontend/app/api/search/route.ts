export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { search } from '@/services/data';

// Serves the SearchDialog live-search dropdown.
// Returns lightweight rows (not full Story/Entity payloads).
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') ?? '';

    if (q.trim().length < 2) {
      return NextResponse.json({
        stories: [],
        entities: [],
        topics: [],
        sources: [],
      });
    }

    const result = await search(q);

    return NextResponse.json({
      stories: result.stories.slice(0, 8).map((s) => ({
        id: s.id,
        title: s.title,
        categoryLabel: s.categoryLabel,
      })),
      entities: result.entities.slice(0, 8).map((e) => ({
        id: e.id,
        name: e.name,
        type: e.type,
        subtitle: e.subtitle ?? null,
      })),
      topics: result.topics,
      sources: result.sources,
    });
  } catch {
    return NextResponse.json(
      { stories: [], entities: [], topics: [], sources: [] },
      { status: 500 }
    );
  }
}
