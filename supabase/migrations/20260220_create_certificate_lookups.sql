-- Migração para tabelas de gestão de Menus Suspensos de Certidões

-- Tabela para Nomenclaturas de Certidões
CREATE TABLE IF NOT EXISTS public.certificate_names (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.certificate_names ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para certificate_names
CREATE POLICY "Permitir leitura para todos os usuários autenticados" 
ON public.certificate_names FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Permitir inserção para usuários autenticados" 
ON public.certificate_names FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Permitir atualização para usuários autenticados" 
ON public.certificate_names FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);


-- Tabela para Nomes de Órgãos e Cartórios
CREATE TABLE IF NOT EXISTS public.certificate_agencies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.certificate_agencies ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para certificate_agencies
CREATE POLICY "Permitir leitura para todos os usuários autenticados" 
ON public.certificate_agencies FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Permitir inserção para usuários autenticados" 
ON public.certificate_agencies FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Permitir atualização para usuários autenticados" 
ON public.certificate_agencies FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Seed de dados iniciais comuns
INSERT INTO public.certificate_names (name) VALUES 
('Certidão Cível Corporativa'),
('Certidão de Falência e Concordata'),
('Certidão de Protesto'),
('Certidão Criminal Federal'),
('Certidão Cível Federal')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.certificate_agencies (name) VALUES 
('Tribunal de Justiça do Estado'),
('Tribunal Regional Federal'),
('1º Ofício de Notas e Protestos'),
('Junta Comercial'),
('Receita Federal')
ON CONFLICT (name) DO NOTHING;
