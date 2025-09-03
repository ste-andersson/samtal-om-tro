-- Add three new text fields to case_defects table for official defect texts
ALTER TABLE public.case_defects 
ADD COLUMN brist TEXT,
ADD COLUMN atgard TEXT, 
ADD COLUMN motivering TEXT;