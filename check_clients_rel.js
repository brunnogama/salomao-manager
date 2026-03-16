import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('c:/Users/MárcioGama/OneDrive - SALOMAO, KAIUCA & ABRAHAO SOCIEDADE DE ADVOGADOS/Área de Trabalho/Projetos/salomao-manager/.env', 'utf8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const supabase = createClient(urlMatch[1], keyMatch[1]);

async function checkRelations() {
  const { data, error } = await supabase.rpc('get_table_schema', { table_name: 'clients' });
  if (error) {
     const { data: q2, error: e2 } = await supabase.from('clients').select('id, contracts(id), client_contacts(id)').limit(1);
     console.log(q2, e2);
  } else {
    console.log(data);
  }
}

checkRelations();
