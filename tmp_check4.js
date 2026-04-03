import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://iewevhdtwlviudetxgax.supabase.co', '');

async function test() {
    const { data, error } = await supabase.from('collaborators').select('*, oabs(*)').ilike('name', 'Rodrigo Figueiredo da Silva Cotta').eq('status', 'active').maybeSingle();
    console.log('Error:', error);
    console.log('Data:', data?.name, 'OABS:', data?.oabs);
}

test();
