import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { useCaseDefects } from '@/hooks/use-case-defects';
import { useCase } from '@/contexts/CaseContext';
import { useDebounce } from '@/hooks/use-debounce';

interface DefectInput {
  number: number;
  description: string;
}

const DefectsView = () => {
  const { selectedCase } = useCase();
  const { defects, upsertDefect, deleteDefect } = useCaseDefects(selectedCase?.id || null);
  const [localDefects, setLocalDefects] = useState<DefectInput[]>([]);
  const debouncedLocalDefects = useDebounce(localDefects, 1000);

  // Initialize local defects from database
  useEffect(() => {
    if (defects.length > 0) {
      const defectInputs = defects.map(defect => ({
        number: defect.defect_number,
        description: defect.description,
      }));
      setLocalDefects(defectInputs);
    } else if (localDefects.length === 0) {
      // Start with one empty defect if none exist
      setLocalDefects([{ number: 1, description: '' }]);
    }
  }, [defects]);

  // Auto-save when defects change
  useEffect(() => {
    if (!selectedCase) return;

    debouncedLocalDefects.forEach(defect => {
      if (defect.description.trim()) {
        const existingDefect = defects.find(d => d.defect_number === defect.number);
        if (!existingDefect || existingDefect.description !== defect.description) {
          upsertDefect({
            defectNumber: defect.number,
            description: defect.description.trim(),
          });
        }
      }
    });
  }, [debouncedLocalDefects, selectedCase, defects, upsertDefect]);

  const handleDefectChange = (number: number, description: string) => {
    setLocalDefects(prev => 
      prev.map(defect => 
        defect.number === number ? { ...defect, description } : defect
      )
    );
  };

  const addDefect = () => {
    if (localDefects.length >= 20) return;
    
    const nextNumber = Math.max(...localDefects.map(d => d.number), 0) + 1;
    setLocalDefects(prev => [...prev, { number: nextNumber, description: '' }]);
  };

  const removeDefect = (number: number) => {
    setLocalDefects(prev => prev.filter(defect => defect.number !== number));
    
    // Delete from database if it exists
    const existingDefect = defects.find(d => d.defect_number === number);
    if (existingDefect) {
      deleteDefect(number);
    }
  };

  if (!selectedCase) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Välj ett ärende för att hantera brister</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Brister</h3>
        <Button
          onClick={addDefect}
          disabled={localDefects.length >= 20}
          size="sm"
          variant="outline"
        >
          <Plus className="w-4 h-4 mr-2" />
          Lägg till brist ({localDefects.length}/20)
        </Button>
      </div>

      <div className="space-y-4">
        {localDefects
          .sort((a, b) => a.number - b.number)
          .map((defect) => (
            <Card key={defect.number}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Brist {defect.number}</CardTitle>
                  {localDefects.length > 1 && (
                    <Button
                      onClick={() => removeDefect(defect.number)}
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor={`defect-${defect.number}`}>Beskrivning</Label>
                  <Textarea
                    id={`defect-${defect.number}`}
                    value={defect.description}
                    onChange={(e) => handleDefectChange(defect.number, e.target.value)}
                    placeholder="Beskriv bristen..."
                    className="min-h-[100px]"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {localDefects.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">Inga brister har lagts till ännu</p>
          <Button onClick={addDefect} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Lägg till första bristen
          </Button>
        </div>
      )}
    </div>
  );
};

export default DefectsView;