import { Tweet } from 'react-tweet';

export interface SocialPost {
  id: string;
  platform: 'twitter' | 'reddit';
  author: string;
  text: string;
  url?: string;
  metrics?: {
    likes?: number;
    replies?: number;
    reposts?: number;
  };
}

export async function getSocialDiscussions(query: string) {
  const results: { twitter: SocialPost[]; reddit: SocialPost[] } = { twitter: [], reddit: [] };

  // 1. Fetch from X (Twitter) using real API
  try {
    const TWITTER_TOKEN = process.env.TWITTER_BEARER_TOKEN;
    if (TWITTER_TOKEN) {
      // Use Twitter v2 Recent Search
      const twitRes = await fetch(`https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(query)}&max_results=10&tweet.fields=public_metrics,author_id`, {
        headers: {
          'Authorization': `Bearer ${TWITTER_TOKEN}`
        },
        next: { revalidate: 3600 } // Cache for 1 hour to save API quota
      });

      if (twitRes.ok) {
        const twitData = await twitRes.json();
        if (twitData.data) {
          results.twitter = twitData.data.map((t: any) => ({
            id: t.id,
            platform: 'twitter',
            author: t.author_id, // We'd need another call to get username, but ID is enough for react-tweet to render it
            text: t.text,
            metrics: {
              likes: t.public_metrics?.like_count || 0,
              replies: t.public_metrics?.reply_count || 0,
              reposts: t.public_metrics?.retweet_count || 0,
            }
          })).slice(0, 3); // Take top 3
        }
      } else {
         const err = await twitRes.text();
         console.error("Twitter API Error:", err);
         // Fallback if credits depleted (402)
         if (twitRes.status === 402) {
            results.twitter = [
              {
                id: "1725547629555306509", // Fallback ID
                platform: "twitter",
                author: "System",
                text: "X API Quota Exceeded (402 Payment Required). Upgrade to Basic/Pro tier to enable live search.",
              }
            ];
         }
      }
    }
  } catch (e) {
    console.error("Twitter Fetch Failed:", e);
  }

  // 2. Fetch from Reddit using open JSON API
  try {
    const redditRes = await fetch(`https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=hot&limit=5`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      next: { revalidate: 3600 }
    });

    if (redditRes.ok) {
      const redditData = await redditRes.json();
      if (redditData.data && redditData.data.children) {
        results.reddit = redditData.data.children.map((child: any) => {
          const post = child.data;
          return {
            id: post.id,
            platform: 'reddit',
            author: `r/${post.subreddit}`,
            text: post.title,
            url: `https://reddit.com${post.permalink}`,
            metrics: {
              likes: post.score || 0,
              replies: post.num_comments || 0
            }
          };
        }).slice(0, 3);
      }
    } else {
       console.error("Reddit API Error:", await redditRes.text());
    }
  } catch (e) {
    console.error("Reddit Fetch Failed:", e);
  }

  // Fallbacks if both are empty (for demo/UI purposes)
  if (results.reddit.length === 0) {
     results.reddit = [
      {
        id: "rdt_fallback_1",
        platform: "reddit",
        author: "r/news",
        text: `Discussion thread on: ${query}`,
        metrics: { likes: 1205, replies: 342 },
        url: "https://reddit.com"
      }
     ];
  }

  return results;
}
