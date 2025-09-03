import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Case } from '@/types/case';

interface CaseContextType {
  selectedCase: Case | null;
  setSelectedCase: (caseItem: Case | null) => void;
}

const CaseContext = createContext<CaseContextType | undefined>(undefined);

export const CaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);

  return (
    <CaseContext.Provider value={{ selectedCase, setSelectedCase }}>
      {children}
    </CaseContext.Provider>
  );
};

export const useCase = () => {
  const context = useContext(CaseContext);
  if (context === undefined) {
    throw new Error('useCase must be used within a CaseProvider');
  }
  return context;
};