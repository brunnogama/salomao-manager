import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const { data, error } = await supabase.from('team_leader').select('*');
console.log("TLs:", data, error);
const { data: cols } = await supabase.from('collaborators').select('id, name').limit(3);
console.log("Cols:", cols);
const { data: parts } = await supabase.from('partners').select('id, name').limit(3);
console.log("Parts:", parts);
