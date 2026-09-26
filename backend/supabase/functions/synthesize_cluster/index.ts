import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function callGeminiJSON(prompt: string) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  let text = data.candidates[0].content.parts[0].text;
  text = text.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(text);
}

async function synthesizeOne(clusterId: string): Promise<string> {
  const { data: articles } = await supabase
    .from('articles')
    .select('source_name, title, snippet')
    .eq('cluster_id', clusterId)
    .is('syndicated_from', null)
    .limit(15);

  if (!articles || articles.length < 2) {
    // If a story doesn't match with any others, it's not a real trending cluster.
    await supabase.from('clusters').update({ synthesis_status: 'failed', status: 'archived' }).eq('id', clusterId);
    return `${clusterId}: only 1 article, marked failed/archived (requires >= 2)`;
  }

  const prompt = `
    You are a neutral news synthesizer. Read the following articles.
    CRITICAL RULE: If the articles provided below are completely unrelated to each other (e.g., a story about nature mixed with a story about politics), you MUST reject the cluster.
    To reject, set "headline" to "REJECTED" and "category" to "REJECTED".
    
    If they DO match and are about the same underlying event or trend, generate a synthesis with:
    1. A neutral headline (max 15 words).
    2. A list of 2-4 shared facts that all sources agree on.
    3. The different perspectives or framings from each source (1 sentence each).
    4. The most appropriate category. Must be exactly one of: POLITICS, TECH & AI, SCIENCE, HEALTH, BUSINESS, SPORTS, ENTERTAINMENT, WORLD.
    5. A political spectrum breakdown estimating the percentage of coverage that leans left, center, or right (must sum to 100).
    
    Articles:
    ${articles.map((a: any) => `Source: ${a.source_name}\nTitle: ${a.title}\nText: ${a.snippet || "(no text)"}`).join('\n---\n')}
    
    Return ONLY a JSON object with this exact structure:
    {
      "headline": "Neutral Headline",
      "shared_facts": ["Fact 1", "Fact 2"],
      "perspectives": [
        { "source_name": "Source A", "framing": "Focused on the economic impact." }
      ],
      "category": "WORLD",
      "political_spectrum": { "left": 20, "center": 60, "right": 20 }
    }
  `;

  const synthesis = await callGeminiJSON(prompt);
  
  if (synthesis.headline === 'REJECTED' || synthesis.category === 'REJECTED') {
    await supabase.from('clusters').update({ synthesis_status: 'failed', status: 'archived' }).eq('id', clusterId);
    return `${clusterId}: rejected by LLM due to mismatched articles`;
  }

  const volume = articles.length;
  const heat = Math.min(99, 40 + (volume * 8));
  const velocity = +(volume * 0.4).toFixed(1);

  let imageUrl = null;
  const UNSPLASH_ACCESS_KEY = Deno.env.get("UNSPLASH_ACCESS_KEY");
  if (UNSPLASH_ACCESS_KEY) {
    try {
      const cleanTitle = synthesis.headline.replace(/[^a-zA-Z0-9 ]/g, '').trim();
      const query = encodeURIComponent(cleanTitle.split(' ').slice(0, 4).join(' ') || synthesis.category);
      const res = await fetch(`https://api.unsplash.com/search/photos?query=${query}&per_page=1&client_id=${UNSPLASH_ACCESS_KEY}`);
      if (res.ok) {
         const data = await res.json();
         if (data.results && data.results.length > 0) {
           imageUrl = data.results[0].urls.regular;
         }
      }
      if (!imageUrl) {
        const catRes = await fetch(`https://api.unsplash.com/search/photos?query=${synthesis.category || 'news'}&per_page=1&client_id=${UNSPLASH_ACCESS_KEY}`);
        if (catRes.ok) {
          const catData = await catRes.json();
          if (catData.results && catData.results.length > 0) imageUrl = catData.results[0].urls.regular;
        }
      }
    } catch (e) {
      console.error("Unsplash error:", e);
    }
  }

  const updateData: any = {
    headline: synthesis.headline,
    synthesis_shared_facts: synthesis.shared_facts,
    synthesis_perspectives: synthesis.perspectives,
    category: synthesis.category || 'WORLD',
    political_spectrum: synthesis.political_spectrum || { left: 0, center: 100, right: 0 },
    heat_index: heat,
    velocity: velocity,
    synthesis_status: 'resolved'
  };
  
  if (imageUrl) {
    updateData.image_url = imageUrl;
  }

  await supabase.from('clusters').update(updateData).eq('id', clusterId);

  return `${clusterId}: resolved as "${synthesis.headline}"`;
}

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

serve(async () => {
  console.log("Starting Batch Synthesis Sweep...");
  
  // Process up to 3 pending clusters per invocation (respecting free-tier rate limits)
  const { data: pendingClusters } = await supabase
    .from('clusters')
    .select('id')
    .eq('synthesis_status', 'pending')
    .order('created_at', { ascending: false })
    .limit(3);

  if (!pendingClusters || pendingClusters.length === 0) {
    return new Response(JSON.stringify({ success: true, message: "No pending clusters." }), { headers: { "Content-Type": "application/json" } });
  }

  const logs: string[] = [];
  for (let i = 0; i < pendingClusters.length; i++) {
    const cluster = pendingClusters[i];
    try {
      const log = await synthesizeOne(cluster.id);
      logs.push(log);
      console.log(log);
    } catch (err: any) {
      const msg = `${cluster.id}: FAILED - ${err.message}`;
      logs.push(msg);
      console.error(msg);
      await supabase.from('clusters').update({ synthesis_status: 'failed' }).eq('id', cluster.id);
    }
    // Wait 15s between calls to stay under the 5 RPM free-tier limit
    if (i < pendingClusters.length - 1) {
      await delay(15000);
    }
  }

  return new Response(JSON.stringify({ success: true, processed: logs.length, logs }), { headers: { "Content-Type": "application/json" } });
});
