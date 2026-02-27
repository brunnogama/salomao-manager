import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

async function queryPartners() {
    const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

    console.log("Fetching partners...");
    const { data, error } = await supabase.from('partners').select('*').limit(2);

    if (error) {
        console.error("Error fetching:", error);
    } else {
        console.log("Partners Sample:", JSON.stringify(data, null, 2));
    }
}

queryPartners();
