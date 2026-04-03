
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://iewevhdtwlviudetxgax.supabase.co'
const supabaseKey = ''

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
