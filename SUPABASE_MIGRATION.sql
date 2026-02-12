-- Migration for Collaborator Module Refactor (Idempotent)

-- 1. Add new columns to 'collaborators' table
ALTER TABLE collaborators
ADD COLUMN IF NOT EXISTS rg TEXT,
ADD COLUMN IF NOT EXISTS emergencia_nome TEXT,
ADD COLUMN IF NOT EXISTS emergencia_telefone TEXT,
ADD COLUMN IF NOT EXISTS emergencia_parentesco TEXT,
ADD COLUMN IF NOT EXISTS observacoes TEXT,
ADD COLUMN IF NOT EXISTS matricula_esocial TEXT,
ADD COLUMN IF NOT EXISTS oab_emissao DATE,
ADD COLUMN IF NOT EXISTS centro_custo TEXT,
ADD COLUMN IF NOT EXISTS motivo_desligamento TEXT;

-- 2. Create 'cost_centers' table for new dropdown
CREATE TABLE IF NOT EXISTS cost_centers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for 'cost_centers'
ALTER TABLE cost_centers ENABLE ROW LEVEL SECURITY;

-- Safely recreate policies for 'cost_centers'
DROP POLICY IF EXISTS "Enable read access for all users" ON cost_centers;
CREATE POLICY "Enable read access for all users" ON cost_centers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON cost_centers;
CREATE POLICY "Enable insert for authenticated users only" ON cost_centers FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for authenticated users only" ON cost_centers;
CREATE POLICY "Enable update for authenticated users only" ON cost_centers FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON cost_centers;
CREATE POLICY "Enable delete for authenticated users only" ON cost_centers FOR DELETE USING (auth.role() = 'authenticated');


-- 3. Create 'termination_reasons' table for new dropdown
CREATE TABLE IF NOT EXISTS termination_reasons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for 'termination_reasons'
ALTER TABLE termination_reasons ENABLE ROW LEVEL SECURITY;

-- Safely recreate policies for 'termination_reasons'
DROP POLICY IF EXISTS "Enable read access for all users" ON termination_reasons;
CREATE POLICY "Enable read access for all users" ON termination_reasons FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON termination_reasons;
CREATE POLICY "Enable insert for authenticated users only" ON termination_reasons FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for authenticated users only" ON termination_reasons;
CREATE POLICY "Enable update for authenticated users only" ON termination_reasons FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON termination_reasons;
CREATE POLICY "Enable delete for authenticated users only" ON termination_reasons FOR DELETE USING (auth.role() = 'authenticated');

-- 4. Initial Seed Data (Optional)
INSERT INTO termination_reasons (name) VALUES 
('Pedido de Demissão'),
('Sem Justa Causa'),
('Com Justa Causa'),
('Término de Contrato'),
('Aposentadoria'),
('Falecimento')
ON CONFLICT (name) DO NOTHING;

INSERT INTO cost_centers (name) VALUES 
('Administrativo'),
('Comercial'),
('Jurídico'),
('Financeiro'),
('RH'),
('TI')
ON CONFLICT (name) DO NOTHING;
