import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
    const { data, error } = await supabase.from('contract_processes').select('*').limit(1)
    if (error) {
        console.error("Error:", error)
    } else {
        if (data && data.length > 0) {
            console.log("Columns:", Object.keys(data[0]))
        } else {
            // Force an error to see column list
            const { error: err2 } = await supabase.from('contract_processes').select('non_existent_column_123')
            console.log("Error finding columns:", err2)
        }
    }
}
check()
