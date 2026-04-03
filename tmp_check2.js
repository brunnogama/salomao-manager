import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://iewevhdtwlviudetxgax.supabase.co', '');

async function test() {
    const { data, error } = await supabase.from('collaborators').select('id, name').ilike('name', 'Rodrigo Figueiredo da Silva Cotta');
    console.log('Duplicates check:', data?.length, data, error);
}

test();
