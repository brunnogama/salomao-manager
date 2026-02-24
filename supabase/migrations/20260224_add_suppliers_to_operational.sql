-- Migration: Add supplier support to operational items
-- Date: 2026-02-24

-- Add supplier column to shopping_list_items
ALTER TABLE public.shopping_list_items 
ADD COLUMN IF NOT EXISTS supplier TEXT;

-- Create operational_fornecedores table
CREATE TABLE IF NOT EXISTS public.operational_fornecedores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.operational_fornecedores ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.operational_fornecedores;
CREATE POLICY "Enable read access for all users" ON public.operational_fornecedores FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.operational_fornecedores;
CREATE POLICY "Enable insert for authenticated users only" ON public.operational_fornecedores FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.operational_fornecedores;
CREATE POLICY "Enable update for authenticated users only" ON public.operational_fornecedores FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.operational_fornecedores;
CREATE POLICY "Enable delete for authenticated users only" ON public.operational_fornecedores FOR DELETE USING (auth.role() = 'authenticated');

-- Seed initial suppliers
INSERT INTO public.operational_fornecedores (nome)
VALUES 
('Kalunga'),
('Gimba'),
('Papelaria Ipanema'),
('Extra'),
('Pão de Açúcar'),
('Amazon'),
('Mercado Livre')
ON CONFLICT (nome) DO NOTHING;
