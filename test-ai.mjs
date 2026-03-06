import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://iewevhdtwlviudetxgax.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlld2V2aGR0d2x2aXVkZXR4Z2F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NTMxNzEsImV4cCI6MjA4MzEyOTE3MX0.jQr91dNKSrwypja7UoDnv8oiE29L_dpy-mPQ_3vW5Sw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
    const { data: candidates } = await supabase.from('candidatos').select('id, nome').order('updated_at', { ascending: false }).limit(1);
    console.log('Latest candidate:', candidates?.[0]);

    if (candidates && candidates.length > 0) {
        console.log('Invoking Function for candidate:', candidates[0].id);
        const { data, error } = await supabase.functions.invoke('analisar-curriculo-cv', {
            body: { context: 'candidato', candidatoId: candidates[0].id }
        });

        if (error) {
            console.log('Invoke failed with error object:', error);
            if (error.context && typeof error.context.json === 'function') {
                console.log('context JSON:', await error.context.json().catch(e => e.message));
            } else if (error.context && typeof error.context.text === 'function') {
                console.log('context text:', await error.context.text().catch(e => e.message));
            }
        } else {
            console.log('Success:', data);
        }
    }
}

test();
