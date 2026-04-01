const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({path: '.env'});

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('financial_installments').select('*, contract:contracts (status)');
  if (error) console.error("ERROR", error);
  else console.log("DATA LENGTH", data?.length);
}

check();
