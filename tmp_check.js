import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://iewevhdtwlviudetxgax.supabase.co', '');

async function test() {
    const { data: partners } = await supabase.from('partners').select('*').ilike('name', '%Rodrigo%');
    console.log('Partners:', partners.map(p => `'${p.name}'`));

    const { data: collabs } = await supabase.from('collaborators').select('name, status').ilike('name', '%Rodrigo%');
    console.log('Collabs:', collabs.map(c => `'${c.name}' (status: ${c.status})`));
}

test();
