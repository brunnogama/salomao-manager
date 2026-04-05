import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function listData() {
  const { data: clients } = await supabase.from('clients').select('*').limit(1);
  console.log('Clients:', clients ? Object.keys(clients[0] || {}) : 'none');
}

listData();
