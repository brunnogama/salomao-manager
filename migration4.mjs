import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkDuplicates() {
  const { data } = await supabase.from('contracts').select('hon_number').limit(10);
  console.log(data.map(d => d.hon_number));
}
checkDuplicates();
