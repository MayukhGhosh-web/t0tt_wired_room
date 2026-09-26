import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseKey);

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";

async function generateSocials(headline: string, summary: string) {
  if (!GEMINI_API_KEY) {
     console.error("Missing GEMINI_API_KEY");
     return null;
  }

  const prompt = `You are a social media data simulator. Create realistic, engaging, and varying social media reactions for this news story:
Headline: ${headline}
Summary: ${summary}

Return ONLY a valid JSON object matching this exact schema:
{
  "twitter": [
    {
      "id": "synthetic_t1",
      "platform": "twitter",
      "author": "realistic_twitter_handle_1",
      "text": "Opinionated or factual tweet about the story...",
      "metrics": { "likes": 1542, "replies": 321, "reposts": 890 }
    },
    // exactly 3 tweets total
  ],
  "reddit": [
    {
      "id": "synthetic_r1",
      "platform": "reddit",
      "author": "r/news",
      "text": "Detailed or cynical comment about the implications...",
      "url": "https://reddit.com/r/news",
      "metrics": { "likes": 4200, "replies": 842 }
    },
    // exactly 3 reddit comments total
  ]
}
Make the opinions sound like real internet users. Output ONLY valid JSON without markdown blocks.`;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    if (!res.ok) {
       console.error("Gemini failed", await res.text());
       return null;
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
       return JSON.parse(text);
    }
  } catch(e) {
     console.error("Gemini parse failed", e);
  }
  return null;
}

Deno.serve(async (req) => {
  // 1. Get 10 clusters without social_discussions that are resolved
  const { data: clusters, error: fetchErr } = await supabase
    .from("clusters")
    .select("id, headline, synthesis_shared_facts")
    .eq("synthesis_status", "resolved")
    .is("social_discussions", null)
    .limit(5);

  if (fetchErr) {
     console.error("Fetch Error:", fetchErr);
  }

  if (!clusters || clusters.length === 0) {
    return new Response(JSON.stringify({ message: "No clusters need social processing." }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const results = [];
  
  await Promise.all(clusters.map(async (cluster) => {
    const summary = cluster.synthesis_shared_facts?.[0] || cluster.headline;
    const generated = await generateSocials(cluster.headline, summary);
    
    if (generated) {
      const { error } = await supabase
        .from("clusters")
        .update({ social_discussions: generated })
        .eq("id", cluster.id);

      if (error) {
         console.error("Failed to update cluster:", cluster.id, error);
      } else {
         results.push(cluster.id);
      }
    }
  }));

  return new Response(
    JSON.stringify({ success: true, processed: results }),
    { headers: { "Content-Type": "application/json" } },
  );
});
