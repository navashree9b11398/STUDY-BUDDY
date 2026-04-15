import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CampusEvent {
  id: string;
  title: string;
  description: string;
  category: string;
  date: string;
  location: string;
}

export function useEvents() {
  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .gte("date", new Date().toISOString())
        .order("date", { ascending: true });
      if (error) throw error;
      return data as CampusEvent[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: Omit<CampusEvent, "id">) => {
      const { error } = await supabase.from("events").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event added");
    },
    onError: () => toast.error("Failed to add event"),
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["events"] }),
  });

  return {
    events,
    isLoading,
    addEvent: (data: Omit<CampusEvent, "id">) => addMutation.mutate(data),
    removeEvent: (id: string) => removeMutation.mutate(id),
  };
}
