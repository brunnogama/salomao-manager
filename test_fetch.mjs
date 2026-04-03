import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase
    .from('contracts')
    .select('display_id, reference')
    .limit(1);
    
  console.log("Error:", error);
  process.exit();
}
check();
