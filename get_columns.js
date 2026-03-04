import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://iewevhdtwlviudetxgax.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    const { data, error } = await supabase.from('candidato_historico').select('*').limit(1);
    if (error) {
        console.error("Error:", error.message);
    } else {
        console.log("Data keys:", data && data.length > 0 ? Object.keys(data[0]) : 'No data, but table exists!');
    }
}

checkColumns();
