-- Enable RLS on all tables for demo (permissive policies)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_data ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for demo (allow all operations)
CREATE POLICY "Allow all on projects" ON public.projects FOR ALL USING (true);
CREATE POLICY "Allow all on conversation_transcripts" ON public.conversation_transcripts FOR ALL USING (true);
CREATE POLICY "Allow all on conversation_data" ON public.conversation_data FOR ALL USING (true);