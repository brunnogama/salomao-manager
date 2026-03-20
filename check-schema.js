import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://iewevhdtwlviudetxgax.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '...'; // I need to get this from .env

async function check() {
  // Let's just read .env
  const fs = require('fs');
  const env = fs.readFileSync('.env.local', 'utf8');
  console.log(env.substring(0, 100));
}
check();
