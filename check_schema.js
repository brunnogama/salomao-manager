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

async function checkCertificatesSchema() {
    console.log("=== Verificando Estrutura da Tabela certificates ===");
    const { data, error } = await supabase.from('certificates').select('*').limit(1);

    if (error) {
        console.error("❌ Erro ao buscar registros:", error.message);
    } else {
        console.log("✅ Conexão OK. Colunas encontradas no primeiro registro:");
        if (data && data.length > 0) {
            console.log(Object.keys(data[0]));
        } else {
            console.log("Tabela vazia.");
        }
    }
}

checkCertificatesSchema();
