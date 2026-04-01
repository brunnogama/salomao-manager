import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('contracts').select('seq_id, final_success_extras_clauses, pro_labore_extras, pro_labore_extras_clauses').not('final_success_extras_clauses', 'is', null).limit(10);
  console.log("final success extras clauses:", JSON.stringify(data, null, 2));
}

run();
