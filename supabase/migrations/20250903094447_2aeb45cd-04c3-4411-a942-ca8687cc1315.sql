-- Create checklist_responses table to store checklist answers per case
CREATE TABLE public.checklist_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  checklist_id TEXT NOT NULL,
  answer TEXT,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(case_id, checklist_id)
);

-- Create case_defects table to store defects per case (max 20)
CREATE TABLE public.case_defects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  defect_number INTEGER NOT NULL CHECK (defect_number >= 1 AND defect_number <= 20),
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(case_id, defect_number)
);

-- Enable Row Level Security
ALTER TABLE public.checklist_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_defects ENABLE ROW LEVEL SECURITY;

-- Create policies for checklist_responses
CREATE POLICY "Allow all on checklist_responses" 
ON public.checklist_responses 
FOR ALL 
USING (true);

-- Create policies for case_defects
CREATE POLICY "Allow all on case_defects" 
ON public.case_defects 
FOR ALL 
USING (true);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_checklist_responses_updated_at
BEFORE UPDATE ON public.checklist_responses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_case_defects_updated_at
BEFORE UPDATE ON public.case_defects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();