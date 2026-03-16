-- Migration: Create Sucumbencias Table for Controladoria
-- Description: Stores processed LegalOne events categorized as sucumbência (both verified and dismissed).

CREATE TABLE IF NOT EXISTS public.sucumbencias (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    processo_cnj VARCHAR(255) NOT NULL,
    responsavel VARCHAR(255),
    uf VARCHAR(2),
    data_andamento VARCHAR(50),
    tipo_andamento VARCHAR(255),
    subtipo_andamento VARCHAR(255),
    descricao TEXT,
    status VARCHAR(50) NOT NULL CHECK (status IN ('verificado', 'descartado')),
    hash_id VARCHAR(255) UNIQUE, -- to help prevent duplicate inserts of the same event
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.sucumbencias ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read access for all users" ON public.sucumbencias FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.sucumbencias FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.sucumbencias FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.sucumbencias FOR DELETE USING (true);

-- Indexes for fast filtering
CREATE INDEX IF NOT EXISTS idx_sucumbencias_processo_status ON public.sucumbencias(processo_cnj, status);
CREATE INDEX IF NOT EXISTS idx_sucumbencias_hash ON public.sucumbencias(hash_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_sucumbencias_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sucumbencias_updated_at
    BEFORE UPDATE ON public.sucumbencias
    FOR EACH ROW
    EXECUTE PROCEDURE update_sucumbencias_updated_at_column();
