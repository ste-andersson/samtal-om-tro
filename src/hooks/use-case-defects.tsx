import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CaseDefect } from '@/types/checklist';
import { useToast } from '@/hooks/use-toast';

export const useCaseDefects = (caseId: string | null) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['case-defects', caseId],
    queryFn: async (): Promise<CaseDefect[]> => {
      if (!caseId) return [];
      
      const { data, error } = await supabase
        .from('case_defects')
        .select('*')
        .eq('case_id', caseId)
        .order('defect_number', { ascending: true });

      if (error) {
        throw error;
      }

      return data || [];
    },
    enabled: !!caseId,
  });

  const upsertDefect = useMutation({
    mutationFn: async ({ defectNumber, description }: { 
      defectNumber: number; 
      description: string;
    }) => {
      if (!caseId) throw new Error('No case selected');

      const { data, error } = await supabase
        .from('case_defects')
        .upsert({
          case_id: caseId,
          defect_number: defectNumber,
          description,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-defects', caseId] });
    },
    onError: (error) => {
      toast({
        title: "Fel",
        description: "Kunde inte spara brist",
        variant: "destructive",
      });
      console.error('Error saving defect:', error);
    },
  });

  const deleteDefect = useMutation({
    mutationFn: async (defectNumber: number) => {
      if (!caseId) throw new Error('No case selected');

      const { error } = await supabase
        .from('case_defects')
        .delete()
        .eq('case_id', caseId)
        .eq('defect_number', defectNumber);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-defects', caseId] });
    },
    onError: (error) => {
      toast({
        title: "Fel",
        description: "Kunde inte ta bort brist",
        variant: "destructive",
      });
      console.error('Error deleting defect:', error);
    },
  });

  return {
    defects: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    upsertDefect: upsertDefect.mutate,
    deleteDefect: deleteDefect.mutate,
    isUpsertLoading: upsertDefect.isPending,
    isDeleteLoading: deleteDefect.isPending,
  };
};