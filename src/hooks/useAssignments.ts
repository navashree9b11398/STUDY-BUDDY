import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Assignment {
  id: string;
  subject: string;
  title: string;
  deadline: string;
  completed: boolean;
  created_at: string;
}

export function useAssignments() {
  const queryClient = useQueryClient();

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["assignments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assignments")
        .select("*")
        .order("deadline", { ascending: true });
      if (error) throw error;
      return data as Assignment[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: { subject: string; title: string; deadline: string }) => {
      const { error } = await supabase.from("assignments").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      toast.success("Assignment added");
    },
    onError: () => toast.error("Failed to add assignment"),
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("assignments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      toast.success("Assignment deleted");
    },
  });

  const toggleCompleteMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase.from("assignments").update({ completed }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["assignments"] }),
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("assignments").delete().gte("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      toast.success("All assignments cleared");
    },
  });

  return {
    assignments,
    isLoading,
    addAssignment: (data: { subject: string; title: string; deadline: string }) => addMutation.mutate(data),
    removeAssignment: (id: string) => removeMutation.mutate(id),
    toggleComplete: (id: string, completed: boolean) => toggleCompleteMutation.mutate({ id, completed }),
    clearAll: () => clearAllMutation.mutate(),
  };
}
