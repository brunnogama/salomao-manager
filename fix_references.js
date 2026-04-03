require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
(async () => {
    let { data, error } = await supabase.from('contracts').select('id, reference').not('reference', 'is', null);
    if (error) { console.error('Error fetching:', error); process.exit(1); }
    if (!data) return console.log('No data found');
    let updated = 0;
    for (let contract of data) {
        if (contract.reference && (contract.reference.includes('\n') || contract.reference.includes('\r'))) {
            let newRef = contract.reference.replace(/[\r\n]+/g, ' ').trim();
            let res = await supabase.from('contracts').update({ reference: newRef }).eq('id', contract.id);
            if (res.error) console.error(res.error);
            else updated++;
        }
    }
    console.log(`Updated ${updated} contracts!`);
})();
