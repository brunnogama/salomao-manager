
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://iewevhdtwlviudetxgax.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlld2V2aGR0d2x2aXVkZXR4Z2F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NTMxNzEsImV4cCI6MjA4MzEyOTE3MX0.jQr91dNKSrwypja7UoDnv8oiE29L_dpy-mPQ_3vW5Sw'

const supabase = createClient(supabaseUrl, supabaseKey)

async function inspectData() {
    console.log('Fetching collaborators...')
    try {
        const { data, error } = await supabase
            .from('collaborators')
            .select(`
        id, 
        name, 
        status, 
        area, 
        hire_date, 
        termination_date,
        partner:partners(name),
        locations:locations(name)
      `)
            .limit(50)

        if (error) {
            console.error('Error fetching:', error)
            return
        }

        console.log(`Found ${data.length} records. Sample data:`)
        data.forEach(c => {
            console.log('--------------------------------------------------')
            console.log(`Name: ${c.name}`)
            console.log(`Status: "${c.status}"`)
            console.log(`Area: "${c.area}"`)
            console.log(`Hire Date: ${c.hire_date}`)
            console.log(`Term Date: ${c.termination_date}`)
            // console.log(`Partner: ${JSON.stringify(c.partner)}`)
            // console.log(`Location: ${JSON.stringify(c.locations)}`)
        })
    } catch (err) {
        console.error('Exception:', err)
    }
}

inspectData()
