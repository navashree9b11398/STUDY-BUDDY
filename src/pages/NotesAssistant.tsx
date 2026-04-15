import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, FileText, List, Lightbulb, Upload, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import * as pdfjsLib from "pdfjs-dist";


pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;


type Action = "explain" | "summarize" | "keypoints";


interface Results {
  explain?: string;
  summarize?: string;
  keypoints?: string;
}


async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((item: any) => item.str).join(" ");
    pages.push(text);
  }
  return pages.join("\n\n");
}


export default function NotesAssistant() {
  const [notes, setNotes] = useState("");
  const [results, setResults] = useState<Results>({});
  const [loading, setLoading] = useState<Action | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);


  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
    const isText = file.name.endsWith(".txt") || file.type.startsWith("text/");
    if (!isPdf && !isText) { toast.error("Please upload a PDF or text file"); return; }
    if (isPdf) {
      setFileLoading(true);
      try {
        const text = await extractPdfText(file);
        if (!text.trim()) { toast.error("Could not extract text. It may be a scanned/image PDF."); }
        else { setNotes(text); toast.success(`Extracted text from ${file.name}`); }
      } catch { toast.error("Failed to read PDF file"); }
      setFileLoading(false);
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => setNotes(ev.target?.result as string || "");
      reader.readAsText(file);
    }
    e.target.value = "";
  };


  const processNotes = async (action: Action) => {
    if (!notes.trim()) { toast.error("Please enter or upload notes first"); return; }
    setLoading(action);


    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ notes: notes.trim(), action }),
        }
      );


      if (response.status === 429) { toast.error("Rate limit reached."); setLoading(null); return; }
      if (response.status === 402) { toast.error("AI credits exhausted."); setLoading(null); return; }
      if (!response.ok || !response.body) throw new Error("Failed");


      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let content = "";


      setResults(prev => ({ ...prev, [action]: "" }));


      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) { content += delta; setResults(prev => ({ ...prev, [action]: content })); }
          } catch {}
        }
      }
    } catch { toast.error("Failed to process notes"); }
    setLoading(null);
  };


  const actions: { key: Action; label: string; icon: typeof Lightbulb; description: string; gradient: string }[] = [
    { key: "explain", label: "Explain Simply", icon: Lightbulb, description: "Get a simple, easy-to-understand explanation", gradient: "from-amber-500 to-orange-500" },
    { key: "summarize", label: "Generate Summary", icon: FileText, description: "Get a concise summary of your notes", gradient: "from-blue-500 to-cyan-500" },
    { key: "keypoints", label: "Key Points", icon: List, description: "Extract important bullet points", gradient: "from-emerald-500 to-teal-500" },
  ];


  const resultConfig = [
    { key: "summarize" as Action, label: "Summary", icon: FileText, gradient: "from-blue-500 to-cyan-500" },
    { key: "explain" as Action, label: "Simple Explanation", icon: Lightbulb, gradient: "from-amber-500 to-orange-500" },
    { key: "keypoints" as Action, label: "Key Points", icon: List, gradient: "from-emerald-500 to-teal-500" },
  ];


  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3 animate-fade-in-up">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
          <BookOpen className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">AI Notes Assistant</h1>
          <p className="text-sm text-muted-foreground">Paste notes or upload a PDF/text file for AI insights</p>
        </div>
      </div>


      {/* Input card */}
      <Card className="border-0 shadow-lg animate-fade-in-up delay-75 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
        <CardHeader>
          <CardTitle className="text-lg">Your Study Notes</CardTitle>
          <CardDescription>Paste your notes below or upload a PDF / text file</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Paste your study notes here..."
            className="min-h-[180px] resize-y transition-all duration-200 focus:shadow-md"
          />
          <div className="flex flex-wrap gap-2">
            <input ref={fileRef} type="file" accept=".pdf,.txt,text/*,application/pdf" className="hidden" onChange={handleFileUpload} />
            <Button
              variant="outline"
              onClick={() => fileRef.current?.click()}
              disabled={fileLoading}
              className="transition-all duration-200 hover:border-primary hover:text-primary hover:shadow-sm active:scale-95"
            >
              {fileLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              {fileLoading ? "Extracting..." : "Upload PDF / Text"}
            </Button>
            {notes && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setNotes(""); setResults({}); }}
                className="text-muted-foreground hover:text-destructive transition-colors duration-200"
              >
                <X className="h-4 w-4 mr-1" /> Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>


      {/* Action cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up delay-150">
        {actions.map(({ key, label, icon: Icon, description, gradient }, i) => (
          <Card
            key={key}
            className={`card-lift cursor-pointer border-0 shadow-md overflow-hidden group transition-all duration-300 ${loading === key ? "ring-2 ring-primary ring-offset-2" : ""}`}
            onClick={() => !loading && processNotes(key)}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className={`h-1 bg-gradient-to-r ${gradient} transition-all duration-300 group-hover:h-1.5`} />
            <CardContent className="p-5 flex flex-col items-center text-center gap-3">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                {loading === key
                  ? <Loader2 className="h-5 w-5 text-white animate-spin" />
                  : <Icon className="h-5 w-5 text-white" />
                }
              </div>
              <div>
                <p className="font-semibold text-sm">{label}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>


      {/* Results */}
      {(results.summarize || results.explain || results.keypoints) && (
        <div className="space-y-4">
          {resultConfig.map(({ key, label, icon: Icon, gradient }) =>
            results[key] ? (
              <Card key={key} className="border-0 shadow-lg animate-fade-in-up overflow-hidden">
                <div className={`h-1 bg-gradient-to-r ${gradient}`} />
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    {label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:mb-3 [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs">
                    <ReactMarkdown>{results[key]!}</ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}



