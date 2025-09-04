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

interface CaseWithResponses {
  id: string;
  name: string;
  case_number: string;
  address: string;
  response_count: number;
}

const AdminDefects = () => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingResponsesCaseId, setDeletingResponsesCaseId] = useState<string | null>(null);
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

  const { data: casesWithResponses, isLoading: isLoadingResponses } = useQuery({
    queryKey: ['cases-with-responses'],
    queryFn: async (): Promise<CaseWithResponses[]> => {
      const { data, error } = await supabase
        .from('cases')
        .select(`
          id,
          name,
          case_number,
          address,
          checklist_responses(id)
        `);

      if (error) throw error;
      
      // Transform data to count responses per case
      const casesWithCounts = (data || []).map((caseItem: any) => ({
        id: caseItem.id,
        name: caseItem.name,
        case_number: caseItem.case_number,
        address: caseItem.address,
        response_count: caseItem.checklist_responses?.length || 0
      })).filter((caseItem: CaseWithResponses) => caseItem.response_count > 0);
      
      return casesWithCounts.sort((a, b) => a.name.localeCompare(b.name));
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

  const deleteResponsesMutation = useMutation({
    mutationFn: async (caseId: string) => {
      const { error } = await supabase
        .from('checklist_responses')
        .delete()
        .eq('case_id', caseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases-with-responses'] });
      toast({
        title: "Raderat",
        description: "Alla checklistsvar för detta ärende har raderats",
      });
    },
    onError: (error) => {
      toast({
        title: "Fel",
        description: "Kunde inte radera checklistsvar",
        variant: "destructive",
      });
      console.error('Delete responses error:', error);
    },
    onSettled: () => {
      setDeletingResponsesCaseId(null);
    }
  });

  const handleDeleteResponses = async (caseId: string) => {
    setDeletingResponsesCaseId(caseId);
    deleteResponsesMutation.mutate(caseId);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-case-defects'] });
    queryClient.invalidateQueries({ queryKey: ['cases-with-responses'] });
  };

  if (isLoading || isLoadingResponses) {
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
                Admin: Case Defects & Responses
              </h1>
              <p className="text-muted-foreground">
                Hantera defekter och checklistsvar i systemet
              </p>
            </div>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Uppdatera
            </Button>
          </div>
        </div>

        {/* Checklist Responses Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Ärenden med Checklistsvar</h2>
          <Badge variant="secondary" className="mb-4">
            {casesWithResponses?.length || 0} ärenden med svar
          </Badge>
          
          <div className="grid gap-4">
            {casesWithResponses?.map((caseItem) => (
              <Card key={caseItem.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{caseItem.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {caseItem.case_number} • {caseItem.address}
                      </p>
                      <Badge variant="outline" className="mt-2">
                        {caseItem.response_count} svar
                      </Badge>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deletingResponsesCaseId === caseItem.id}
                        >
                          {deletingResponsesCaseId === caseItem.id ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Radera svar
                            </>
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Radera alla checklistsvar?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Detta kommer permanent radera alla {caseItem.response_count} checklistsvar 
                            för ärendet "{caseItem.name}". Denna åtgärd kan inte ångras.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Avbryt</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteResponses(caseItem.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Radera alla svar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {casesWithResponses?.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">Inga ärenden med checklistsvar hittade</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Defects Section */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Defekter</h2>
          <Badge variant="secondary" className="mb-4">
            Totalt: {defects?.length || 0} defekter
          </Badge>

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
    </div>
  );
};

export default AdminDefects;