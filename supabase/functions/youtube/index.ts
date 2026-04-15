import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Extract YouTube video ID from any URL format ───────────────────────────
function extractVideoId(url: string): string | null {
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /embed\/([a-zA-Z0-9_-]{11})/,
    /shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

// ─── Fetch captions from a caption URL (JSON3 then XML) ─────────────────────
async function fetchCaptionsFromUrl(captionUrl: string): Promise<string | null> {
  // Try JSON3 format first
  try {
    const jsonRes = await fetch(captionUrl + "&fmt=json3");
    if (jsonRes.ok) {
      const data = await jsonRes.json();
      const text = (data.events as any[])
        ?.filter((e: any) => e.segs)
        ?.map((e: any) =>
          (e.segs as any[]).map((s: any) => (s.utf8 || "").replace(/\n/g, " ")).join("")
        )
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      if (text) return text;
    }
  } catch { /* fall through */ }

  // XML fallback
  try {
    const xmlRes = await fetch(captionUrl);
    if (!xmlRes.ok) return null;
    const xml = await xmlRes.text();
    const texts = [...xml.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) =>
      m[1]
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
    );
    const text = texts.join(" ").replace(/\s+/g, " ").trim();
    return text || null;
  } catch {
    return null;
  }
}

// ─── Method 1: YouTube InnerTube API (Android client — bypasses bot detection)
async function fetchTranscriptInnerTube(videoId: string): Promise<{ transcript: string; title: string } | null> {
  try {
    const playerRes = await fetch("https://www.youtube.com/youtubei/v1/player", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "com.google.android.youtube/17.36.4 (Linux; U; Android 12; GB) gzip",
        "X-YouTube-Client-Name": "3",
        "X-YouTube-Client-Version": "17.36.4",
        "Origin": "https://www.youtube.com",
      },
      body: JSON.stringify({
        videoId,
        context: {
          client: {
            clientName: "ANDROID",
            clientVersion: "17.36.4",
            androidSdkVersion: 31,
            hl: "en",
            gl: "US",
          },
        },
      }),
    });

    if (!playerRes.ok) return null;
    const data = await playerRes.json();

    const title = data?.videoDetails?.title || "YouTube Video";
    const tracks: any[] = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
    if (tracks.length === 0) return null;

    // Prefer English (manual then auto-generated), then first available
    const track =
      tracks.find((t) => t.languageCode === "en" && t.kind !== "asr") ||
      tracks.find((t) => t.languageCode === "en") ||
      tracks.find((t) => t.languageCode?.startsWith("en")) ||
      tracks[0];

    if (!track?.baseUrl) return null;

    const transcript = await fetchCaptionsFromUrl(track.baseUrl);
    if (!transcript) return null;
    return { transcript, title };
  } catch {
    return null;
  }
}

