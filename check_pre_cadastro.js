const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: '.env.local'});
const sp = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
sp.from('collaborators')
  .select('id, name, status, email, candidato_id')
  .eq('status', 'Pré-Cadastro')
  .then(r => console.log(JSON.stringify(r.data, null, 2)))
  .catch(console.error);
