import type { Story } from '@/types';

export async function getUnsplashImageForStory(story: Story): Promise<string | undefined> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return undefined;

  // Extract a meaningful keyword from the headline (first 3-4 words usually capture the essence)
  // or use the whole title but cleaned up
  const cleanTitle = story.title.replace(/[^a-zA-Z0-9 ]/g, '').trim();
  const query = encodeURIComponent(cleanTitle.split(' ').slice(0, 4).join(' ') || story.categoryLabel);

  try {
    const res = await fetch(`https://api.unsplash.com/search/photos?query=${query}&per_page=1&client_id=${accessKey}`, {
      next: { revalidate: 3600 * 24 } // cache for 24 hours to preserve API limits
    });
    
    if (!res.ok) {
      if (res.status === 429) {
        console.warn('Unsplash API rate limit exceeded');
      }
      return undefined;
    }
    
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      return data.results[0].urls.regular;
    }

    // Fallback to category if headline search yields nothing
    const fallbackRes = await fetch(`https://api.unsplash.com/search/photos?query=${story.categoryLabel}&per_page=1&client_id=${accessKey}`, {
      next: { revalidate: 3600 * 24 }
    });
    
    if (!fallbackRes.ok) return undefined;
    
    const fallbackData = await fallbackRes.json();
    if (fallbackData.results && fallbackData.results.length > 0) {
      return fallbackData.results[0].urls.regular;
    }
  } catch (error) {
    console.error('Error fetching Unsplash image:', error);
  }

  return undefined;
}
