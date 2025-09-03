import { Navigation } from '@/components/Navigation';
import { Case } from '@/types/case';
import { useCase } from '@/contexts/CaseContext';
import { useCases } from '@/hooks/use-cases';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const Cases = () => {
  const { selectedCase, setSelectedCase } = useCase();
  const { data: cases = [], isLoading, error } = useCases();

  const handleCaseSelect = (caseItem: Case) => {
    setSelectedCase(caseItem);
  };

  console.log('Cases component rendered, cases count:', cases.length);
  console.log('Cases data:', cases);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-6 py-12">
          <div className="flex justify-center">
            <p className="text-muted-foreground">Laddar ärenden...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-6 py-12">
          <div className="flex justify-center">
            <p className="text-destructive">Fel vid laddning av ärenden: {error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-6 py-12">
        <header className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-poppins font-extrabold mb-6 text-primary">
            Ärenden
          </h1>
          <p className="text-xl text-muted-foreground">
            Hantera och spåra tillsynsärenden
          </p>
        </header>
        
        <main className="flex justify-center">
          <div className="w-full max-w-4xl space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              Visar {cases.length} ärenden
            </p>
            {cases.length === 0 ? (
              <p className="text-center text-muted-foreground">Inga ärenden hittades</p>
            ) : (
              cases.map((caseItem) => (
                <Card 
                  key={caseItem.id} 
                  className={`cursor-pointer transition-all hover:shadow-md border ${
                    selectedCase?.id === caseItem.id ? 'ring-2 ring-primary bg-primary/5' : 'bg-card'
                  }`}
                  onClick={() => handleCaseSelect(caseItem)}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg font-semibold text-foreground">{caseItem.name}</CardTitle>
                      <Badge variant="secondary">{caseItem.case_number}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{caseItem.address}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Cases;