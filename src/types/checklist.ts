export interface ChecklistItem {
  id: string;
  section: string;
  question: string;
  options: string[];
  answer: string | null;
  comment: string;
}

export interface ChecklistResponse {
  id: string;
  case_id: string;
  checklist_id: string;
  answer: string | null;
  comment: string;
  created_at: string;
  updated_at: string;
}

export interface CaseDefect {
  id: string;
  case_id: string;
  defect_number: number;
  description: string;
  brist: string | null;
  atgard: string | null;
  motivering: string | null;
  created_at: string;
  updated_at: string;
}