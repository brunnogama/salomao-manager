import { createClient } from '@supabase/supabase-js';
const fs = require('fs');
const envStr = fs.readFileSync('.env.local', 'utf8');

const supabaseUrl = envStr.match(/VITE_SUPABASE_URL=(.*)/)?.[1];
const supabaseKey = envStr.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1];

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('roles').select('*').limit(1);
  console.log("Roles schema sample:", data);
}
check();
