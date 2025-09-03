import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { useCaseDefects } from '@/hooks/use-case-defects';
import { useCase } from '@/contexts/CaseContext';
import { useDebounce } from '@/hooks/use-debounce';
import { useToast } from '@/hooks/use-toast';

interface DefectInput {
  number: number;
  description: string;
}

export interface DefectsViewRef {
  save: () => Promise<void>;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
}

const DefectsView = forwardRef<DefectsViewRef>((props, ref) => {
  const { selectedCase } = useCase();
  const { defects, upsertDefect, deleteDefect, isUpsertLoading } = useCaseDefects(selectedCase?.id || null);
  const [localDefects, setLocalDefects] = useState<DefectInput[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [deletingDefects, setDeletingDefects] = useState<Set<number>>(new Set());
  const debouncedLocalDefects = useDebounce(localDefects, 1000);
  const { toast } = useToast();

  // Initialize local defects from database only once
  useEffect(() => {
    if (!isInitialized && selectedCase) {
      if (defects.length > 0) {
        const defectInputs = defects.map(defect => ({
          number: defect.defect_number,
          description: defect.description,
        }));
        setLocalDefects(defectInputs);
      } else {
        // Start with one empty defect if none exist
        setLocalDefects([{ number: 1, description: '' }]);
      }
      setIsInitialized(true);
    }
  }, [defects, selectedCase, isInitialized]);

  // Reset when case changes
  useEffect(() => {
    setIsInitialized(false);
    setLocalDefects([]);
    setHasUnsavedChanges(false);
    setDeletingDefects(new Set());
  }, [selectedCase?.id]);

  // Auto-save when defects change (but not for deleted ones)
  useEffect(() => {
    if (!selectedCase || !isInitialized) return;

    debouncedLocalDefects.forEach(defect => {
      // Skip if this defect is being deleted
      if (deletingDefects.has(defect.number)) return;
      
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
  }, [debouncedLocalDefects, selectedCase, defects, upsertDefect, isInitialized, deletingDefects]);

  const handleDefectChange = (number: number, description: string) => {
    setLocalDefects(prev => 
      prev.map(defect => 
        defect.number === number ? { ...defect, description } : defect
      )
    );
    setHasUnsavedChanges(true);
  };

  useImperativeHandle(ref, () => ({
    save: handleSave,
    hasUnsavedChanges,
    isSaving: isSaving || isUpsertLoading,
  }));

  const handleSave = async () => {
    if (!selectedCase) return;
    
    setIsSaving(true);
    try {
      const defectsToSave = localDefects.filter(defect => defect.description.trim());
      
      const savePromises = defectsToSave.map(defect => {
        const existingDefect = defects.find(d => d.defect_number === defect.number);
        if (!existingDefect || existingDefect.description !== defect.description) {
          return new Promise<void>((resolve, reject) => {
            upsertDefect({
              defectNumber: defect.number,
              description: defect.description.trim(),
            }, {
              onSuccess: () => resolve(),
              onError: (error) => reject(error)
            });
          });
        }
        return Promise.resolve();
      });

      await Promise.all(savePromises);

      setHasUnsavedChanges(false);
      toast({
        title: "Sparat",
        description: "Bristerna har sparats",
      });
    } catch (error) {
      toast({
        title: "Fel",
        description: "Kunde inte spara bristerna",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addDefect = () => {
    if (localDefects.length >= 20) return;
    
    const nextNumber = Math.max(...localDefects.map(d => d.number), 0) + 1;
    setLocalDefects(prev => [...prev, { number: nextNumber, description: '' }]);
  };

  const removeDefect = (number: number) => {
    // Mark as being deleted to prevent auto-save
    setDeletingDefects(prev => new Set([...prev, number]));
    
    // Remove from local state
    setLocalDefects(prev => prev.filter(defect => defect.number !== number));
    
    // Delete from database if it exists
    const existingDefect = defects.find(d => d.defect_number === number);
    if (existingDefect) {
      deleteDefect(number);
    }
    
    // Clean up deletion tracking after a delay
    setTimeout(() => {
      setDeletingDefects(prev => {
        const next = new Set(prev);
        next.delete(number);
        return next;
      });
    }, 2000);
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
      <div className="flex items-center justify-between bg-card p-4 rounded-lg border">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Brister</h3>
            {hasUnsavedChanges && (
              <span className="text-sm text-orange-600">• Osparade ändringar</span>
            )}
          </div>
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
});

export default DefectsView;