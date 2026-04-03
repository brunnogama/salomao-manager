import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://iewevhdtwlviudetxgax.supabase.co', '');

async function test() {
    const { data, error } = await supabase.from('collaborators').select('id, name, status').ilike('name', 'Rodrigo Figueiredo da Silva Cotta');
    console.log('User check:', data, error);
}

test();
