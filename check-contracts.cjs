const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync('.env'));
const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkContracts() {
    const { data: all, error } = await supabase
        .from('contracts')
        .select('id, client_name, pro_labore, pro_labore_extras, final_success_fee, final_success_extras, intermediate_fees, percent_extras, final_success_percent, timesheet');

    if (error) {
        console.error(error);
        return;
    }

    let found = [];
    all.forEach(c => {
        const name = (c.client_name || '').toLowerCase();
        if (name.includes('rumo') || name.includes('next')) {
            found.push(c);
        }
    });

    console.log("Found:", JSON.stringify(found, null, 2));
    console.log("Total contracts:", all.length);
}

checkContracts();
