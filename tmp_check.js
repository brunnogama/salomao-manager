import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://iewevhdtwlviudetxgax.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlld2V2aGR0d2x2aXVkZXR4Z2F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NTMxNzEsImV4cCI6MjA4MzEyOTE3MX0.jQr91dNKSrwypja7UoDnv8oiE29L_dpy-mPQ_3vW5Sw');

async function test() {
    const { data: partners } = await supabase.from('partners').select('*').ilike('name', '%Rodrigo%');
    console.log('Partners:', partners.map(p => `'${p.name}'`));

    const { data: collabs } = await supabase.from('collaborators').select('name, status').ilike('name', '%Rodrigo%');
    console.log('Collabs:', collabs.map(c => `'${c.name}' (status: ${c.status})`));
}

test();
