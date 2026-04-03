import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data: hons, error } = await supabase
    .from('financial_installments')
    .select('*, contract:contracts ( client_name )')
    .ilike('contract.client_name', '%banco%')
    
  console.log("Error:", error);
  console.log("Hons:", hons?.length);
  //console.log("Contracts:", JSON.stringify(data, null, 2));
  process.exit();
}

check();
