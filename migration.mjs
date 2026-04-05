import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  try {
    const { data: clients, error: cerr } = await supabase.from('clients').select('*').limit(1);
    console.log('Clients:', clients && clients.length ? Object.keys(clients[0]) : cerr);
    
    const { data: contracts, error: coerr } = await supabase.from('contracts').select('*').limit(1);
    console.log('Contracts:', contracts && contracts.length ? Object.keys(contracts[0]) : coerr);

    const { data: fins, error: ferr } = await supabase.from('financial_installments').select('*').limit(1);
    console.log('Fins:', fins && fins.length ? Object.keys(fins[0]) : ferr);
  } catch (e) {
    console.error(e);
  }
}

check();
