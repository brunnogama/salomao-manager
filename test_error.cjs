require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const id1 = '74680635-366a-4c71-992f-79c4fd0f98da';
  const id2 = '6a32c64f-361e-4576-b2da-ccd5fca9d8e1';
  const flaviaId = '6128b7aa-8e70-452e-921e-4d28bb956bdb';

  console.log('Testing in...');
  const { data: d1, error: e1 } = await supabase.from('collaborators').select('id, name, role, photo_url, status').in('id', [id1, id2]);
  console.log('Error in:', e1);

  console.log('Testing contains leader_ids...');
  const { data: d2, error: e2 } = await supabase.from('collaborators').select('id, name, role, photo_url, status, leader_ids, partner_ids').contains('leader_ids', [flaviaId]);
  console.log('Error contains:', e2);
  
  console.log('Testing JSONB contains for timeline...');
  const { data: d3, error: e3 } = await supabase.from('collaborator_hierarchy_history').select('*, collaborators(name)').contains('new_leader_ids', [flaviaId]);
  console.log('Error jsonb contains:', e3);
}

run();
