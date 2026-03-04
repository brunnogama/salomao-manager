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

    const { data: evData, error } = await supabase.from('eventos').select('*').limit(1);
    if (evData && evData.length > 0) {
        console.log("Colunas de EVENTOS:", Object.keys(evData[0]));
        console.log("Valores do primeiro evento:", evData[0]);
    } else {
        console.log("Sem eventos");
    }

    const { data: chData, error: error2 } = await supabase.from('candidato_historico').select('*').limit(1);
    if (chData && chData.length > 0) {
        console.log("\nColunas de CANDIDATO_HISTORICO:", Object.keys(chData[0]));
    }
}

checkDatabase();
