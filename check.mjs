import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iewevhdtwlviudetxgax.supabase.co';
const supabaseKey = '';
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
