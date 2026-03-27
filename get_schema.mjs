import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function main() {
    const { data, error } = await supabase.from('collaborator_absences').select('*').limit(1);
    console.dir(data?.[0]);
}
main();
