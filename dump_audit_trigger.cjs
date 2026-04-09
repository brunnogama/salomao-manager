require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.rpc('query_triggers', { sql: "SELECT proname, prosrc FROM pg_proc WHERE proname LIKE '%audit%';" });
  console.log('Using RPC failed?', error);
}
run();
