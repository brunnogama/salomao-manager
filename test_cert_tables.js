import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Faltam variáveis de ambiente VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabase() {
    console.log("=== Testando Acesso às Tabelas Novas ===");

    // Teste 1: certificate_names
    console.log("\nProcurando certificate_names...");
    const { data: names, error: err1 } = await supabase.from('certificate_names').select('*').limit(2);
    if (err1) {
        console.error("❌ Erro em certificate_names:", err1.message);
    } else {
        console.log(`✅ Sucesso! Encontrados ${names?.length || 0} registros.`);
        console.log(names);
    }

    // Teste 2: certificate_agencies
    console.log("\nProcurando certificate_agencies...");
    const { data: agencies, error: err2 } = await supabase.from('certificate_agencies').select('*').limit(2);
    if (err2) {
        console.error("❌ Erro em certificate_agencies:", err2.message);
    } else {
        console.log(`✅ Sucesso! Encontrados ${agencies?.length || 0} registros.`);
        console.log(agencies);
    }
}

testSupabase();
