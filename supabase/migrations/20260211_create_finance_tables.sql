-- Create finance_faturas table (referencing existing clients table)
CREATE TABLE IF NOT EXISTS public.finance_faturas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_nome TEXT NOT NULL,
    cliente_email TEXT NOT NULL,
    cliente_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    valor NUMERIC(10, 2) NOT NULL,
    remetente TEXT NOT NULL,
    assunto TEXT NOT NULL,
    corpo TEXT,
    status TEXT NOT NULL CHECK (status IN ('aguardando_resposta', 'radar', 'contato_direto', 'pago', 'cancelado')),
    data_envio TIMESTAMPTZ DEFAULT NOW(),
    data_resposta TIMESTAMPTZ,
    data_radar TIMESTAMPTZ,
    data_contato_direto TIMESTAMPTZ,
    data_pagamento TIMESTAMPTZ,
    arquivos_urls TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.finance_faturas ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.finance_faturas;
DROP POLICY IF EXISTS "Allow authenticated insert access" ON public.finance_faturas;
DROP POLICY IF EXISTS "Allow authenticated update access" ON public.finance_faturas;
DROP POLICY IF EXISTS "Allow authenticated delete access" ON public.finance_faturas;

-- Create policies
CREATE POLICY "Allow authenticated read access" ON public.finance_faturas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert access" ON public.finance_faturas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update access" ON public.finance_faturas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete access" ON public.finance_faturas FOR DELETE TO authenticated USING (true);

-- Create Storage Bucket for Invoice Documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('finance-documents', 'finance-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;

CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'finance-documents');

CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'finance-documents');
