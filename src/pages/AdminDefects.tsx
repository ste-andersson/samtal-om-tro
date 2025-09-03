import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CaseDefect {
  id: string;
  case_id: string;
  defect_number: number;
  description: string;
  brist?: string;
  atgard?: string;
  motivering?: string;
  created_at: string;
  updated_at: string;
  case?: {
    name: string;
    case_number: string;
    address: string;
  };
}

const AdminDefects = () => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: defects, isLoading, error } = useQuery({
    queryKey: ['admin-case-defects'],
    queryFn: async (): Promise<CaseDefect[]> => {
      const { data, error } = await supabase
        .from('case_defects')
        .select(`
          *,
          case:cases!inner(
            name,
            case_number,
            address
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('case_defects')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-case-defects'] });
      toast({
        title: "Raderat",
        description: "Defekten har raderats från databasen",
      });
    },
    onError: (error) => {
      toast({
        title: "Fel",
        description: "Kunde inte radera defekten",
        variant: "destructive",
      });
      console.error('Delete error:', error);
    },
    onSettled: () => {
      setDeletingId(null);
    }
  });

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    deleteMutation.mutate(id);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-case-defects'] });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="container mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Laddar defekter...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="container mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-destructive">
              Fel vid laddning av defekter: {error.message}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-primary mb-2">
                Admin: Case Defects
              </h1>
              <p className="text-muted-foreground">
                Hantera alla defekter i systemet
              </p>
            </div>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Uppdatera
            </Button>
          </div>
          <Badge variant="secondary" className="mt-4">
            Totalt: {defects?.length || 0} defekter
          </Badge>
        </div>

        <div className="grid gap-4">
          {defects?.map((defect) => (
            <Card key={defect.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      Defekt #{defect.defect_number}
                    </CardTitle>
                    {defect.case && (
                      <div className="mt-1">
                        <p className="text-sm font-medium text-primary">
                          {defect.case.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {defect.case.case_number} • {defect.case.address}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {defect.case_id.slice(0, 8)}...
                    </Badge>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deletingId === defect.id}
                        >
                          {deletingId === defect.id ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Radera defekt?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Detta kommer permanent radera defekt #{defect.defect_number} 
                            {defect.case && ` från ${defect.case.name}`} från databasen. 
                            Denna åtgärd kan inte ångras.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Avbryt</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(defect.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Radera
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-medium mb-1">Beskrivning:</h4>
                  <p className="text-sm text-muted-foreground">
                    {defect.description || 'Ingen beskrivning'}
                  </p>
                </div>
                
                {defect.brist && (
                  <div>
                    <h4 className="font-medium mb-1">Brist:</h4>
                    <p className="text-sm text-muted-foreground">{defect.brist}</p>
                  </div>
                )}
                
                {defect.atgard && (
                  <div>
                    <h4 className="font-medium mb-1">Åtgärd:</h4>
                    <p className="text-sm text-muted-foreground">{defect.atgard}</p>
                  </div>
                )}
                
                {defect.motivering && (
                  <div>
                    <h4 className="font-medium mb-1">Motivering:</h4>
                    <p className="text-sm text-muted-foreground">{defect.motivering}</p>
                  </div>
                )}
                
                <div className="flex gap-4 text-xs text-muted-foreground pt-2 border-t">
                  <span>Skapad: {new Date(defect.created_at).toLocaleString('sv-SE')}</span>
                  <span>Uppdaterad: {new Date(defect.updated_at).toLocaleString('sv-SE')}</span>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {defects?.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">Inga defekter hittade i databasen</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDefects;