import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_ANON_KEY || '');

async function test() {
  const { data: cols } = await supabase.rpc('get_table_columns_by_name', { table_name: 'candidatos' });
  if (cols) console.log(cols);
  else {
      // Direct query to information_schema if rpc fails
      const { data: qx, error } = await supabase.from('candidatos').select('*').limit(1);
      console.log(error || Object.keys(qx[0]));
  }
}

test();
