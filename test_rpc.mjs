import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
    const { data: requests, error: err } = await supabase.from('vacation_requests').select('*').order('created_at', { ascending: false }).limit(2);
    if (!requests || requests.length === 0) {
        console.log('No requests found.');
        return;
    }
    for (const req of requests) {
        console.log(`\nTesting request ${req.id} (Status: ${req.status})`);
        const { data: emplData, error: emplErr } = await supabase.rpc('get_vacation_request_by_employee_token', { p_token: req.employee_token });
        console.log('Employee token result:', emplData ? 'HAS DATA' : 'NO DATA', emplErr || '');
        
        const { data: leaderData, error: leaderErr } = await supabase.rpc('get_vacation_request_by_leader_token', { p_token: req.leader_token });
        console.log('Leader token result:', leaderData ? 'HAS DATA' : 'NO DATA', leaderErr || '');
    }
}
main();
