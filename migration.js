require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data: clients } = await supabase.from('clients').select('*').limit(1);
  console.log('Clients:', clients ? Object.keys(clients[0] || {}) : 'null');
  
  const { data: contracts } = await supabase.from('contracts').select('*').limit(1);
  console.log('Contracts:', contracts ? Object.keys(contracts[0] || {}) : 'null');

  const { data: fins } = await supabase.from('financial_installments').select('*').limit(1);
  console.log('Fins:', fins ? Object.keys(fins[0] || {}) : 'null');
}

check();
