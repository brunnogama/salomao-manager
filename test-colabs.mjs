import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const supabaseUrl = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const supabaseKey = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('collaborators').select('id, name, status, birthday').limit(10);
  console.log('Data:', data);
  
  const { data: active } = await supabase.from('collaborators').select('id, name, status, birthday').eq('status', 'active').limit(10);
  console.log('Active Data:', active);

  const { data: bday } = await supabase.from('collaborators').select('id, name, status, birthday').not('birthday', 'is', null).limit(10);
  console.log('Bday Data:', bday);
}
test();
