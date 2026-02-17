
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iewevhdtwlviudetxgax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlld2V2aGR0d2x2aXVkZXR4Z2F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NTMxNzEsImV4cCI6MjA4MzEyOTE3MX0.jQr91dNKSrwypja7UoDnv8oiE29L_dpy-mPQ_3vW5Sw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log('Starting data check...');
    const { data: collaborators, error } = await supabase
        .from('collaborators')
        .select('id, name, local');

    if (error) {
        console.error('Error fetching collaborators:', error);
        return;
    }

    const { data: locations, error: locError } = await supabase
        .from('locations')
        .select('id, name');

    if (locError) {
        console.error('Error fetching locations:', locError);
        return;
    }

    console.log('--- Locations ---');
    locations.forEach(l => console.log(`ID: ${l.id}, Name: ${l.name}`));

    console.log('\n--- Collaborators Local Values (Sample) ---');
    // Check for non-numeric values
    const suspicious = collaborators.filter(c => isNaN(Number(c.local)));

    if (suspicious.length > 0) {
        console.log(`Found ${suspicious.length} records with non-numeric local:`);
        const uniqueSuspicious = [...new Set(suspicious.map(c => c.local))];
        console.log('Unique non-numeric values:', uniqueSuspicious);

        // Match with locations
        console.log('\n--- Proposed Mapping ---');
        uniqueSuspicious.forEach(val => {
            if (!val) {
                console.log(`"<empty>" -> NULL`);
                return;
            }
            const match = locations.find(l => l.name.toLowerCase() === val.toLowerCase());
            if (match) {
                console.log(`"${val}" -> ID ${match.id} (${match.name})`);
            } else {
                console.log(`"${val}" -> NO MATCH FOUND`);
            }
        });
    } else {
        console.log('No non-numeric local values found. Data seems consistent.');
    }
}

checkData();
