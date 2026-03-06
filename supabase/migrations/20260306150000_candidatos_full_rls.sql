-- Enable RLS on candidate tables explicitly (just in case)
ALTER TABLE public.candidatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidato_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidato_experiencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidato_ged ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.candidatos;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.candidato_historico;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.candidato_experiencias;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.candidato_ged;

-- Create full CRUD policies for authenticated users on all candidate tables
CREATE POLICY "Enable all access for authenticated users" ON public.candidatos
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON public.candidato_historico
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON public.candidato_experiencias
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON public.candidato_ged
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
