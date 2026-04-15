import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TimetableEntry {
  id: string;
  subject: string;
  time_slot: string;
  duration: string;
  sort_order: number;
}

export function useTimetable() {
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["timetable"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("timetable_entries")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as TimetableEntry[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (slots: Omit<TimetableEntry, "id">[]) => {
      // Clear existing entries then insert new ones
      await supabase.from("timetable_entries").delete().gte("id", "00000000-0000-0000-0000-000000000000");
      if (slots.length > 0) {
        const { error } = await supabase.from("timetable_entries").insert(slots);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timetable"] });
      toast.success("Timetable saved");
    },
    onError: () => toast.error("Failed to save timetable"),
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("timetable_entries").delete().gte("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timetable"] });
      toast.success("Timetable cleared");
    },
  });

  return {
    entries,
    isLoading,
    saveSchedule: (slots: Omit<TimetableEntry, "id">[]) => saveMutation.mutate(slots),
    clearTimetable: () => clearMutation.mutate(),
  };
}
