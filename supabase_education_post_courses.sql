-- Tabela de Cursos de Pós-Graduação
DROP TABLE IF EXISTS public.education_post_courses CASCADE;
CREATE TABLE public.education_post_courses (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE public.education_post_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to all authenticated users on post courses"
    ON public.education_post_courses FOR SELECT
    TO authenticated
    USING (true);

-- Inserindo os Cursos de Pós Solicitados
TRUNCATE TABLE public.education_post_courses;
INSERT INTO public.education_post_courses (name) VALUES
('Data Analytics e Inteligência Artificial Aplicada a Negócios'),
('Direito Digital, Compliance e LGPD'),
('Gestão de Talentos e Recrutamento'),
('Gestão de Recursos Humanos e Psicologia Organizacional'),
('LL.M. em Direito Digital');

-- Função RPC para consultar cursos de pós-graduação
DROP FUNCTION IF EXISTS public.get_education_post_courses();
CREATE OR REPLACE FUNCTION get_education_post_courses()
RETURNS TABLE (id UUID, name TEXT)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT id, name FROM public.education_post_courses ORDER BY name;
$$;
