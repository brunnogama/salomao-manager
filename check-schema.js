import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function fetchAll() {
  const c = await supabase.from('collaborators').select('id, name, status, role')
  const p = await supabase.from('partners').select('*')
  const t = await supabase.from('team_leaders').select('*').catch(() => null)
  
  console.log('Collaborators Count:', c.data?.length)
  console.log('Partners Count:', p.data?.length)
  if (p.data && p.data.length > 0) {
     console.log('Partner keys:', Object.keys(p.data[0]))
  }
}
fetchAll()
