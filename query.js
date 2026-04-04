import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const { data } = await supabase.from('contracts').select('id, hon_number, client_name, final_success_fee, final_success_percent, intermediate_fees, final_success_extras').in('hon_number', ['000390/001', '000389/001', '000390', '000389']);
console.log(JSON.stringify(data, null, 2));
