import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://iewevhdtwlviudetxgax.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
    console.log("=== CHECKING TUDO DA BRUNA 2 ===");

    const { data: candData, error: candError } = await supabase
        .from('candidatos')
        .select('id, nome, email')
        .ilike('nome', '%Bruna%');

    console.log("Candidatos Bruna:\n", candData || candError);

    const { data: allCands, error: allCErr } = await supabase
        .from('candidatos')
        .select('id, nome, email')
        .limit(10);

    console.log("Alguns Candidatos:\n", allCands?.map(c => c.nome));

    const collabId = '084b5da5-6125-4711-87c0-34de6afa1811';

    // Buscar o collaborator_id para ver se ela tem candidato_id
    const { data: collabs } = await supabase.from('collaborators').select('id, name, candidato_id').eq('id', collabId);
    console.log("Colaboradora Bruna:\n", collabs);

    if (collabs && collabs[0].candidato_id) {
        const cid = collabs[0].candidato_id;
        console.log("Candidato ID vinculado é:", cid);
        const { data: candRecord } = await supabase.from('candidatos').select('id, nome, email').eq('id', cid);
        console.log("Registro do candidato vinculado:\n", candRecord);

        const { data: hist } = await supabase.from('candidato_historico').select('*').eq('candidato_id', cid);
        console.log("Historico_Candidato para ela:\n", hist);
    }
}

checkDatabase();
