import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ChecklistView from '@/components/ChecklistView';
import DefectsView from '@/components/DefectsView';
import { useCase } from '@/contexts/CaseContext';

const Checklist = () => {
  const { selectedCase } = useCase();
  const [activeTab, setActiveTab] = useState('checklist');

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
              <ChecklistView />
            </TabsContent>
            
            <TabsContent value="defects" className="mt-0">
              <DefectsView />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default Checklist;