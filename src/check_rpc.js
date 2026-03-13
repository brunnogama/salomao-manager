import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRpc() {
  const { data, error } = await supabase.rpc('get_collaborator_by_token', { p_token: 'test' });
  console.log('Test call error:', error?.message || 'Success', error?.details, error?.hint);
}
checkRpc();
