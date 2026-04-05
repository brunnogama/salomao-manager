import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function listData() {
  const { data: clients } = await supabase.from('clients').select('id, name').limit(5);
  console.log('Clients:', clients);
  
  const { data: contracts } = await supabase.from('contracts').select('id, hon_number, client_id, seq_id').not('hon_number', 'is', null).limit(5);
  console.log('Contracts:', contracts);
}

listData();
