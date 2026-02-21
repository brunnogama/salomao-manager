import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'REPLACE'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'REPLACE'

// Read env variables from .env if needed
import fs from 'fs'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function test() {
  const { data, error } = await supabase.from('collaborators').select('id, name, status, birthday').limit(10)
  console.log('Error:', error)
  console.log('Data:', data)
}
test()
