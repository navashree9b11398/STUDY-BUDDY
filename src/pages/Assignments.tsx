import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAssignments } from "@/hooks/useAssignments";
import { differenceInDays, format } from "date-fns";
import { Plus, Trash2, Check, AlertTriangle, ClipboardList, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


export default function Assignments() {
  const { assignments, isLoading, addAssignment, removeAssignment, toggleComplete, clearAll } = useAssignments();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ subject: "", title: "", deadline: "" });


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject || !form.title || !form.deadline) return;
    addAssignment(form);
    setForm({ subject: "", title: "", deadline: "" });
    setOpen(false);
  };


  const active = assignments.filter((a) => !a.completed);
  const completed = assignments.filter((a) => a.completed);


  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between animate-fade-in-up">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <ClipboardList className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Assignment Manager</h1>
            <p className="text-sm text-muted-foreground">Track your deadlines</p>
          </div>
        </div>
        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={assignments.length === 0} className="transition-all duration-200 hover:border-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />Clear All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="animate-scale-in">
              <AlertDialogHeader>
                <AlertDialogTitle>Clear all assignments?</AlertDialogTitle>
                <AlertDialogDescription>This will permanently delete all assignments. This action cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={clearAll} className="bg-destructive hover:bg-destructive/90">Delete All</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/30 active:scale-95">
                <Plus className="h-4 w-4 mr-2" />Add Assignment
              </Button>
            </DialogTrigger>
            <DialogContent className="animate-scale-in">
              <DialogHeader>
                <DialogTitle>New Assignment</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Subject</Label>
                  <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Computer Science" className="mt-1 transition-all duration-200 focus:shadow-md" />
                </div>
                <div>
                  <Label>Title</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Lab Report #3" className="mt-1 transition-all duration-200 focus:shadow-md" />
                </div>
                <div>
                  <Label>Deadline</Label>
                  <Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="mt-1 transition-all duration-200 focus:shadow-md" />
                </div>
                <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 active:scale-95 transition-all duration-200">Save Assignment</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>


      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(n => <div key={n} className="h-16 rounded-xl bg-muted shimmer" />)}
        </div>
      ) : (
        <Tabs defaultValue="active" className="animate-fade-in-up delay-75">
          <TabsList className="bg-muted/60">
            <TabsTrigger value="active" className="data-[state=active]:bg-background transition-all duration-200">
              Active ({active.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-background transition-all duration-200">
              Completed ({completed.length})
            </TabsTrigger>
          </TabsList>


          <TabsContent value="active" className="space-y-3 mt-4">
            {active.length === 0 ? (
              <Card className="border-0 shadow-sm animate-scale-in">
                <CardContent className="py-16 text-center">
                  <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-3 animate-float" />
                  <p className="text-muted-foreground font-medium">No active assignments!</p>
                  <p className="text-sm text-muted-foreground mt-1">You're all caught up 🎉</p>
                </CardContent>
              </Card>
            ) : (
              active.map((a, i) => {
                const days = differenceInDays(new Date(a.deadline), new Date());
                const isPast = days < 0;
                const urgency = isPast ? "border-l-destructive" : days <= 2 ? "border-l-orange-400" : days <= 5 ? "border-l-amber-400" : "border-l-emerald-400";
                return (
                  <Card
                    key={a.id}
                    className={`border-0 shadow-sm hover:shadow-md transition-all duration-200 border-l-4 ${urgency} animate-fade-in-up`}
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <CardContent className="py-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full shrink-0 hover:bg-emerald-50 hover:border-emerald-400 hover:text-emerald-600 transition-all duration-200 active:scale-90"
                          onClick={() => toggleComplete(a.id, true)}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{a.title}</p>
                          <p className="text-xs text-muted-foreground">{a.subject} · {format(new Date(a.deadline), "MMM dd, yyyy")}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isPast && <AlertTriangle className="h-4 w-4 text-destructive animate-pulse" />}
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${isPast ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400" : days <= 2 ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400" : days <= 5 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"}`}>
                          {isPast ? "Overdue" : days === 0 ? "Today" : `${days}d`}
                        </span>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-all duration-200 active:scale-90" onClick={() => removeAssignment(a.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>


          <TabsContent value="completed" className="space-y-3 mt-4">
            {completed.length === 0 ? (
              <Card className="border-0 shadow-sm animate-scale-in">
                <CardContent className="py-16 text-center">
                  <ClipboardList className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No completed assignments yet.</p>
                </CardContent>
              </Card>
            ) : (
              completed.map((a, i) => (
                <Card
                  key={a.id}
                  className="border-0 shadow-sm opacity-60 hover:opacity-80 transition-opacity duration-200 animate-fade-in-up"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <CardContent className="py-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full shrink-0 bg-emerald-50 border-emerald-300 text-emerald-600 hover:bg-white transition-all duration-200 active:scale-90"
                        onClick={() => toggleComplete(a.id, false)}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <div className="min-w-0">
                        <p className="font-medium text-sm line-through truncate">{a.title}</p>
                        <p className="text-xs text-muted-foreground">{a.subject}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-all duration-200 active:scale-90" onClick={() => removeAssignment(a.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}



