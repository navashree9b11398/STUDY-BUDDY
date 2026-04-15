import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";


interface Message {
  role: "user" | "assistant";
  content: string;
}


export default function ChatAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm your AI study assistant. Ask me anything about your courses, concepts, or academic questions. 📚" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);


  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setLoading(true);


    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: allMessages.filter((_, i) => i > 0).map(m => ({ role: m.role, content: m.content })) }),
        }
      );


      if (response.status === 429) { toast.error("Rate limit reached. Please wait a moment."); setLoading(false); return; }
      if (response.status === 402) { toast.error("AI credits exhausted."); setLoading(false); return; }
      if (!response.ok || !response.body) throw new Error("Failed to get response");


      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantContent = "";


      setMessages(prev => [...prev, { role: "assistant", content: "" }]);


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
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              const updated = assistantContent;
              setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, content: updated } : m));
            }
          } catch {}
        }
      }
    } catch (err) {
      toast.error("Failed to get AI response");
      console.error(err);
    }
    setLoading(false);
  };


  const clearChat = () => {
    setMessages([{ role: "assistant", content: "Chat cleared! What would you like to study? 📚" }]);
  };


  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] page-enter">


      {/* Header */}
      <div className="mb-4 flex items-center justify-between animate-fade-in-up">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30 animate-pulse-glow">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Study Assistant</h1>
            <p className="text-xs text-muted-foreground">Powered by Gemini 2.5 Flash</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={clearChat} className="text-muted-foreground hover:text-destructive transition-colors">
          <Trash2 className="h-4 w-4 mr-1" /> Clear
        </Button>
      </div>


      {/* Chat area */}
      <Card className="flex-1 flex flex-col overflow-hidden border-0 shadow-xl animate-fade-in-up delay-75">
        <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 animate-gradient" />
        <CardContent className="flex-1 overflow-auto p-6 bg-muted/20 dark:bg-slate-900/40" ref={scrollRef}>
          <div className="space-y-5 max-w-3xl mx-auto">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end animate-slide-in-right" : "justify-start animate-slide-in-left"}`}
                style={{ animationDelay: `${Math.min(i * 30, 150)}ms` }}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0 mt-1 shadow-md">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                  msg.role === "user"
                    ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-md"
                    : "bg-card border dark:border-slate-700 rounded-bl-md"
                }`}>
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:mb-2 [&_ul]:mb-2 [&_ol]:mb-2 [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:rounded-lg">
                      <ReactMarkdown>{msg.content || "..."}</ReactMarkdown>
                    </div>
                  ) : (
                    <span className="whitespace-pre-wrap">{msg.content}</span>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center shrink-0 mt-1 shadow-md">
                    <User className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            ))}


            {/* Typing indicator */}
            {loading && messages[messages.length - 1]?.content === "" && (
              <div className="flex gap-3 justify-start animate-slide-in-left">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0 mt-1 shadow-md">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-card border dark:border-slate-700 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>


        {/* Input bar */}
        <div className="p-4 border-t dark:border-slate-800 bg-card">
          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            className="flex gap-2 max-w-3xl mx-auto"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your studies..."
              disabled={loading}
              className="flex-1 rounded-xl border-border/50 focus:border-primary transition-all duration-200 bg-background"
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-xl px-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/30 active:scale-95"
            >
              <Send className={`h-4 w-4 transition-transform duration-200 ${!loading && input.trim() ? "group-hover:translate-x-0.5" : ""}`} />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}



