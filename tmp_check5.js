import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://iewevhdtwlviudetxgax.supabase.co', '');

async function test() {
    const { data, error } = await supabase.from('collaborators').select('*').ilike('name', 'Rodrigo Figueiredo da Silva Cotta').eq('status', 'active');
    console.log('Error:', error);
    console.log('OABs column:', data?.[0]?.oabs);
}

test();
