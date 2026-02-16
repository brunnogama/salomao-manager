-- Create operational_items table
CREATE TABLE IF NOT EXISTS operational_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  quantity INTEGER DEFAULT 0,
  brand TEXT,
  unit_price NUMERIC,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE operational_items ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Enable read access for all users" ON operational_items;
CREATE POLICY "Enable read access for all users" ON operational_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON operational_items;
CREATE POLICY "Enable insert for authenticated users only" ON operational_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for authenticated users only" ON operational_items;
CREATE POLICY "Enable update for authenticated users only" ON operational_items FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON operational_items;
CREATE POLICY "Enable delete for authenticated users only" ON operational_items FOR DELETE USING (auth.role() = 'authenticated');

-- Seed initial data for Limpeza
INSERT INTO operational_items (name, quantity, brand, unit_price, category)
VALUES
  ('Detergente', 0, '', 0, 'Limpeza'),
  ('Sabonete líquido', 0, '', 0, 'Limpeza'),
  ('Papel Higiênico', 0, '', 0, 'Limpeza'),
  ('Saco de lixo', 0, '', 0, 'Limpeza'),
  ('FreeCô', 0, '', 0, 'Limpeza');
