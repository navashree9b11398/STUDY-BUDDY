import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEvents } from "@/hooks/useEvents";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const categories = ["All", "AI", "Programming", "Cultural", "Workshop", "Hackathon", "Seminar"];

export default function Events() {
  const { events, isLoading, addEvent } = useEvents();
  const [filter, setFilter] = useState("All");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", category: "Workshop", date: "", location: "" });

  const filtered = filter === "All" ? events : events.filter((e) => e.category === filter);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.date || !form.category) return;
    addEvent({ ...form, date: new Date(form.date).toISOString() });
    setForm({ title: "", description: "", category: "Workshop", date: "", location: "" });
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campus Events</h1>
          <p className="text-muted-foreground">Discover workshops, hackathons, and more</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Event</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Event</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Event title" /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Event description" /></div>
              <div><Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{categories.filter(c => c !== "All").map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Date</Label><Input type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Room 301" /></div>
              <Button type="submit" className="w-full">Save Event</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <Button key={cat} variant={filter === cat ? "default" : "outline"} size="sm" onClick={() => setFilter(cat)}>{cat}</Button>
        ))}
      </div>

      {isLoading ? (
        <Card><CardContent className="py-12 text-center"><p className="text-muted-foreground">Loading events...</p></CardContent></Card>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><p className="text-muted-foreground">No upcoming events found.</p></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((event) => (
            <Card key={event.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold">{event.title}</h3>
                  <Badge variant="secondary">{event.category}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{event.description}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>📅 {format(new Date(event.date), "MMM dd, yyyy")}</span>
                  <span>📍 {event.location}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
