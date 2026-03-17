import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iewevhdtwlviudetxgax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlld2V2aGR0d2x2aXVkZXR4Z2F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NTMxNzEsImV4cCI6MjA4MzEyOTE3MX0.jQr91dNKSrwypja7UoDnv8oiE29L_dpy-mPQ_3vW5Sw';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data } = await supabase.from('sucumbencias').select('*').order('created_at', { ascending: false }).limit(20);
    console.log(JSON.stringify(data.map(d => ({
        id: d.id,
        created: d.created_at,
        data: d.data_andamento,
        cli: d.cliente,
        pos: d.posicao_cliente,
        cont: d.contrario
    })), null, 2));
}

run();
