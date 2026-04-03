import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://iewevhdtwlviudetxgax.supabase.co'
const supabaseKey = ''

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: false,
        detectSessionInUrl: false
    }
})
export { supabaseUrl, supabaseKey }
