import { Navigation } from '@/components/Navigation';
import { useCase } from '@/contexts/CaseContext';
import { useChecklistResponses } from '@/hooks/use-checklist-responses';
import { useCaseDefects } from '@/hooks/use-case-defects';
import DocumentView from '@/components/DocumentView';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

const Files = () => {
  const { selectedCase } = useCase();
  const { responses } = useChecklistResponses(selectedCase?.id || null);
  const { defects } = useCaseDefects(selectedCase?.id || null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="py-8">
        <div className="container mx-auto px-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-poppins font-extrabold text-primary mb-2">
                Utkast
              </h1>
              {selectedCase && (
                <p className="text-muted-foreground">
                  {selectedCase.name} - {selectedCase.case_number}
                </p>
              )}
            </div>
            {selectedCase && (
              <Button onClick={handlePrint} variant="outline" className="flex items-center gap-2">
                <Printer className="h-4 w-4" />
                Skriv ut
              </Button>
            )}
          </div>
        </div>
        
        <main className="bg-gray-100 py-8">
          <div className="max-w-5xl mx-auto px-6">
            <div className="bg-white shadow-2xl shadow-black/10 overflow-hidden document-wrapper">
              <DocumentView 
                selectedCase={selectedCase}
                checklistResponses={responses}
                defects={defects}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Files;