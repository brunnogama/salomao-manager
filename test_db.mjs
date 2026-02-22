import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase keys in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
    const { data: offices, error } = await supabase
        .from('office_locations')
        .select('name, cnpj')
        .eq('active', true);

    if (error) {
        console.error('Error fetching office_locations:', error);
    } else {
        console.log('office_locations data:', offices);
    }
}

testQuery();
