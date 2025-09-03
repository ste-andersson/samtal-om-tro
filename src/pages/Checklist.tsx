import { useState, useRef, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Save, Check } from 'lucide-react';
import ChecklistView, { ChecklistViewRef } from '@/components/ChecklistView';
import DefectsView, { DefectsViewRef } from '@/components/DefectsView';
import { useCase } from '@/contexts/CaseContext';
import { useToast } from '@/hooks/use-toast';

const Checklist = () => {
  const { selectedCase } = useCase();
  const [activeTab, setActiveTab] = useState('checklist');
  const checklistRef = useRef<ChecklistViewRef>(null);
  const defectsRef = useRef<DefectsViewRef>(null);
  const { toast } = useToast();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Update unsaved changes state when child components change
  useEffect(() => {
    const interval = setInterval(() => {
      const checklistHasChanges = checklistRef.current?.hasUnsavedChanges || false;
      const defectsHasChanges = defectsRef.current?.hasUnsavedChanges || false;
      const checklistIsSaving = checklistRef.current?.isSaving || false;
      const defectsIsSaving = defectsRef.current?.isSaving || false;

      setHasUnsavedChanges(checklistHasChanges || defectsHasChanges);
      setIsSaving(checklistIsSaving || defectsIsSaving);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const handleSaveAll = async () => {
    try {
      const savePromises: Promise<void>[] = [];
      
      if (checklistRef.current?.hasUnsavedChanges) {
        savePromises.push(checklistRef.current.save());
      }
      
      if (defectsRef.current?.hasUnsavedChanges) {
        savePromises.push(defectsRef.current.save());
      }

      if (savePromises.length === 0) return;

      await Promise.all(savePromises);

      toast({
        title: "Sparat",
        description: "Alla ändringar har sparats",
      });
    } catch (error) {
      toast({
        title: "Fel",
        description: "Kunde inte spara alla ändringar",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-6 py-12">
        <header className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-poppins font-extrabold mb-6 text-primary">
            Checklista/brister
          </h1>
          <p className="text-xl text-muted-foreground">
            Systematisk genomgång av kontrollpunkter och identifierade brister
          </p>
          {selectedCase && (
            <p className="text-sm text-muted-foreground mt-2">
              Aktivt ärende: {selectedCase.name} ({selectedCase.case_number})
            </p>
          )}
        </header>
        
        <main>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="checklist">Checklista</TabsTrigger>
                <TabsTrigger value="defects">Brister</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="checklist" className="mt-0">
              <ChecklistView ref={checklistRef} />
            </TabsContent>
            
            <TabsContent value="defects" className="mt-0">
              <DefectsView ref={defectsRef} />
            </TabsContent>
          </Tabs>

          {/* Unified Save Button */}
          <div className="mt-8 flex justify-center">
            <Button 
              onClick={handleSaveAll}
              disabled={!hasUnsavedChanges || isSaving}
              size="lg"
              className="flex items-center gap-2 min-w-[200px]"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Sparar...
                </>
              ) : hasUnsavedChanges ? (
                <>
                  <Save className="w-4 h-4" />
                  Spara alla ändringar
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Allt sparat
                </>
              )}
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Checklist;