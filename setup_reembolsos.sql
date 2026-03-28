-- 1. Criar a tabela de reembolsos
CREATE TABLE public.reembolsos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    colaborador_id UUID REFERENCES public.collaborators(id) NOT NULL,
    reembolsavel_cliente BOOLEAN DEFAULT false,
    recibo_url TEXT NOT NULL,
    numero_recibo TEXT,
    fornecedor_nome TEXT,
    fornecedor_cnpj TEXT,
    data_despesa DATE,
    valor NUMERIC,
    descricao TEXT,
    status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'pago')),
    comprovante_pagamento_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilitar RLS (Row Level Security) - Desabilitado temporariamente ou ajustado
ALTER TABLE public.reembolsos ENABLE ROW LEVEL SECURITY;

-- 3. Criar Policy para leitura e escrita (Para este propósito vamos deixar genérico)
CREATE POLICY "Permitir leitura/escrita autenticada em reembolsos" ON public.reembolsos
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
    
-- PERMITIR INSERT PÚBLICO
-- Como o formulário é mágico, precisamos permitir inserir sem login:
CREATE POLICY "Permitir insert publico em reembolsos" ON public.reembolsos
    FOR INSERT WITH CHECK (true);

-- 4. Criar Bucket de Storage: 'gastos_reembolsos'
INSERT INTO storage.buckets (id, name, public) 
VALUES ('gastos_reembolsos', 'gastos_reembolsos', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Policies para o Bucket (Permitir Insert Público para uploads)
CREATE POLICY "Permitir upload publico em gastos_reembolsos"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'gastos_reembolsos' );

CREATE POLICY "Permitir leitura geral em gastos_reembolsos"
ON storage.objects FOR SELECT
USING ( bucket_id = 'gastos_reembolsos' );