// ─── Method 2: Scrape the YouTube watch page (fallback) ─────────────────────
async function fetchTranscriptScrape(videoId: string): Promise<{ transcript: string; title: string }> {
  const res = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=en&gl=US`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Cookie": "CONSENT=YES+cb; SOCS=CAI; YSC=1; VISITOR_INFO1_LIVE=1",
    },
  });

  if (!res.ok) throw new Error("Could not access YouTube video. Check the URL and try again.");
  const html = await res.text();

  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  const title = titleMatch ? titleMatch[1].replace(" - YouTube", "").trim() : "YouTube Video";

  const captionIdx = html.indexOf('"captionTracks"');
  if (captionIdx === -1) {
    if (html.includes("consent.youtube.com") || html.includes("Before you continue")) {
      throw new Error("YouTube is blocking server access. Please try again in a moment.");
    }
    throw new Error("This video has no captions or subtitles. Try a video that has CC enabled.");
  }

  const urlIdx = html.indexOf('"baseUrl":"', captionIdx);
  if (urlIdx === -1) throw new Error("Could not extract caption URL from video page.");

  const urlEnd = html.indexOf('"', urlIdx + 11);
  const rawUrl = html
    .slice(urlIdx + 11, urlEnd)
    .replace(/\\u0026/g, "&")
    .replace(/\\\//g, "/")
    .replace(/\\/g, "");

  const transcript = await fetchCaptionsFromUrl(rawUrl);
  if (!transcript) throw new Error("Transcript is empty. The video may have image-only captions.");
  return { transcript, title };
}

// ─── Fetch transcript: InnerTube first, HTML scraping as fallback ─────────────
async function fetchTranscript(videoId: string): Promise<{ transcript: string; title: string }> {
  const innerTubeResult = await fetchTranscriptInnerTube(videoId);
  if (innerTubeResult) return innerTubeResult;
  return fetchTranscriptScrape(videoId);
}

// ─── Transform Gemini SSE → OpenAI-style SSE ────────────────────────────────
function streamGemini(geminiStream: ReadableStream, prefix?: string): ReadableStream {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let buffer = "";
  let prefixSent = false;

  return new ReadableStream({
    async start(controller) {
      // Emit prefix event if provided (used to send transcript metadata)
      if (prefix) {
        controller.enqueue(encoder.encode(prefix));
      }

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
          let idx: number;
          while ((idx = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, idx).replace(/\r$/, "");
            buffer = buffer.slice(idx + 1);
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
            } catch { /* skip malformed */ }
          }
        }
      } catch (err) {
        controller.error(err);
      }
    },
  });
}

// ─── Main handler ────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { videoUrl, transcript: providedTranscript, messages } = await req.json();
    const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_KEY) throw new Error("GEMINI_API_KEY is not configured");

    // ── Mode 2: Follow-up chat (transcript already fetched by frontend) ──────
    if (providedTranscript && messages) {
      const contents = (messages as { role: string; content: string }[]).map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      const body = {
        systemInstruction: {
          parts: [{
            text: `You are an AI tutor helping a student understand a YouTube video.

Video transcript (may be truncated):
---
${providedTranscript.slice(0, 18000)}
---

Answer questions about this video clearly and concisely. Reference specific parts of the video when helpful. If a question is not covered in the transcript, say so politely. Use markdown for formatting.`,
          }],
        },
        contents,
      };

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${GEMINI_KEY}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
      );

      if (!res.ok) {
        if (res.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error("Gemini API error");
      }

      return new Response(streamGemini(res.body!), {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // ── Mode 1: Fetch transcript + stream summary ────────────────────────────
    if (!videoUrl) {
      return new Response(JSON.stringify({ error: "No video URL provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      return new Response(JSON.stringify({ error: "Invalid YouTube URL. Paste a full youtube.com or youtu.be link." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let transcriptData: { transcript: string; title: string };
    try {
      transcriptData = await fetchTranscript(videoId);
    } catch (e) {
      return new Response(
        JSON.stringify({ error: e instanceof Error ? e.message : "Failed to fetch transcript" }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { transcript, title } = transcriptData;

    // Send transcript metadata as first SSE event so frontend can store it
    const metaEvent = `data: ${JSON.stringify({ type: "meta", title, transcript: transcript.slice(0, 25000) })}\n\n`;

    const summaryBody = {
      systemInstruction: {
        parts: [{ text: "You are an AI tutor helping students understand educational video content. Be clear, structured, and highlight key learning points. Use markdown." }],
      },
      contents: [{
        role: "user",
        parts: [{
          text: `Summarize this YouTube video titled "${title}" for a student.

Transcript:
${transcript.slice(0, 15000)}

Structure your summary using these sections:
## Overview
A 2-3 sentence description of what this video is about.

## Key Concepts
The main topics and concepts covered.

## Important Takeaways
Bullet points of the most important things to remember.

## Conclusion
What was demonstrated or concluded.`,
        }],
      }],
    };

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${GEMINI_KEY}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(summaryBody) }
    );

    if (!geminiRes.ok) {
      if (geminiRes.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("Gemini API error during summarization");
    }

    return new Response(streamGemini(geminiRes.body!, metaEvent), {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (e) {
    console.error("youtube error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

