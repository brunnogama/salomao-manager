import { supabase } from './src/lib/supabase'; supabase.from('team_leader').select('*').limit(1).then(console.log);
