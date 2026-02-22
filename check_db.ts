import { supabase } from './src/lib/supabase';
async function main() {
    const { data } = await supabase.from('office_locations').select('*');
    console.log(JSON.stringify(data, null, 2));
    process.exit(0);
}
main();
