-- Enable Row Level Security (RLS) policies for process-related auxiliary tables
-- This allows authenticated users to add, edit, and remove options from the UI

-- 1. process_classes
ALTER TABLE process_classes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON process_classes;
CREATE POLICY "Enable read access for all users" ON process_classes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON process_classes;
CREATE POLICY "Enable insert for authenticated users only" ON process_classes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON process_classes;
CREATE POLICY "Enable update for authenticated users only" ON process_classes FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON process_classes;
CREATE POLICY "Enable delete for authenticated users only" ON process_classes FOR DELETE USING (auth.role() = 'authenticated');

-- 2. process_subjects
ALTER TABLE process_subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON process_subjects;
CREATE POLICY "Enable read access for all users" ON process_subjects FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON process_subjects;
CREATE POLICY "Enable insert for authenticated users only" ON process_subjects FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON process_subjects;
CREATE POLICY "Enable update for authenticated users only" ON process_subjects FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON process_subjects;
CREATE POLICY "Enable delete for authenticated users only" ON process_subjects FOR DELETE USING (auth.role() = 'authenticated');

-- 3. process_positions
ALTER TABLE process_positions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON process_positions;
CREATE POLICY "Enable read access for all users" ON process_positions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON process_positions;
CREATE POLICY "Enable insert for authenticated users only" ON process_positions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON process_positions;
CREATE POLICY "Enable update for authenticated users only" ON process_positions FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON process_positions;
CREATE POLICY "Enable delete for authenticated users only" ON process_positions FOR DELETE USING (auth.role() = 'authenticated');

-- 4. courts
ALTER TABLE courts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON courts;
CREATE POLICY "Enable read access for all users" ON courts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON courts;
CREATE POLICY "Enable insert for authenticated users only" ON courts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON courts;
CREATE POLICY "Enable update for authenticated users only" ON courts FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON courts;
CREATE POLICY "Enable delete for authenticated users only" ON courts FOR DELETE USING (auth.role() = 'authenticated');

-- 5. process_varas
ALTER TABLE process_varas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON process_varas;
CREATE POLICY "Enable read access for all users" ON process_varas FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON process_varas;
CREATE POLICY "Enable insert for authenticated users only" ON process_varas FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON process_varas;
CREATE POLICY "Enable update for authenticated users only" ON process_varas FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON process_varas;
CREATE POLICY "Enable delete for authenticated users only" ON process_varas FOR DELETE USING (auth.role() = 'authenticated');

-- 6. comarcas
ALTER TABLE comarcas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON comarcas;
CREATE POLICY "Enable read access for all users" ON comarcas FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON comarcas;
CREATE POLICY "Enable insert for authenticated users only" ON comarcas FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON comarcas;
CREATE POLICY "Enable update for authenticated users only" ON comarcas FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON comarcas;
CREATE POLICY "Enable delete for authenticated users only" ON comarcas FOR DELETE USING (auth.role() = 'authenticated');

-- 7. process_justice_types
ALTER TABLE process_justice_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON process_justice_types;
CREATE POLICY "Enable read access for all users" ON process_justice_types FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON process_justice_types;
CREATE POLICY "Enable insert for authenticated users only" ON process_justice_types FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON process_justice_types;
CREATE POLICY "Enable update for authenticated users only" ON process_justice_types FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON process_justice_types;
CREATE POLICY "Enable delete for authenticated users only" ON process_justice_types FOR DELETE USING (auth.role() = 'authenticated');

-- 8. magistrates
ALTER TABLE magistrates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON magistrates;
CREATE POLICY "Enable read access for all users" ON magistrates FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON magistrates;
CREATE POLICY "Enable insert for authenticated users only" ON magistrates FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON magistrates;
CREATE POLICY "Enable update for authenticated users only" ON magistrates FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON magistrates;
CREATE POLICY "Enable delete for authenticated users only" ON magistrates FOR DELETE USING (auth.role() = 'authenticated');

-- 9. opponents
ALTER TABLE opponents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON opponents;
CREATE POLICY "Enable read access for all users" ON opponents FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON opponents;
CREATE POLICY "Enable insert for authenticated users only" ON opponents FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON opponents;
CREATE POLICY "Enable update for authenticated users only" ON opponents FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON opponents;
CREATE POLICY "Enable delete for authenticated users only" ON opponents FOR DELETE USING (auth.role() = 'authenticated');

-- 10. authors
ALTER TABLE authors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON authors;
CREATE POLICY "Enable read access for all users" ON authors FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON authors;
CREATE POLICY "Enable insert for authenticated users only" ON authors FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON authors;
CREATE POLICY "Enable update for authenticated users only" ON authors FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON authors;
CREATE POLICY "Enable delete for authenticated users only" ON authors FOR DELETE USING (auth.role() = 'authenticated');

-- 11. clients
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON clients;
CREATE POLICY "Enable read access for all users" ON clients FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON clients;
CREATE POLICY "Enable insert for authenticated users only" ON clients FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON clients;
CREATE POLICY "Enable update for authenticated users only" ON clients FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON clients;
CREATE POLICY "Enable delete for authenticated users only" ON clients FOR DELETE USING (auth.role() = 'authenticated');

