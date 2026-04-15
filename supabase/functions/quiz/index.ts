import { serve } from "https://deno.land/std@0.168.0/http/server.ts";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};


serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });


  try {
    const { topic, numQuestions, difficulty } = await req.json();
    const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_KEY) throw new Error("GEMINI_API_KEY is not configured");


    const body = {
      systemInstruction: {
        parts: [{ text: "You are a quiz generator for college students. Generate multiple-choice questions as valid JSON only." }],
      },
      contents: [{
        role: "user",
        parts: [{
          text: `Generate exactly ${numQuestions} ${difficulty}-difficulty multiple-choice questions about: ${topic}


Return a JSON object with a "questions" array. Each question must have:
- "question": the question text
- "options": an object with keys "A", "B", "C", "D" and their option texts
- "answer": the correct letter ("A", "B", "C", or "D")`,
        }],
      }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  options: {
                    type: "object",
                    properties: {
                      A: { type: "string" },
                      B: { type: "string" },
                      C: { type: "string" },
                      D: { type: "string" },
                    },
                    required: ["A", "B", "C", "D"],
                  },
                  answer: { type: "string", enum: ["A", "B", "C", "D"] },
                },
                required: ["question", "options", "answer"],
              },
            },
          },
          required: ["questions"],
        },
      },
    };


    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
    );


    if (!res.ok) {
      if (res.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (res.status === 402) return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await res.text();
      console.error("Gemini error:", res.status, t);
      return new Response(JSON.stringify({ error: "Gemini API error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }


    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return new Response(JSON.stringify({ error: "No response from Gemini" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }


    const parsed = JSON.parse(text);
    return new Response(JSON.stringify({ questions: parsed.questions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("quiz error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});



