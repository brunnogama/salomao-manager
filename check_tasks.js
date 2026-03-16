import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('c:/Users/MárcioGama/OneDrive - SALOMAO, KAIUCA & ABRAHAO SOCIEDADE DE ADVOGADOS/Área de Trabalho/Projetos/salomao-manager/.env', 'utf8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const supabase = createClient(urlMatch[1], keyMatch[1]);

async function checkTasks() {
  const { error } = await supabase.from('kanban_tasks').select('id').limit(1);
  if (error) {
     console.log("Error querying kanban_tasks: ", error.message);
  } else {
     console.log("Table kanban_tasks exists and is readable.");
  }
}

checkTasks();
