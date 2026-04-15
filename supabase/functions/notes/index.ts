import { serve } from "https://deno.land/std@0.168.0/http/server.ts";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};


function geminiToOpenAIStream(geminiStream: ReadableStream): ReadableStream {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";


  return new ReadableStream({
    async start(controller) {
      const reader = geminiStream.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
            break;
          }
          buffer += decoder.decode(value, { stream: true });
          let newlineIndex: number;
          while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, newlineIndex).replace(/\r$/, "");
            buffer = buffer.slice(newlineIndex + 1);
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr || jsonStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                const chunk = { choices: [{ delta: { content: text } }] };
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
              }
            } catch { /* skip malformed chunk */ }
          }
        }
      } catch (err) {
        controller.error(err);
      }
    },
  });
}


serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });


  try {
    const { notes, action } = await req.json();
    if (!notes || !action) {
      return new Response(JSON.stringify({ error: "Missing notes or action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }


    const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_KEY) throw new Error("GEMINI_API_KEY is not configured");


    const prompts: Record<string, string> = {
      explain: `You are a friendly tutor. Explain the following study notes in very simple, easy-to-understand language. Use analogies and examples. Break complex ideas into small pieces. Use markdown formatting with headings and bullet points.\n\nNotes:\n${notes}`,
      summarize: `Provide a concise summary of the following study notes. Keep it brief but cover all important topics. Use markdown formatting with headings.\n\nNotes:\n${notes}`,
      keypoints: `Extract the most important key points from the following study notes. Return them as a well-organized bullet point list using markdown. Group related points under headings if applicable.\n\nNotes:\n${notes}`,
    };


    const userPrompt = prompts[action];
    if (!userPrompt) {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }


    const body = {
      systemInstruction: {
        parts: [{ text: "You are a helpful AI study assistant. Keep responses clear, educational, and student-friendly. Use markdown formatting." }],
      },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    };


    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${GEMINI_KEY}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
    );


    if (!res.ok) {
      if (res.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (res.status === 402) return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await res.text();
      console.error("Gemini error:", res.status, t);
      return new Response(JSON.stringify({ error: "Gemini API error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }


    return new Response(geminiToOpenAIStream(res.body!), {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("notes error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});



