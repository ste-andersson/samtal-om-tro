import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Case } from '@/types/case';

export const useCases = () => {
  return useQuery({
    queryKey: ['cases'],
    queryFn: async (): Promise<Case[]> => {
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      return data || [];
    },
  });
};