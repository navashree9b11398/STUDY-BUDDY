import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Code2, Sparkles, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";


export default function AIExplainer() {
  const [code, setCode] = useState("");
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);


  const explain = async () => {
    if (!code.trim()) { toast.error("Please paste some code first"); return; }
    setLoading(true);
    setExplanation("");


    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/explainer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ code: code.trim() }),
        }
      );


      if (response.status === 429) { toast.error("Rate limit reached."); setLoading(false); return; }
      if (response.status === 402) { toast.error("AI credits exhausted."); setLoading(false); return; }
      if (!response.ok || !response.body) throw new Error("Failed to get response");


      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let content = "";


      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              content += delta;
              setExplanation(content);
              outputRef.current?.scrollTo({ top: outputRef.current.scrollHeight, behavior: "smooth" });
            }
          } catch {}
        }
      }
    } catch {
      toast.error("Failed to generate explanation");
    }
    setLoading(false);
  };


  const reset = () => { setCode(""); setExplanation(""); };


  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3 animate-fade-in-up">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <Code2 className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">AI Code Explainer</h1>
          <p className="text-sm text-muted-foreground">Paste any code and get a simple, clear explanation</p>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <Card className="border-0 shadow-lg animate-fade-in-up delay-75 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-indigo-500 to-blue-500" />
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Code2 className="h-4 w-4 text-primary" /> Your Code
            </CardTitle>
            <CardDescription>Paste the code you want explained</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={`# Paste any code here, e.g.:\ndef fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)`}
              className="min-h-[300px] font-mono text-sm resize-y transition-all duration-200 focus:shadow-md bg-slate-950/5 dark:bg-slate-950/40"
            />
            <div className="flex gap-2">
              <Button
                onClick={explain}
                disabled={loading || !code.trim()}
                className="flex-1 sm:flex-none bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/30 active:scale-95"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Explaining...</>
                ) : (
                  <><Sparkles className="h-4 w-4 mr-2" /> Explain Code</>
                )}
              </Button>
              {(code || explanation) && (
                <Button variant="outline" onClick={reset} size="icon" className="hover:border-destructive hover:text-destructive transition-all duration-200 active:scale-90">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>


        {/* Output */}
        <Card className="border-0 shadow-lg animate-fade-in-up delay-150 overflow-hidden">
          <div className={`h-1 bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500 ${loading ? "animate-gradient" : ""}`} />
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Explanation
            </CardTitle>
            <CardDescription>AI-generated breakdown of your code</CardDescription>
          </CardHeader>
          <CardContent>
            {!explanation && !loading ? (
              <div className="min-h-[300px] flex flex-col items-center justify-center text-center gap-4 text-muted-foreground animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center animate-float">
                  <Code2 className="h-8 w-8 opacity-30" />
                </div>
                <div>
                  <p className="font-medium text-sm">Ready to explain your code</p>
                  <p className="text-xs mt-1">Paste code and click <strong>Explain Code</strong></p>
                </div>
              </div>
            ) : (
              <div ref={outputRef} className="min-h-[300px] max-h-[500px] overflow-y-auto animate-fade-in">
                <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:mb-3 [&_ul]:mb-3 [&_ol]:mb-3 [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_pre]:bg-slate-950 [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:overflow-x-auto">
                  <ReactMarkdown>{explanation || "..."}</ReactMarkdown>
                </div>
                {loading && (
                  <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-bounce [animation-delay:300ms]" />
                    </div>
                    <span>Generating explanation...</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



