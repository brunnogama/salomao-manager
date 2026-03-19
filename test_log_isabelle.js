import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Checking logs to find all unique user_emails...");
  const { data: logsData, error: lErr } = await supabase.from('logs').select('user_email, action').limit(2000).order('created_at', { ascending: false });
  if (lErr) console.error("Error:", lErr);
  
  const counts = {};
  const actionCounts = {};
  
  if (logsData) {
      logsData.forEach(l => {
          counts[l.user_email] = (counts[l.user_email] || 0) + 1;
          actionCounts[l.action] = (actionCounts[l.action] || 0) + 1;
      });
  }
  
  console.log("Unique emails in the last 2000 logs:");
  console.log(counts);
  
  console.log("Action counts:");
  console.log(actionCounts);
}



test();
