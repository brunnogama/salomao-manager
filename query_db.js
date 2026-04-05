require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data: clients, error: cErr } = await supabase.from('clients').select('*').limit(1);
  console.log('Clients columns:', clients ? Object.keys(clients[0] || {}) : cErr);
  const { data: contracts, error: coErr } = await supabase.from('contracts').select('*').limit(1);
  console.log('Contracts columns:', contracts ? Object.keys(contracts[0] || {}) : coErr);
  const { data: fin, error: fErr } = await supabase.from('financial_installments').select('*').limit(1);
  console.log('Fin Installments columns:', fin ? Object.keys(fin[0] || {}) : fErr);
}
run();
