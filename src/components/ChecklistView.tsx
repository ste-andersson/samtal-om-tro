import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { checklistData } from '@/data/checklistData';
import { useChecklistResponses } from '@/hooks/use-checklist-responses';
import { ChecklistItem } from '@/types/checklist';
import { useCase } from '@/contexts/CaseContext';
import { useDebounce } from '@/hooks/use-debounce';

const ChecklistView = () => {
  const { selectedCase } = useCase();
  const { responses, upsertResponse } = useChecklistResponses(selectedCase?.id || null);
  const [localData, setLocalData] = useState<ChecklistItem[]>(checklistData);
  const debouncedLocalData = useDebounce(localData, 1000);

  // Merge database responses with checklist data
  useEffect(() => {
    const mergedData = checklistData.map(item => {
      const response = responses.find(r => r.checklist_id === item.id);
      return {
        ...item,
        answer: response?.answer || null,
        comment: response?.comment || '',
      };
    });
    setLocalData(mergedData);
  }, [responses]);

  // Auto-save when data changes
  useEffect(() => {
    if (!selectedCase) return;
    
    const changedItems = debouncedLocalData.filter((item, index) => {
      const original = checklistData[index];
      const response = responses.find(r => r.checklist_id === item.id);
      return (
        item.answer !== (response?.answer || null) ||
        item.comment !== (response?.comment || '')
      );
    });

    changedItems.forEach(item => {
      if (item.answer || item.comment) {
        upsertResponse({
          checklistId: item.id,
          answer: item.answer,
          comment: item.comment,
        });
      }
    });
  }, [debouncedLocalData, selectedCase, responses, upsertResponse]);

  const handleAnswerChange = (itemId: string, answer: string) => {
    setLocalData(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, answer } : item
      )
    );
  };

  const handleCommentChange = (itemId: string, comment: string) => {
    setLocalData(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, comment } : item
      )
    );
  };

  if (!selectedCase) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Välj ett ärende för att visa checklistan</p>
      </div>
    );
  }

  // Group items by section
  const groupedItems = localData.reduce((acc, item) => {
    if (!acc[item.section]) {
      acc[item.section] = [];
    }
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedItems).map(([section, items]) => (
        <Card key={section}>
          <CardHeader>
            <CardTitle className="text-lg">{section}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {items.map((item, index) => (
              <div key={item.id}>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-3">{item.id}. {item.question}</h4>
                    {item.options.length > 0 && (
                      <RadioGroup
                        value={item.answer || ''}
                        onValueChange={(value) => handleAnswerChange(item.id, value)}
                        className="flex flex-wrap gap-4"
                      >
                        {item.options.map((option) => (
                          <div key={option} className="flex items-center space-x-2">
                            <RadioGroupItem value={option} id={`${item.id}-${option}`} />
                            <Label htmlFor={`${item.id}-${option}`}>{option}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}
                  </div>
                  <div>
                    <Label htmlFor={`comment-${item.id}`} className="text-sm font-medium">
                      Kommentar
                    </Label>
                    <Textarea
                      id={`comment-${item.id}`}
                      value={item.comment}
                      onChange={(e) => handleCommentChange(item.id, e.target.value)}
                      placeholder="Lägg till kommentar..."
                      className="mt-1"
                    />
                  </div>
                </div>
                {index < items.length - 1 && <Separator className="mt-6" />}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ChecklistView;