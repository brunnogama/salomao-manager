import { supabase } from './src/lib/supabase';

async function test() {
  const { data, error } = await supabase.from('client_contacts').select('*').limit(1);
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Columns:', Object.keys(data[0] || {}));
  }
}
test();
