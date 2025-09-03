-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  uppdragsnr TEXT NOT NULL,
  kund TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conversation_transcripts table
CREATE TABLE public.conversation_transcripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id TEXT NOT NULL UNIQUE,
  transcript TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conversation_data table
CREATE TABLE public.conversation_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id TEXT NOT NULL UNIQUE,
  project TEXT,
  hours TEXT,
  summary TEXT,
  closed TEXT,
  sales_opportunities TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert some sample project data
INSERT INTO public.projects (uppdragsnr, kund) VALUES 
  ('PRJ001', 'Företag AB'),
  ('PRJ002', 'Klient Corp'),
  ('PRJ003', 'Startup Ltd');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_conversation_data_updated_at
  BEFORE UPDATE ON public.conversation_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();