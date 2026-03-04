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

    const { data: eventData } = await supabase.from('eventos').select('*').eq('id', 8);
    console.log("\nDetalhes do Evento 8:\n", eventData[0]);
}

checkDatabase();
