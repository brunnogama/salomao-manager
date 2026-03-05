import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://iewevhdtwlviudetxgax.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlld2V2aGR0d2x2aXVkZXR4Z2F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NTMxNzEsImV4cCI6MjA4MzEyOTE3MX0.jQr91dNKSrwypja7UoDnv8oiE29L_dpy-mPQ_3vW5Sw');

async function test() {
    const { data, error } = await supabase.from('collaborators').select('*').ilike('name', 'Rodrigo Figueiredo da Silva Cotta').eq('status', 'active');
    console.log('Error:', error);
    console.log('OABs column:', data?.[0]?.oabs);
}

test();
