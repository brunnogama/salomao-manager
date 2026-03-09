/* Create Bolsa de Estagio Rules Table */
CREATE TABLE IF NOT EXISTS public.bolsa_estagio_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ano_inicio INTEGER NOT NULL,
    ano_fim INTEGER NOT NULL,
    periodo_inicio INTEGER NOT NULL,
    periodo_fim INTEGER NOT NULL,
    valor_bolsa NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- RLS
ALTER TABLE public.bolsa_estagio_rules ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated users
CREATE POLICY "Allow read access for authenticated users on bolsa_estagio_rules"
ON public.bolsa_estagio_rules
FOR SELECT
TO authenticated
USING (true);

-- Allow all access for authenticated users with specific roles (if needed, or just all authenticated for now)
CREATE POLICY "Allow all access for authenticated users on bolsa_estagio_rules"
ON public.bolsa_estagio_rules
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_bolsa_estagio_rules_updated_at ON public.bolsa_estagio_rules;
CREATE TRIGGER trg_bolsa_estagio_rules_updated_at
BEFORE UPDATE ON public.bolsa_estagio_rules
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Initial Seed Data
INSERT INTO public.bolsa_estagio_rules (ano_inicio, ano_fim, periodo_inicio, periodo_fim, valor_bolsa)
VALUES
(1, 2, 1, 4, 2200.00),
(3, 3, 5, 6, 2500.00),
(4, 5, 7, 10, 3000.00)
ON CONFLICT DO NOTHING;
