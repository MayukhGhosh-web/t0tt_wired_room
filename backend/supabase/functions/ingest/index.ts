import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import Parser from "https://esm.sh/rss-parser@3.13.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const parser = new Parser();

// 1. Lightweight entity signal via simple regex
function extractRoughEntities(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/[A-Z][a-z]+(?: [A-Z][a-z]+)+/g);
  return matches ? Array.from(new Set(matches)) : [];
}

async function getEmbedding(text: string): Promise<number[]> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "models/gemini-embedding-2",
      content: { parts: [{ text }] },
      outputDimensionality: 768
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.embedding.values;
}

// ... Fetching functions (Hacker News, Wiki, Arxiv) ...
async function fetchHackerNews() {
  const res = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json");
  const topIds = (await res.json()).slice(0, 10);
  const articles = [];
  for (const id of topIds) {
    const item = await (await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)).json();
    if (item && item.url) articles.push({ source_name: "Hacker News", title: item.title, url: item.url, snippet: "", published_at: new Date(item.time * 1000).toISOString() });
  }
  return articles;
}

async function fetchWikipediaTop() {
  const d = new Date(); d.setDate(d.getDate() - 1);
  const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/en.wikipedia/all-access/${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
  const data = await (await fetch(url)).json();
  return (data.items?.[0]?.articles?.slice(0, 10) || [])
    .filter((a: any) => !['Main_Page', 'Special:Search'].includes(a.article))
    .map((a: any) => ({ source_name: "Wikipedia", title: a.article.replace(/_/g, ' '), url: `https://en.wikipedia.org/wiki/${a.article}`, snippet: `Pageviews: ${a.views}`, published_at: new Date().toISOString() }));
}

async function fetchArxiv() {
  const feed = await parser.parseURL('http://export.arxiv.org/api/query?search_query=cat:cs.AI&max_results=10');
  return feed.items.map((item) => ({ source_name: "arXiv", title: item.title, url: item.link, snippet: item.contentSnippet, published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString() }));
}

const RSS_FEEDS = [
  "https://huggingface.co/blog/feed.xml", "https://www.technologyreview.com/feed/", "https://www.cnbc.com/id/100003114/device/rss/rss.html",
  "https://feeds.marketwatch.com/marketwatch/topstories/", "https://dev.to/feed", "https://github.blog/feed/", "https://ew.com/feed/",
  "https://www.rollingstone.com/feed/", "https://variety.com/feed/", "https://feeds.ign.com/ign/all", "https://www.polygon.com/rss/index.xml",
  "https://www.medicalnewstoday.com/newsfeeds-rss", "https://www.statnews.com/feed/", "https://www.who.int/rss-feeds/news-english.xml",
  "https://www.aljazeera.com/xml/rss/all.xml", "http://feeds.bbci.co.uk/news/world/asia/india/rss.xml", "https://www.business-standard.com/rss/home_page_top_stories.rss",
  "https://www.deccanherald.com/rss-feed", "https://www.firstpost.com/rss", "https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml",
  "https://www.indiatoday.in/rss/1206514", "https://www.livemint.com/rss/news", "https://feeds.feedburner.com/ndtvnews-top-stories",
  "https://www.news18.com/rss/india.xml", "https://www.opindia.com/feed", "https://scroll.in/feed", "https://www.thehindu.com/news/national/feeder/default.rss",
  "https://indianexpress.com/feed/", "https://theprint.in/feed/", "https://www.thequint.com/rss", "https://www.tribuneindia.com/rss/feed",
  "https://thewire.in/feed", "https://timesofindia.indiatimes.com/rssfeedstopstories.cms", "https://feeds.bbci.co.uk/news/rss.xml",
  "https://feeds.bbci.co.uk/news/world/rss.xml", "https://feeds.bbci.co.uk/news/politics/rss.xml", "https://news.google.com/rss",
  "https://feeds.npr.org/1001/rss.xml", "https://www.politico.com/rss/politicopicks.xml", "https://www.theguardian.com/world/rss",
  "https://thehill.com/feed/", "https://www.nasa.gov/rss/dyn/breaking_news.rss", "https://www.nature.com/nature.rss",
  "https://rss.sciencedaily.com/all.xml", "https://feeds.bbci.co.uk/sport/rss.xml", "https://www.espn.com/espn/rss/news",
  "https://www.skysports.com/rss/12040", "https://techcrunch.com/feed/", "https://feeds.arstechnica.com/arstechnica/index",
  "https://www.engadget.com/rss.xml", "https://www.theverge.com/rss/index.xml", "https://www.wired.com/feed/rss"
];

async function fetchGenericRSS(feedUrl: string) {
  try {
    const feed = await parser.parseURL(feedUrl);
    const domain = new URL(feedUrl).hostname.replace('www.', '');
    return feed.items.slice(0, 5).map((item) => ({
      source_name: feed.title || domain,
      title: item.title,
      url: item.link,
      snippet: (item.contentSnippet || item.content || "").substring(0, 500),
      published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString()
    }));
  } catch (err) {
    console.error(`Failed to parse ${feedUrl}:`, err);
    return [];
  }
}

serve(async () => {
  console.log("Starting Hardened Ingestion & Sweep...");
  
  // Phase 1: Ingest pending rows (Random 5 feeds per run to avoid Edge Function timeout)
  let allArticles: any[] = [];
  try { allArticles.push(...await fetchHackerNews()); } catch (e) {}
  try { allArticles.push(...await fetchWikipediaTop()); } catch (e) {}
  try { allArticles.push(...await fetchArxiv()); } catch (e) {}

  const shuffledFeeds = RSS_FEEDS.sort(() => 0.5 - Math.random()).slice(0, 5);
  const results = await Promise.allSettled(shuffledFeeds.map(fetchGenericRSS));
  results.forEach(res => {
    if (res.status === 'fulfilled') allArticles.push(...res.value);
  });

  for (const a of allArticles) {
    const { data: exist } = await supabase.from('articles').select('id').eq('url', a.url).limit(1);
    if (!exist || exist.length === 0) {
      const fullText = `${a.title}. ${a.snippet || ""}`;
      await supabase.from('articles').insert({
        ...a,
        raw_entity_terms: extractRoughEntities(fullText),
        embedding_status: 'pending' // 3. Set to pending
      });
    }
  }

  // Phase 2: Sweep & Cluster
  const { data: pending } = await supabase.from('articles').select('*').in('embedding_status', ['pending', 'failed']).limit(15);

  if (pending) {
    for (const article of pending) {
      try {
        const textToEmbed = `${article.title}. ${article.snippet || ""}`;
        const embedding = await getEmbedding(textToEmbed);
        await supabase.rpc('process_article_clustering', {
          p_article_id: article.id,
          p_embedding: embedding,
          p_raw_entities: article.raw_entity_terms || [],
          p_snippet: article.snippet || ""
        });
      } catch (err) {
        console.error("Embedding failure:", err);
        await supabase.from('articles').update({ embedding_status: 'failed' }).eq('id', article.id);
      }
    }
  }

  // Phase 3: Archive Stale
  await supabase.rpc('archive_stale_clusters');

  return new Response(JSON.stringify({ success: true, swept: pending?.length || 0 }), { headers: { "Content-Type": "application/json" } });
});
