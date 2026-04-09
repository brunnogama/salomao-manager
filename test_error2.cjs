require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const flaviaId = '6128b7aa-8e70-452e-921e-4d28bb956bdb';

  console.log('Testing JSONB contains with string...');
  const { data: d3, error: e3 } = await supabase.from('collaborator_hierarchy_history').select('*, collaborators(name)').contains('new_leader_ids', `["${flaviaId}"]`);
  console.log('Error jsonb contains (string array literal):', e3);
  console.log('Data:', d3 ? d3.length : 0);

  // Testing text array contains for collaborators
  const { data: d4, error: e4 } = await supabase.from('collaborators').select('id, name, leader_ids').contains('leader_ids', `{${flaviaId}}`);
  console.log('Error text array contains (brackets { }):', e4);

  const { data: d5, error: e5 } = await supabase.from('collaborators').select('id, name, leader_ids').contains('leader_ids', [flaviaId]);
  console.log('Error text array contains (JS Array):', e5);
}

run();
