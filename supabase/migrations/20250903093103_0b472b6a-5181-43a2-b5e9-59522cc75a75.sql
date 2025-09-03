-- Create cases table
CREATE TABLE public.cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  case_number TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (since this is supervision data)
CREATE POLICY "Allow all operations on cases" 
ON public.cases 
FOR ALL 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_cases_updated_at
BEFORE UPDATE ON public.cases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert the existing 6 cases
INSERT INTO public.cases (name, address, case_number) VALUES
('Masthuggets Vårdcentral', 'Fjärde Långgatan 48', '14K1-017313'),
('GTG – Tekniska Gymnasiet', 'Diagonalen 6', '14K1-017317'),
('Högsbotorps Vård- och omsorgsboende', 'Markmyntsgatan 14', '14K1-017320'),
('Havskrogen Storkök & Catering', 'Södra Hamngatan 88, 411 05 Göteborg', '14K1-022102'),
('Kulturhuset Skeppet', 'Skeppsbron 31, 414 59 Göteborg', '14K1-022104'),
('Teknikhuset Innovate', 'Teknikgatan 5, 412 55 Göteborg', '14K1-022105');