import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('c:/Users/MárcioGama/OneDrive - SALOMAO, KAIUCA & ABRAHAO SOCIEDADE DE ADVOGADOS/Área de Trabalho/Projetos/salomao-manager/.env', 'utf8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const supabase = createClient(urlMatch[1], keyMatch[1]);

async function checkDuplicates() {
  const { data, error } = await supabase.from('clients').select('*').not('cnpj', 'is', null).neq('cnpj', '');
  if (error) {
    console.error(error);
    return;
  }
  
  const byCnpj = {};
  for (const client of data) {
    if (!byCnpj[client.cnpj]) byCnpj[client.cnpj] = [];
    byCnpj[client.cnpj].push(client);
  }
  
  for (const cnpj in byCnpj) {
    if (byCnpj[cnpj].length > 1) {
      console.log(`CNPJ ${cnpj} has ${byCnpj[cnpj].length} entries:`);
      for (const client of byCnpj[cnpj]) {
        console.log(`  - ID: ${client.id}, Name: "${client.name}"`);
      }
    }
  }
}

checkDuplicates();
