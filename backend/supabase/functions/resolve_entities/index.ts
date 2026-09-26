import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "AQ.Ab8RN6KIKTheAoCjsNSDQrFulLZA8LLqeveT3x-eSfKHv0pqMg";
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY") ?? "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";
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

async function callGroqJSON(prompt: string) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-20b",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return JSON.parse(data.choices[0].message.content);
}

async function searchWikidata(query: string) {
  const res = await fetch(`https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(query)}&language=en&format=json`);
  const data = await res.json();
  return data.search || [];
}

serve(async () => {
  console.log("Starting Entity Resolution Sweep...");
  
  // 1. Fetch pending articles
  const { data: articles } = await supabase
    .from('articles')
    .select('id, title, snippet')
    .eq('entity_status', 'pending')
    .limit(5);

  if (!articles || articles.length === 0) {
    return new Response(JSON.stringify({ success: true, message: "No pending articles." }), { headers: { "Content-Type": "application/json" } });
  }

  // 2. Extract Entities via Batched LLM Call
  const prompt = `
    Extract Named Entities (People, Organizations, Locations, Concepts, Themes) from the following articles.
    CRITICAL RULE: You MUST extract at least 3 to 10 entities for EVERY SINGLE article. Even short articles have subjects, themes, or geographic locations. Do not leave any article with fewer than 3 entities.
    Return a JSON object where keys are the article IDs, and values are arrays of extracted entity strings.
    Articles:
    ${articles.map((a: any) => `ID: ${a.id}\nText: ${a.title}. ${a.snippet}`).join('\n\n')}
  `;
  
  let extracted: Record<string, string[]>;
  try {
    // Fast Extraction with Groq
    extracted = await callGroqJSON(prompt);
  } catch(e) {
    console.error("Groq Extraction Error:", e);
    return new Response(JSON.stringify({ error: "LLM failed" }), { status: 500 });
  }

  const logs: string[] = [];

  // 3. Resolve Mentions
  for (const article of articles) {
    const mentions = extracted[article.id] || [];
    
    for (const mention of mentions) {
      if (!mention || mention.length > 50) continue; // safety filter

      // a. Alias Cache
      const { data: cached } = await supabase.from('entity_aliases').select('entity_id').eq('alias_text', mention).single();
      let finalEntityId = null;

      if (cached) {
        const logMsg = `Cache hit for "${mention}" -> ${cached.entity_id}`;
        console.log(logMsg);
        logs.push(logMsg);
        finalEntityId = cached.entity_id;
      } else {
        // b. Wikidata Search
        const wdResults = await searchWikidata(mention);
        
        let bestMatch = null;
        if (wdResults.length > 0) {
          bestMatch = wdResults[0];
          
          // c. LLM Disambiguation if multiple options
          if (wdResults.length > 1) {
            const disambigPrompt = `
              Article snippet: "${article.title}. ${article.snippet}"
              Entity mention: "${mention}"
              Which of the following Wikidata entities best matches the mention in the context of the article?
              Options:
              ${wdResults.slice(0, 10).map((r: any) => `- ID: ${r.id}, Label: ${r.label}, Description: ${r.description || 'N/A'}`).join('\n')}
              
              Return a JSON object with exactly one key "best_id" containing the ID of the best match, or null if none match.
            `;
            try {
              const res = await callGeminiJSON(disambigPrompt);
              if (res.best_id) {
                const matched = wdResults.find((r: any) => r.id === res.best_id);
                if (matched) bestMatch = matched;
              }
            } catch (e) {
               console.error("Disambiguation failed for", mention, e);
            }
          }
          
          finalEntityId = bestMatch.id;
          
          // Save to entities table
          await supabase.from('entities').upsert({
            id: finalEntityId,
            canonical_name: bestMatch.label || mention,
            entity_type: 'Unknown',
            description: bestMatch.description || null
          }, { onConflict: 'id' });
        } else {
          // Fallback: Save entity anyway even if Wikidata has no match!
          finalEntityId = 'custom_' + mention.toLowerCase().replace(/[^a-z0-9]/g, '_');
          await supabase.from('entities').upsert({
            id: finalEntityId,
            canonical_name: mention,
            entity_type: 'Unknown',
            description: null
          }, { onConflict: 'id' });
        }
        
        // Save to aliases table
        await supabase.from('entity_aliases').upsert({
          alias_text: mention,
          entity_id: finalEntityId,
          source: bestMatch ? 'wikidata' : 'llm_fallback'
        }, { onConflict: 'alias_text' });
        
        const logMsg = `Resolved "${mention}" -> ${finalEntityId} via Wikidata API`;
        console.log(logMsg);
        logs.push(logMsg);
      }
      
      // Link to article
      if (finalEntityId) {
        await supabase.from('article_entities').upsert({
          article_id: article.id,
          entity_id: finalEntityId
        }, { onConflict: 'article_id, entity_id' });
      }
    }
    
    // Mark article as resolved
    await supabase.from('articles').update({ entity_status: 'resolved' }).eq('id', article.id);
  }

  return new Response(JSON.stringify({ success: true, processed: articles.length, logs }), { headers: { "Content-Type": "application/json" } });
});
