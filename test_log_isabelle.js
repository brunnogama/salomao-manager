import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Authenticating...");
  const { error: authErr } = await supabase.auth.signInWithPassword({
    email: process.env.VITE_REPORT_USER,
    password: process.env.VITE_REPORT_PASSWORD
  });

  if (authErr) console.error("Auth error:", authErr.message);

  console.log("Checking column types for 'candidatos'...");
  const { data: cols, error: colErr } = await supabase.rpc('get_table_columns_by_name', { table_name: 'candidatos' });
  if (colErr) {
      console.log("Attempting via direct postgres query...");
      const { data: typData, error: typErr } = await supabase.from('candidatos').select('*').limit(1);
      console.log(typData);
  } else {
      console.log("Columns:", cols);
  }
}

test();
