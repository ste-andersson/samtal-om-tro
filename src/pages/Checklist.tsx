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
  const scrollPositions = useRef<Record<string, number>>({ checklist: 0, defects: 0 });

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

  // Save scroll position when switching tabs
  useEffect(() => {
    const handleScroll = () => {
      scrollPositions.current[activeTab] = window.scrollY;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeTab]);

  // Restore scroll position when tab changes
  useEffect(() => {
    const savedPosition = scrollPositions.current[activeTab];
    if (savedPosition !== undefined) {
      // Use setTimeout to ensure the content has rendered
      setTimeout(() => {
        window.scrollTo(0, savedPosition);
      }, 0);
    }
  }, [activeTab]);

  const handleTabChange = (newTab: string) => {
    // Save current scroll position before changing tab
    scrollPositions.current[activeTab] = window.scrollY;
    setActiveTab(newTab);
  };

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
          {/* Sticky Toolbar */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm">
            <div className="px-4 py-3">
              <div className="flex items-center justify-between gap-4">
                <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 max-w-xs">
                  <TabsList className="grid w-full grid-cols-2 h-9">
                    <TabsTrigger value="checklist" className="text-xs font-medium px-2 h-full">Checklista</TabsTrigger>
                    <TabsTrigger value="defects" className="text-xs font-medium px-2 h-full">Brister</TabsTrigger>
                  </TabsList>
                </Tabs>
                
                <Button 
                  onClick={handleSaveAll}
                  disabled={!hasUnsavedChanges || isSaving}
                  className="flex items-center gap-1.5 min-w-[120px] h-9 flex-shrink-0 text-xs font-medium px-3"
                >
                  {isSaving ? (
                    <>
                      <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Sparar...
                    </>
                  ) : hasUnsavedChanges ? (
                    <>
                      <Save className="w-3 h-3" />
                      Spara
                    </>
                  ) : (
                    <>
                      <Check className="w-3 h-3" />
                      Sparat
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsContent value="checklist" className="mt-0">
              <ChecklistView ref={checklistRef} />
            </TabsContent>
            
            <TabsContent value="defects" className="mt-0">
              <DefectsView ref={defectsRef} />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default Checklist;