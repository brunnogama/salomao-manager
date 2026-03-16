const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve('c:/Users/MárcioGama/OneDrive - SALOMAO, KAIUCA & ABRAHAO SOCIEDADE DE ADVOGADOS/Área de Trabalho/Projetos/salomao-manager/.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.rpc('get_table_schema', { table_name: 'contract_processes' });
  if (error) {
    // Falhou, vamos tentar apenas fazer um select de teste p ver o cast padrão, ou trazer information_schema se permitido pelo RLS do anon key.
    const { data: cols } = await supabase
      .from('contract_processes')
      .select('magistrates')
      .limit(1);
    console.log("Tipos inferidos:", JSON.stringify(cols));
  } else {
    console.log(data);
  }
}

check();
