import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
    const { error: authErr } = await supabase.auth.signInWithPassword({
        email: process.env.VITE_REPORT_USER,
        password: process.env.VITE_REPORT_PASSWORD
    })
    
    if (authErr) {
        console.error("Auth failed", authErr)
        return
    }

    console.log("Fetching one candidate...");
    let { data: cands, error: fetchErr } = await supabase.from('candidatos').select('id').not('avaliacao_lider', 'is', null).limit(1);
    
    if (fetchErr || !cands || cands.length === 0) {
        // Try getting any candidate
        const { data: cands2 } = await supabase.from('candidatos').select('id').limit(1);
        if (!cands2 || cands2.length === 0) {
            console.error("Failed to get any candidate");
            return;
        }
        cands = cands2;
    }
    
    const cid = cands[0].id;
    console.log("Testing with ID:", cid);
    
    const { data, error } = await supabase.rpc('save_candidato_feedback', {
        p_candidato_id: cid,
        p_avaliacao: 'Recomendado',
        p_obs: 'Test from script'
    });
    
    console.log("Result:", data);
    console.log("Fetching history schema...");
    const { data: hist } = await supabase.from('candidato_historico').select('*').limit(1);
    if (hist && hist.length > 0) {
        console.log("candidato_historico columns:", Object.keys(hist[0]));
    } else {
        console.log("No history records found, attempting empty insert to get error...");
        const { error: insErr } = await supabase.from('candidato_historico').insert({}).select()
        console.log("Insert error (should list columns or missing cols):", insErr)
    }
}

test()
