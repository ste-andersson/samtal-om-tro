import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChecklistResponse } from '@/types/checklist';
import { useToast } from '@/hooks/use-toast';

export const useChecklistResponses = (caseId: string | null) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['checklist-responses', caseId],
    queryFn: async (): Promise<ChecklistResponse[]> => {
      if (!caseId) return [];
      
      const { data, error } = await supabase
        .from('checklist_responses')
        .select('*')
        .eq('case_id', caseId);

      if (error) {
        throw error;
      }

      return data || [];
    },
    enabled: !!caseId,
  });

  const upsertResponse = useMutation({
    mutationFn: async ({ checklistId, answer, comment }: { 
      checklistId: string; 
      answer: string | null; 
      comment: string;
    }) => {
      if (!caseId) throw new Error('No case selected');

      const { data, error } = await supabase
        .from('checklist_responses')
        .upsert({
          case_id: caseId,
          checklist_id: checklistId,
          answer,
          comment,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-responses', caseId] });
    },
    onError: (error) => {
      toast({
        title: "Fel",
        description: "Kunde inte spara checklistasvar",
        variant: "destructive",
      });
      console.error('Error saving checklist response:', error);
    },
  });

  return {
    responses: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    upsertResponse: upsertResponse.mutate,
    isUpsertLoading: upsertResponse.isPending,
  };
};