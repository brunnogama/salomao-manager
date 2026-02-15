import { supabase } from './src/lib/supabase';

async function test() {
  const { data, error } = await supabase.from('client_contacts').select('*').limit(1);
  if (error) {
    console.error('Error fetching data:', error);
  } else if (data && data.length > 0) {
    console.log('Columns in client_contacts:', Object.keys(data[0]));
  } else {
    // If no data, try to insert a dummy (and roll back or just see if it fails due to column missing)
    console.log('No data in client_contacts to infer columns.');
    // Try to select a non-existent column to see the error message which might list columns
    const { error: error2 } = await supabase.from('client_contacts').select('non_existent_column').limit(1);
    console.log('Error from non-existent column (check for column list):', error2?.message);
  }
}
test();
