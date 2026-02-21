import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('/home/brunogama/Projetos/salomao-manager/.env', 'utf8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const supabase = createClient(urlMatch[1], keyMatch[1]);

async function run() {
  const { data, error } = await supabase.from('colaboradores').select('*');
  console.log("Total colaboradores:", data.length);
  const cargos = data.map(d => d.cargo).filter(Boolean).map(c => c.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
  console.log("Unique cargos:", [...new Set(cargos)]);
}
run();
