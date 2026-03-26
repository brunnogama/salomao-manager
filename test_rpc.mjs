import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://iewevhdtwlviudetxgax.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlld2V2aGR0d2x2aXVkZXR4Z2F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NTMxNzEsImV4cCI6MjA4MzEyOTE3MX0.jQr91dNKSrwypja7UoDnv8oiE29L_dpy-mPQ_3vW5Sw'
const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data: colabs } = await supabase.from('collaborators').select('id').limit(1)
  const id = colabs[0].id
  
  const { data, error } = await supabase.rpc('create_vacation_request', {
    p_collaborator_id: id,
    p_leader_id: id,
    p_aquisitive_period_start: null,
    p_aquisitive_period_end: null
  });
  
  console.log("Returned data isArray?:", Array.isArray(data));
  console.log("data:", data);
  console.log("data.employee_token:", data?.employee_token);
}

test()
