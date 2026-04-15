import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Eye, EyeOff, BrainCircuit, CheckCircle2, XCircle, Trophy, RotateCcw } from "lucide-react";
import { toast } from "sonner";


interface Question {
  question: string;
  options: { A: string; B: string; C: string; D: string };
  answer: "A" | "B" | "C" | "D";
}


export default function Quiz() {
  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState("5");
  const [difficulty, setDifficulty] = useState("medium");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [selected, setSelected] = useState<Record<number, string>>({});


  const generate = async () => {
    if (!topic.trim()) { toast.error("Please enter a topic or study notes"); return; }
    setLoading(true);
    setQuestions([]);
    setShowAnswers(false);
    setSelected({});


    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/quiz`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ topic: topic.trim(), numQuestions: parseInt(numQuestions), difficulty }),
      });


      if (res.status === 429) { toast.error("Rate limit reached. Please wait."); setLoading(false); return; }
      if (res.status === 402) { toast.error("AI credits exhausted."); setLoading(false); return; }
      if (!res.ok) throw new Error("Failed to generate quiz");


      const data = await res.json();
      if (data.questions?.length) {
        setQuestions(data.questions);
        toast.success(`Generated ${data.questions.length} questions!`);
      } else {
        toast.error("No questions generated. Try a different topic.");
      }
    } catch {
      toast.error("Failed to generate quiz");
    }
    setLoading(false);
  };


  const reset = () => {
    setQuestions([]);
    setSelected({});
    setShowAnswers(false);
    setTopic("");
  };


  const score = questions.length > 0 && showAnswers
    ? questions.reduce((acc, q, i) => acc + (selected[i] === q.answer ? 1 : 0), 0)
    : null;


  const scorePercent = score !== null ? Math.round((score / questions.length) * 100) : null;
  const scoreColor = scorePercent !== null
    ? scorePercent >= 80 ? "text-emerald-500" : scorePercent >= 60 ? "text-amber-500" : "text-destructive"
    : "";


  const difficultyColors: Record<string, string> = {
    easy: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
    medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
    hard: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  };


  return (
    <div className="space-y-6 page-enter">
      <div className="animate-fade-in-up">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <BrainCircuit className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Quiz Generator</h1>
            <p className="text-sm text-muted-foreground">Generate practice quizzes from any topic</p>
          </div>
        </div>
      </div>


      {/* Config card */}
      <Card className="border-0 shadow-lg animate-fade-in-up delay-75 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-violet-500 to-purple-600" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BrainCircuit className="h-5 w-5 text-primary" /> Configure Quiz
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Topic or Study Notes</Label>
            <Textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter a topic (e.g. 'Photosynthesis') or paste your study notes..."
              className="mt-1.5 min-h-[100px] resize-y transition-all duration-200 focus:shadow-md"
            />
          </div>
          <div className="flex gap-4 flex-wrap">
            <div className="space-y-1.5">
              <Label>Questions</Label>
              <Select value={numQuestions} onValueChange={setNumQuestions}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 Questions</SelectItem>
                  <SelectItem value="10">10 Questions</SelectItem>
                  <SelectItem value="15">15 Questions</SelectItem>
                  <SelectItem value="20">20 Questions</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Difficulty</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={generate}
              disabled={loading || !topic.trim()}
              className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/30 active:scale-95"
            >
              {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Generating...</> : "Generate Quiz"}
            </Button>
            {questions.length > 0 && (
              <Button variant="outline" onClick={reset} className="transition-all duration-200 hover:border-destructive hover:text-destructive">
                <RotateCcw className="h-4 w-4 mr-2" /> Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>


      {/* Questions */}
      {questions.length > 0 && (
        <div className="space-y-4 animate-fade-in-up">
          {/* Score bar */}
          <div className="flex items-center justify-between flex-wrap gap-3 p-4 rounded-2xl bg-card border shadow-sm">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">Quiz</h2>
              <span className={`text-xs px-2 py-1 rounded-full font-semibold ${difficultyColors[difficulty]}`}>
                {difficulty}
              </span>
              <span className="text-xs text-muted-foreground">{questions.length} questions</span>
            </div>
            <div className="flex gap-2 items-center">
              {score !== null && (
                <div className="flex items-center gap-2 animate-scale-in">
                  <Trophy className={`h-5 w-5 ${scoreColor}`} />
                  <span className={`text-lg font-bold ${scoreColor}`}>{score}/{questions.length}</span>
                  <span className={`text-sm font-semibold ${scoreColor}`}>({scorePercent}%)</span>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAnswers(!showAnswers)}
                className="transition-all duration-200 hover:shadow-md"
              >
                {showAnswers ? <><EyeOff className="h-4 w-4 mr-1" /> Hide</> : <><Eye className="h-4 w-4 mr-1" /> Reveal</>}
              </Button>
            </div>
          </div>


          {/* Question cards */}
          {questions.map((q, i) => (
            <Card
              key={i}
              className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200 animate-fade-in-up overflow-hidden"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className={`h-0.5 bg-gradient-to-r ${i % 3 === 0 ? "from-blue-500 to-cyan-500" : i % 3 === 1 ? "from-violet-500 to-purple-500" : "from-emerald-500 to-teal-500"}`} />
              <CardContent className="pt-5 space-y-4">
                <p className="font-semibold text-sm leading-relaxed">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold mr-2">{i + 1}</span>
                  {q.question}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(["A", "B", "C", "D"] as const).map((key) => {
                    const isSelected = selected[i] === key;
                    const isCorrect = q.answer === key;


                    let cls = "justify-start text-left h-auto py-2.5 px-3 whitespace-normal text-sm font-normal transition-all duration-200 border rounded-xl ";
                    if (showAnswers && isCorrect) {
                      cls += "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-400 text-emerald-700 dark:text-emerald-300 shadow-sm";
                    } else if (showAnswers && isSelected && !isCorrect) {
                      cls += "bg-red-50 dark:bg-red-900/30 border-red-400 text-red-700 dark:text-red-300";
                    } else if (isSelected) {
                      cls += "bg-primary/10 border-primary text-primary shadow-sm";
                    } else {
                      cls += "border-border hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm active:scale-[0.98]";
                    }


                    return (
                      <button
                        key={key}
                        className={cls}
                        onClick={() => !showAnswers && setSelected((p) => ({ ...p, [i]: key }))}
                        disabled={showAnswers}
                      >
                        <span className="font-bold mr-2 text-xs opacity-60">{key}.</span>
                        <span className="flex-1">{q.options[key]}</span>
                        {showAnswers && isCorrect && <CheckCircle2 className="h-4 w-4 ml-auto shrink-0 text-emerald-500 animate-scale-in" />}
                        {showAnswers && isSelected && !isCorrect && <XCircle className="h-4 w-4 ml-auto shrink-0 text-red-500 animate-scale-in" />}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}



