-- Create operational_assets table
CREATE TABLE IF NOT EXISTS public.operational_assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT, -- e.g., 'Móveis', 'Equipamentos', 'Decoração'
    location TEXT, -- e.g., 'Recepção', 'Sala de Reunião'
    patrimony_number TEXT,
    acquisition_date DATE,
    value NUMERIC(10, 2),
    status TEXT DEFAULT 'Bom', -- 'Bom', 'Regular', 'Ruim', 'Em Manutenção'
    brand TEXT,
    model TEXT,
    serial_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS (Optional, but good practice)
ALTER TABLE public.operational_assets ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all access for now (since we don't have strict auth rules yet or relying on service role/anon for this app's context seems to be the pattern)
CREATE POLICY "Enable all access for all users" ON public.operational_assets
    FOR ALL USING (true) WITH CHECK (true);
