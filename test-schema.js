const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://iewevhdtwlviudetxgax.supabase.co', '');
async function test() {
  const { data, error } = await supabase.from('candidatos').select('*').limit(1);
  console.log(error || data[0]);
}
test();
