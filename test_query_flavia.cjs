require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const flaviaId = '0746993d-53ff-4af5-bbf2-9954da5d5131';

async function run() {
  console.log('Testing old columns...');
  const { data: d1 } = await supabase.from('collaborators').select('id, name').or(`leader_id.eq.${flaviaId},partner_id.eq.${flaviaId}`);
  console.log('Has dependent in old columns:', d1 ? d1.length : 0);
  
  console.log('Testing JSONB cs syntax with []...');
  const { data: d2 } = await supabase.from('collaborators').select('id, name, leader_ids').contains('leader_ids', [flaviaId]);
  console.log('Via contains():', d2 ? d2.length : 'error');

  const { data: d3, error: e3 } = await supabase.from('collaborators').select('id, name, leader_ids').or(`leader_ids.cs.["${flaviaId}"],partner_ids.cs.["${flaviaId}"]`);
  console.log('Via .or with []:', d3 ? d3.length : e3);

  const { data: d4, error: e4 } = await supabase.from('collaborators').select('id, name, leader_ids').or(`leader_ids.cs.{"${flaviaId}"},partner_ids.cs.{"${flaviaId}"}`);
  console.log('Via .or with {}:', d4 ? d4.length : e4);
}
run();
