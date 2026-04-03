const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.test' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data } = await supabase.from('clients').select('id, name, city, uf').eq('name', 'Eleva Quimica Ltda');
  console.dir(data, {depth: null});
}
run();
