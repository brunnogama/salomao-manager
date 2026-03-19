import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const email = 'isabelle.faria@salomaoadv.com.br';
  console.log(`Authenticating as marcio...`);

  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: process.env.VITE_REPORT_USER,
    password: process.env.VITE_REPORT_PASSWORD
  });
  if (authErr) {
    console.error("Login failed:", authErr.message);
    return;
  }

  console.log(`Checking logs and audit_logs for ${email}...`);

  const { data: logsData, error: lErr } = await supabase.from('logs').select('*').eq('user_email', email).order('created_at', { ascending: false }).limit(5);

  if (lErr) console.error("Error logs:", lErr);
  console.log("Recent LOGS for Isabelle:");
  console.log(logsData);

  const { data: auditData, error: aErr } = await supabase.from('audit_logs').select('*').eq('user_email', email).order('changed_at', { ascending: false }).limit(5);
  if (aErr) console.error("Error audit:", aErr);
  console.log("Recent AUDIT for Isabelle:");
  console.log(auditData);

  // Lets also check all today's logs to see if she appears under a different email or name
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  console.log("Checking all logs for today...");
  const { data: todayLogs } = await supabase.from('logs').select('user_email, details').gte('created_at', today.toISOString());

  const emailsToday = {};
  if (todayLogs) {
    todayLogs.forEach(l => {
      emailsToday[l.user_email] = (emailsToday[l.user_email] || 0) + 1;
    });
  }
  console.log("Emails active today:");
  console.log(emailsToday);
}




test();
