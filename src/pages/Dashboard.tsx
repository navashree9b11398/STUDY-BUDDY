import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, Calendar, Sparkles, MessageCircle, CheckCircle2, Bell, AlertTriangle, PartyPopper, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAssignments } from "@/hooks/useAssignments";
import { useEvents } from "@/hooks/useEvents";
import { differenceInDays, format, isTomorrow, isToday } from "date-fns";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";


export default function Dashboard() {
  const { assignments, isLoading: loadingAssignments } = useAssignments();
  const { events, isLoading: loadingEvents } = useEvents();


  const active = assignments.filter((a) => !a.completed);
  const upcoming = active
    .filter((a) => new Date(a.deadline) >= new Date())
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 3);


  const upcomingEvents = events.slice(0, 3);


  const dueTomorrow = active.filter((a) => isTomorrow(new Date(a.deadline)));
  const dueToday = active.filter((a) => isToday(new Date(a.deadline)));
  const soonEvents = events.filter((e) => {
    const d = differenceInDays(new Date(e.date), new Date());
    return d >= 0 && d <= 2;
  });


  const notifications = [
    ...dueToday.map((a) => ({ type: "urgent" as const, text: `"${a.title}" is due today!` })),
    ...dueTomorrow.map((a) => ({ type: "warning" as const, text: `"${a.title}" is due tomorrow` })),
    ...soonEvents.map((e) => ({ type: "event" as const, text: `"${e.title}" — ${format(new Date(e.date), "MMM dd")}` })),
  ];


  const stats = [
    { label: "Active Assignments", value: active.length, icon: ClipboardList, color: "text-blue-500", bg: "from-blue-500/10 to-blue-600/10", border: "border-blue-200/50 dark:border-blue-800/50" },
    { label: "Completed", value: assignments.filter(a => a.completed).length, icon: CheckCircle2, color: "text-emerald-500", bg: "from-emerald-500/10 to-emerald-600/10", border: "border-emerald-200/50 dark:border-emerald-800/50" },
    { label: "Upcoming Events", value: events.length, icon: Sparkles, color: "text-purple-500", bg: "from-purple-500/10 to-purple-600/10", border: "border-purple-200/50 dark:border-purple-800/50" },
  ];


  const quickLinks = [
    { to: "/timetable", icon: Calendar, label: "Timetable", desc: "Plan your schedule", color: "text-blue-600", bg: "from-blue-500 to-cyan-500" },
    { to: "/chat", icon: MessageCircle, label: "AI Assistant", desc: "Ask anything", color: "text-purple-600", bg: "from-purple-500 to-pink-500" },
  ];


  return (
    <div className="space-y-8 page-enter">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-4xl font-bold gradient-text mb-2">Welcome to StudyBuddy AI!</h1>
        <p className="text-muted-foreground">Your smart student assistant – here's your overview</p>
      </div>


      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="animate-fade-in-up delay-75">
          <Card className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border-red-200/60 dark:border-red-800/40 shadow-lg shadow-red-100/50 dark:shadow-red-900/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-red-700 dark:text-red-400">
                <Bell className="h-5 w-5 animate-pulse" /> Important Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {notifications.map((n, i) => {
                const styles = n.type === "urgent"
                  ? "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-700"
                  : n.type === "warning"
                  ? "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700"
                  : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700";
                return (
                  <div
                    key={i}
                    className={`flex items-start gap-3 p-3 rounded-xl ${styles} animate-slide-in-left`}
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    {n.type === "urgent" ? <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" /> : n.type === "warning" ? <ClipboardList className="h-4 w-4 mt-0.5 shrink-0" /> : <PartyPopper className="h-4 w-4 mt-0.5 shrink-0" />}
                    <span className="text-sm font-medium">{n.text}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}


      {/* Stats + Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((s, i) => (
          <Card
            key={s.label}
            className={`card-lift border bg-gradient-to-br ${s.bg} ${s.border} shadow-sm animate-fade-in-up`}
            style={{ animationDelay: `${100 + i * 80}ms` }}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 bg-white/70 dark:bg-white/10 rounded-xl shadow-sm`}>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {loadingAssignments || loadingEvents ? (
                      <span className="inline-block w-6 h-6 rounded bg-muted shimmer" />
                    ) : s.value}
                  </p>
                  <p className="text-xs text-muted-foreground leading-tight">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}


        {quickLinks.map((q, i) => (
          <Link to={q.to} key={q.to}>
            <Card
              className={`card-lift group cursor-pointer border-0 shadow-sm h-full animate-fade-in-up overflow-hidden relative`}
              style={{ animationDelay: `${340 + i * 80}ms` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${q.bg} opacity-10 group-hover:opacity-20 transition-opacity duration-300`} />
              <CardContent className="pt-6 relative">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 bg-gradient-to-br ${q.bg} rounded-xl shadow-sm`}>
                    <q.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{q.label}</p>
                    <p className="text-xs text-muted-foreground">{q.desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>


      {/* Deadlines + Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card-lift border-0 shadow-md animate-fade-in-up delay-300 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
          <CardHeader><CardTitle className="text-lg">Upcoming Deadlines</CardTitle></CardHeader>
          <CardContent>
            {loadingAssignments ? (
              <div className="space-y-3">
                {[1,2,3].map(n => <div key={n} className="h-14 rounded-xl bg-muted shimmer" />)}
              </div>
            ) : upcoming.length === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-2 animate-float" />
                <p className="text-muted-foreground text-sm">All clear! <Link to="/assignments" className="text-primary underline">Add an assignment</Link></p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.map((a, i) => {
                  const days = differenceInDays(new Date(a.deadline), new Date());
                  return (
                    <div
                      key={a.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-secondary/60 hover:bg-secondary transition-colors duration-200 animate-fade-in-up"
                      style={{ animationDelay: `${400 + i * 60}ms` }}
                    >
                      <div>
                        <p className="font-medium text-sm">{a.title}</p>
                        <p className="text-xs text-muted-foreground">{a.subject}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${days <= 2 ? "text-destructive" : days <= 5 ? "text-amber-500" : "text-emerald-500"}`}>
                          {days === 0 ? "Today!" : `${days}d left`}
                        </p>
                        <p className="text-xs text-muted-foreground">{format(new Date(a.deadline), "MMM dd")}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>


        <Card className="card-lift border-0 shadow-md animate-fade-in-up delay-400 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
          <CardHeader><CardTitle className="text-lg">Campus Events</CardTitle></CardHeader>
          <CardContent>
            {loadingEvents ? (
              <div className="space-y-3">
                {[1,2,3].map(n => <div key={n} className="h-14 rounded-xl bg-muted shimmer" />)}
              </div>
            ) : upcomingEvents.length === 0 ? (
              <div className="py-8 text-center">
                <Sparkles className="h-10 w-10 text-purple-400 mx-auto mb-2 animate-float" />
                <p className="text-muted-foreground text-sm">No events. <Link to="/events" className="text-primary underline">Browse events</Link></p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((e, i) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-secondary/60 hover:bg-secondary transition-colors duration-200 animate-fade-in-up"
                    style={{ animationDelay: `${400 + i * 60}ms` }}
                  >
                    <div>
                      <p className="font-medium text-sm">{e.title}</p>
                      <p className="text-xs text-muted-foreground">{e.category}</p>
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">{format(new Date(e.date), "MMM dd")}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



