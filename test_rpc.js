import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testFeedback() {
    console.log("Testing get_candidato_public_profile...");
    const { data: profile, error: errProfile } = await supabase.rpc('get_candidato_public_profile', {
        p_candidato_id: '11111111-1111-1111-1111-111111111111' // Replace with proper ID if testing
    });
    console.log("Profile", errProfile || profile);

    console.log("Testing save_candidato_feedback...");
    const { data, error } = await supabase.rpc('save_candidato_feedback', {
        p_candidato_id: '11111111-1111-1111-1111-111111111111',
        p_avaliacao: 'Recomendado',
        p_obs: 'Teste script'
    });
    console.log("Result", error || data);
}

testFeedback();
