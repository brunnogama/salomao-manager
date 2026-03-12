-- Allow public read access on tables required for Public Dashboards (Volumetry & Demandas)

CREATE POLICY "Allow public read access on processos" ON processos FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public read access on collaborators" ON collaborators FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public read access on contracts" ON contracts FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public read access on partners" ON partners FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public read access on roles" ON roles FOR SELECT TO anon USING (true);
