import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Wand2, RotateCcw, Edit3, Check, X } from "lucide-react";
import { useTimetable } from "@/hooks/useTimetable";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Subject {
  id: string;
  name: string;
  hours: number;
  difficulty: 'easy' | 'medium' | 'hard';
  examDate: string; // ISO date string, can be empty
}

interface DraftSlot {
  id: string;
  subject: string;
  time_slot: string;
  duration: string;
  sort_order: number;
  colorClass: string;
}

const subjectColorClasses = [
  "from-sky-500 to-indigo-500",
  "from-fuchsia-500 to-violet-500",
  "from-cyan-500 to-sky-500",
  "from-emerald-500 to-teal-500",
  "from-violet-500 to-fuchsia-500",
];

const formatTime = (h: number) => {
  const hour = Math.floor(h);
  const min = (h % 1) * 60;
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${min === 0 ? "00" : "30"} ${ampm}`;
};

// Weekly timetable generator based on priority and exam dates
const generateWeeklyTimetable = (subjects: Subject[]) => {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const weeklySchedule: Array<{ day: string; subject: string; hours: number; difficulty: string; examDate: string }> = [];

  // Difficulty weight mapping (for priority)
  const difficultyWeight: Record<string, number> = {
    hard: 3,
    medium: 2,
    easy: 1,
  };

  // Sort subjects: exam date first, then by difficulty (priority)
  const sortedSubjects = [...subjects].sort((a, b) => {
    if (a.examDate && b.examDate) {
      return new Date(a.examDate).getTime() - new Date(b.examDate).getTime();
    }
    if (a.examDate) return -1;
    if (b.examDate) return 1;
    return (difficultyWeight[b.difficulty] || 0) - (difficultyWeight[a.difficulty] || 0);
  });

  let dayIndex = 0;

  // Distribute subjects across the week based on priority
  for (const subject of sortedSubjects) {
    const hours = Math.max(0.5, subject.hours || 1);
    let remainingHours = hours;

    // High difficulty → 2 sessions per week, Medium → 1-1.5, Low → 1
    const sessionsPerWeek = subject.difficulty === "hard" ? 2 : subject.difficulty === "medium" ? 1.5 : 1;
    const hoursPerSession = hours / Math.ceil(sessionsPerWeek);

    // Add multiple sessions for high-priority subjects
    for (let session = 0; session < Math.ceil(sessionsPerWeek); session += 1) {
      if (dayIndex >= days.length) dayIndex = 0; // Wrap around if needed

      const sessionHours = Math.min(hoursPerSession, remainingHours);
      weeklySchedule.push({
        day: days[dayIndex],
        subject: subject.name,
        hours: Number(sessionHours.toFixed(1)),
        difficulty: subject.difficulty,
        examDate: subject.examDate,
      });

      remainingHours -= sessionHours;
      dayIndex += 1;
    }
  }

  return weeklySchedule;
};

const computeSchedule = (subjects: Subject[]) => {
  const slots: DraftSlot[] = [];
  let currentHour = 8;

  // Difficulty weight mapping
  const difficultyWeight: Record<string, number> = {
    hard: 3,
    medium: 2,
    easy: 1,
  };

  // Sort subjects intelligently: exam date first, then by difficulty
  const sortedSubjects = [...subjects].sort((a, b) => {
    // If both have exam dates, sort by earliest date
    if (a.examDate && b.examDate) {
      return new Date(a.examDate).getTime() - new Date(b.examDate).getTime();
    }
    // If only one has exam date, it comes first
    if (a.examDate) return -1;
    if (b.examDate) return 1;
    // If neither has exam date, sort by difficulty (hard > medium > easy)
    return (difficultyWeight[b.difficulty] || 0) - (difficultyWeight[a.difficulty] || 0);
  });

  for (let index = 0; index < sortedSubjects.length; index += 1) {
    const subject = sortedSubjects[index];
    const duration = Math.max(0.5, subject.hours || 1);
    const startHour = currentHour;
    const endHour = currentHour + duration;

    slots.push({
      id: subject.id,
      subject: subject.name,
      time_slot: `${formatTime(startHour)} - ${formatTime(endHour)}`,
      duration: `${duration}h`,
      sort_order: index,
      colorClass: subjectColorClasses[index % subjectColorClasses.length],
    });

    currentHour = endHour + 0.5;
  }

  return slots;
};

export default function Timetable() {
  const { entries, isLoading, saveSchedule, clearTimetable } = useTimetable();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [name, setName] = useState("");
  const [hours, setHours] = useState("");
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [examDate, setExamDate] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editHours, setEditHours] = useState("");
  const [editDifficulty, setEditDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [editExamDate, setEditExamDate] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (subjects.length === 0 && entries.length > 0) {
      const uniqueSubjects = Array.from(
        new Map(entries.map((entry) => [entry.subject, entry])).values(),
      ).map((entry) => ({
        id: crypto.randomUUID(),
        name: entry.subject,
        hours: parseFloat(entry.duration) || 1,
        difficulty: 'medium' as const,
        examDate: '',
      }));

      if (uniqueSubjects.length > 0) {
        setSubjects(uniqueSubjects);
      }
    }
  }, [entries, subjects.length]);

  const generatedSchedule = useMemo(() => computeSchedule(subjects), [subjects]);
  const weeklySchedule = useMemo(() => generateWeeklyTimetable(subjects), [subjects]);

  const addSubject = () => {
    const trimmedName = name.trim();
    const parsedHours = parseFloat(hours);
    if (!trimmedName) return;
    setSubjects((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        name: trimmedName,
        hours: Number.isFinite(parsedHours) && parsedHours > 0 ? parsedHours : 1,
        difficulty: difficulty,
        examDate: examDate,
      },
    ]);
    setName("");
    setHours("");
    setDifficulty("medium");
    setExamDate("");
  };

  const startEdit = (subject: Subject) => {
    setEditingId(subject.id);
    setEditName(subject.name);
    setEditHours(subject.hours.toString());
    setEditDifficulty(subject.difficulty);
    setEditExamDate(subject.examDate);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const trimmedName = editName.trim();
    const parsedHours = parseFloat(editHours);
    if (!trimmedName) return;

    setSubjects((current) =>
      current.map((subject) =>
        subject.id === editingId
          ? {
              ...subject,
              name: trimmedName,
              hours: Number.isFinite(parsedHours) && parsedHours > 0 ? parsedHours : 1,
              difficulty: editDifficulty,
              examDate: editExamDate,
            }
          : subject,
      ),
    );
    setEditingId(null);
    setEditName("");
    setEditHours("");
    setEditDifficulty("medium");
    setEditExamDate("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditHours("");
    setEditDifficulty("medium");
    setEditExamDate("");
  };

  const removeSubject = (id: string) => {
    setSubjects((current) => current.filter((subject) => subject.id !== id));
    if (editingId === id) cancelEdit();
  };

  const handleSaveSchedule = () => {
    if (generatedSchedule.length === 0) return;
    saveSchedule(
      generatedSchedule.map(({ subject, time_slot, duration, sort_order }) => ({
        subject,
        time_slot,
        duration,
        sort_order,
      })),
    );
  };

  const handleClear = () => {
    clearTimetable();
    setSubjects([]);
    setEditingId(null);
  };

  const handleDeleteTimetable = () => {
    handleClear();
    setShowDeleteConfirm(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-sky-500/20 via-violet-500/10 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-24 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="pointer-events-none absolute left-0 top-72 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-12 sm:px-6 lg:px-8">
        <section className="mb-10 rounded-[2rem] border border-white/10 bg-slate-900/80 p-8 shadow-2xl shadow-slate-900/20 backdrop-blur-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <p className="inline-flex rounded-full bg-sky-500/10 px-4 py-1 text-sm font-medium text-sky-200">StudyBuddy Timetable</p>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Build a smarter weekly plan in seconds</h1>
              <p className="max-w-xl text-sm leading-6 text-slate-300">
                Add subjects, tune hours, and preview your timetable instantly. The schedule regenerates live while keeping every subject in place.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-3xl bg-white/5 p-4 shadow-inner shadow-slate-950/20">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-500 to-violet-500 text-white shadow-lg shadow-sky-500/30">
                <Wand2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium">Real-time planning</p>
                <p className="text-xs text-slate-400">Subjects update instantly as you add or edit.</p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
          <Card className="overflow-hidden border-white/10 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),transparent_35%)]">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Subject Planner</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-[1.4fr_0.8fr_auto]">
                <div>
                  <Label className="text-slate-300">Subject</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Chemistry" className="bg-slate-950/70 border-white/10 text-white" />
                </div>
                <div>
                  <Label className="text-slate-300">Hours</Label>
                  <Input type="number" min="0.5" step="0.5" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="1.5" className="bg-slate-950/70 border-white/10 text-white" />
                </div>
                <div className="flex items-end">
                  <Button onClick={addSubject} className="w-full bg-gradient-to-r from-sky-500 to-violet-500 text-white shadow-lg shadow-sky-500/20 hover:brightness-110">
                    <Plus className="mr-2 h-4 w-4" />Add Subject
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label className="text-slate-300">Difficulty</Label>
                  <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')} className="w-full rounded-lg bg-slate-950/70 border border-white/10 text-white px-3 py-2 text-sm">
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <Label className="text-slate-300">Exam Date (Optional)</Label>
                  <Input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} className="bg-slate-950/70 border-white/10 text-white" />
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-4 shadow-inner shadow-slate-950/10">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Current subjects</h2>
                  <p className="text-xs text-slate-400">{subjects.length} subjects</p>
                </div>

                {subjects.length === 0 ? (
                  <p className="rounded-3xl bg-white/5 px-4 py-6 text-sm text-slate-400">Add a subject to see your timetable regenerate instantly.</p>
                ) : (
                  <div className="space-y-3">
                    {subjects.map((subject, index) => {
                      const isEditing = editingId === subject.id;
                      const accent = subjectColorClasses[index % subjectColorClasses.length];
                      return (
                        <div key={subject.id} className="group rounded-3xl border border-white/10 bg-slate-900/90 p-4 transition hover:-translate-y-0.5 hover:border-slate-200/10">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex-1 space-y-2">
                              {isEditing ? (
                                <div className="grid gap-3 sm:grid-cols-2">
                                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="bg-slate-950/70 border-white/10 text-white" />
                                  <Input value={editHours} onChange={(e) => setEditHours(e.target.value)} className="bg-slate-950/70 border-white/10 text-white" />
                                  <select value={editDifficulty} onChange={(e) => setEditDifficulty(e.target.value as 'easy' | 'medium' | 'hard')} className="w-full rounded-lg bg-slate-950/70 border border-white/10 text-white px-3 py-2 text-sm">
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                  </select>
                                  <Input type="date" value={editExamDate} onChange={(e) => setEditExamDate(e.target.value)} className="bg-slate-950/70 border-white/10 text-white" />
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-center gap-2">
                                    <span className={`inline-flex rounded-full bg-gradient-to-r ${accent} px-3 py-1 text-xs font-semibold text-white shadow-sm shadow-slate-900/30`}>Subject</span>
                                    <p className="text-base font-semibold text-white">{subject.name}</p>
                                  </div>
                                  <p className="text-sm text-slate-400">{subject.hours} hour{subject.hours !== 1 ? "s" : ""} session</p>
                                </>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {isEditing ? (
                                <>
                                  <Button onClick={saveEdit} size="icon" className="bg-emerald-500 text-white hover:brightness-110">
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button onClick={cancelEdit} variant="ghost" size="icon" className="text-slate-300 hover:text-white">
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button onClick={() => startEdit(subject)} variant="ghost" size="icon" className="text-slate-300 hover:text-white">
                                    <Edit3 className="h-4 w-4" />
                                  </Button>
                                  <Button onClick={() => removeSubject(subject.id)} variant="ghost" size="icon" className="text-rose-400 hover:text-white">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="rounded-3xl bg-white/5 p-4 text-sm text-slate-300">
                  Your timetable preview updates every time you add, edit, or remove a subject.
                </div>
                <Button onClick={handleSaveSchedule} disabled={generatedSchedule.length === 0} className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20 hover:brightness-110 sm:w-auto">
                  <Wand2 className="mr-2 h-4 w-4" /> Save timetable
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-white/10 bg-[radial-gradient(circle_at_top,_rgba(192,132,252,0.12),transparent_40%)]">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Live timetable</CardTitle>
            </CardHeader>
            <CardContent>
              {generatedSchedule.length === 0 ? (
                <p className="rounded-3xl bg-slate-950/80 p-8 text-center text-sm text-slate-400">Your schedule preview will appear here as soon as you add subjects.</p>
              ) : (
                <Tabs defaultValue="daily">
                  <TabsList className="mb-4 bg-slate-900/80 border border-white/10">
                    <TabsTrigger value="daily" className="data-[state=active]:bg-sky-500/20 data-[state=active]:text-sky-200">Daily View</TabsTrigger>
                    <TabsTrigger value="weekly" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-200">Weekly View</TabsTrigger>
                  </TabsList>

                  {/* Daily View */}
                  <TabsContent value="daily">
                    <div className="grid gap-4">
                      {generatedSchedule.map((slot) => (
                        <div key={slot.id} className={`overflow-hidden rounded-3xl border border-white/10 bg-slate-900/90 p-5 shadow-lg shadow-slate-950/20 transition duration-300 hover:-translate-y-1`}>
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">{slot.time_slot}</p>
                              <h3 className="mt-3 text-lg font-semibold text-white">{slot.subject}</h3>
                            </div>
                            <span className={`rounded-2xl bg-gradient-to-r ${slot.colorClass} px-3 py-1 text-xs font-semibold text-white shadow-md shadow-slate-950/20`}>{slot.duration}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Weekly View */}
                  <TabsContent value="weekly">
                    <div className="grid gap-4">
                      {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => {
                        const daySlots = weeklySchedule.filter((s) => s.day === day);
                        if (daySlots.length === 0) return null;
                        return (
                          <div key={day} className="rounded-3xl border border-white/10 bg-slate-900/90 p-4">
                            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-sky-300">{day}</p>
                            <div className="flex flex-wrap gap-2">
                              {daySlots.map((slot, i) => {
                                const accent = subjectColorClasses[subjects.findIndex((s) => s.name === slot.subject) % subjectColorClasses.length] || subjectColorClasses[0];
                                const difficultyColor = slot.difficulty === "hard" ? "bg-rose-500/20 text-rose-300" : slot.difficulty === "medium" ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/20 text-emerald-300";
                                return (
                                  <div key={i} className={`flex-1 min-w-[120px] rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-3`}>
                                    <span className={`inline-flex rounded-full bg-gradient-to-r ${accent} px-2 py-0.5 text-xs font-semibold text-white mb-2`}>
                                      {slot.hours}h
                                    </span>
                                    <p className="text-sm font-semibold text-white">{slot.subject}</p>
                                    <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${difficultyColor}`}>
                                      {slot.difficulty}
                                    </span>
                                    {slot.examDate && (
                                      <p className="mt-1 text-xs text-slate-400">Exam: {slot.examDate}</p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>

        {entries.length > 0 && (
          <Card className="mt-6 border-white/10 bg-slate-900/80">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-semibold">Saved timetable</CardTitle>
              <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="bg-rose-600 text-white hover:bg-rose-700">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Timetable?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete the timetable? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteTimetable} className="bg-rose-600 text-white hover:bg-rose-700">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {entries.map((slot) => (
                  <div key={slot.id} className="flex items-center justify-between rounded-3xl border border-white/10 bg-slate-950/80 p-4 transition hover:bg-slate-900/95">
                    <div>
                      <p className="text-sm font-medium text-white">{slot.subject}</p>
                      <p className="text-xs text-slate-400">{slot.time_slot}</p>
                    </div>
                    <span className="rounded-full bg-slate-700/80 px-3 py-1 text-xs font-semibold text-slate-200">{slot.duration}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
