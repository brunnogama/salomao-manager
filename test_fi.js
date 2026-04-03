import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase
    .from('financial_installments')
    .select('*, contract:contracts!inner(id, hon_number, client_name)')
    .limit(1);
    
  console.log("Error:", error);
  console.log("Data:", JSON.stringify(data, null, 2));
}

check();
