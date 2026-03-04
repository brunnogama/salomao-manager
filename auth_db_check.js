import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://iewevhdtwlviudetxgax.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
    await supabase.auth.signInWithPassword({
        email: process.env.VITE_REPORT_USER,
        password: process.env.VITE_REPORT_PASSWORD,
    });

    const { data: histData, error } = await supabase
        .from('candidato_historico')
        .select('*')
        .limit(1);

    if (histData && histData.length > 0) {
        console.log("Columns:", Object.keys(histData[0]));
        console.log("Data:", histData[0]);
    }
}

checkDatabase();
