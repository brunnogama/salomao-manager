import { supabase } from './supabase_local';
async function main() {
    console.log('Fetching office_locations (all rows, no filters)...');
    const { data: offices, error: errorOffices } = await supabase.from('office_locations').select('*');
    if (errorOffices) console.error('Error offices:', errorOffices);
    else console.log('Offices (Count:', offices?.length, '):', JSON.stringify(offices, null, 2));

    console.log('Fetching unique billing_locations from contracts (all rows)...');
    const { data: contracts, error: errorContracts } = await supabase.from('contracts').select('billing_location');
    if (errorContracts) console.error('Error contracts:', errorContracts);
    else {
        const unique = Array.from(new Set(contracts.map(c => c.billing_location).filter(Boolean)));
        console.log('Unique billing_locations:', unique);
    }
    process.exit(0);
}
main();
