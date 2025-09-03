import { Navigation } from '@/components/Navigation';
import { cases, Case } from '@/types/case';
import { useCase } from '@/contexts/CaseContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const Cases = () => {
  const { selectedCase, setSelectedCase } = useCase();

  const handleCaseSelect = (caseItem: Case) => {
    setSelectedCase(caseItem);
  };

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
            {cases.map((caseItem) => (
              <Card 
                key={caseItem.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedCase?.id === caseItem.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => handleCaseSelect(caseItem)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-semibold">{caseItem.name}</CardTitle>
                    <Badge variant="secondary">{caseItem.caseNumber}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{caseItem.address}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Cases;