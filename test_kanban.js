import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('kanban_tasks').select('*').limit(1);
  if (error) {
    console.error("Error querying kanban_tasks:", error);
  } else {
    console.log("kanban_tasks data:", data);
  }
}

run();
