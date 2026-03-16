import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('c:/Users/MárcioGama/OneDrive - SALOMAO, KAIUCA & ABRAHAO SOCIEDADE DE ADVOGADOS/Área de Trabalho/Projetos/salomao-manager/.env', 'utf8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const supabase = createClient(urlMatch[1], keyMatch[1]);

async function migrate() {
  const sql = `
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'opponents' AND column_name = 'cnpj'
        ) THEN
            ALTER TABLE opponents ADD COLUMN cnpj text;
        END IF;
    END $$;
  `;
  
  // Como as vezes via rpc a anon key ñ tem permissão DDL, vamos apenas testar 
  // fazer um select no cnpj. Se falhar, pedimos p usuário rodar.
  const { error } = await supabase.from('opponents').select('cnpj').limit(1);
  if (error) {
     console.log("Error querying CNPJ from opponents: ", error.message);
     console.log("USER_NEEDS_TO_RUN_MIGRATION");
  } else {
     console.log("Column CNPJ already exists or is readable.");
  }
}

migrate();
