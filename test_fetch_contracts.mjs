import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const name = "A ! Bodytech";
  const { data, error } = await supabase
    .from('contracts')
    .select('id, hon_number, client_name, client_id, cnpj')
    .or(`client_name.ilike."%${name}%"`);
    
  console.log("Error:", error);
  // console.log("Contracts:", JSON.stringify(data, null, 2));
}

check();
