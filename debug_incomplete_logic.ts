
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    fs.writeFileSync('debug_output.txt', 'Missing Supabase credentials\n')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const REQUIRED_FIELDS = [
    { key: 'email', label: 'E-mail' },
    { key: 'phone', label: 'Telefone' },
    { key: 'zip_code', label: 'CEP' },
    { key: 'address', label: 'Logradouro' },
    { key: 'address_number', label: 'Número' },
    { key: 'neighborhood', label: 'Bairro' },
    { key: 'city', label: 'Cidade' },
    { key: 'uf', label: 'Estado' },
    { key: 'gift_type', label: 'Tipo de Brinde' }
]

function log(msg: string) {
    fs.appendFileSync('debug_output.txt', msg + '\n')
    console.log(msg)
}

async function debugIncomplete() {
    fs.writeFileSync('debug_output.txt', '--- Starting Debug ---\n')

    // 1. Fetch raw data
    const { data, error } = await supabase
        .from('client_contacts')
        .select(`
      *,
      client:clients(
        id, name,
        partner:partners(id, name),
        contracts(status)
      )
    `)

    if (error) {
        log('Error fetching data: ' + JSON.stringify(error))
        return
    }

    log(`Total raw contacts fetched: ${data?.length}`)

    if (!data || data.length === 0) return

    // 2. Filter by Active Contracts
    const contactsWithActiveContracts = data.filter((c: any) => {
        const contracts = c.client?.contracts || []
        const hasActive = contracts.some((contractByClient: any) =>
            ['proposal_sent', 'closed'].includes(contractByClient.status)
        )
        // Log sample failures to understand why they are skipped
        // if (!hasActive && Math.random() < 0.05) {
        //    log(`Skipped [${c.name}] - Client: ${c.client?.name}, Contracts:`, contracts.map((ct:any) => ct.status))
        // }
        return hasActive
    })

    log(`Contacts with Active Contracts: ${contactsWithActiveContracts.length}`)

    // 3. Filter by Incomplete Fields
    const incomplete = contactsWithActiveContracts.filter((c: any) => {
        const ignored = c.ignored_fields || []

        const missingFields: string[] = []
        const hasMissing = REQUIRED_FIELDS.some(field => {
            const value = c[field.key]
            const isEmpty = !value || value.toString().trim() === '' || (field.key === 'uf' && (value === 'Selecione' || value === ''))
            const isIgnored = ignored.includes(field.label)

            if (isEmpty && !isIgnored) {
                missingFields.push(field.label)
            }

            return isEmpty && !isIgnored
        })

        if (hasMissing) {
            log(`FOUND INCOMPLETE: [${c.name}] (Client: ${c.client?.name}) - Missing: ${missingFields.join(', ')}`)
        }

        return hasMissing
    })

    log(`Final Incomplete Contacts Count: ${incomplete.length}`)

    // Dump a few examples of contacts that HAVE active contracts but are NOT incomplete, to see if logic is too lenient
    // const completeButActive = contactsWithActiveContracts.filter((c: any) => !incomplete.includes(c))
    // if (completeButActive.length > 0) {
    //     log('--- Sample Complete Contacts ---')
    //     completeButActive.slice(0, 3).forEach((c: any) => {
    //         log(`COMPLETE: [${c.name}]`)
    //         REQUIRED_FIELDS.forEach(f => {
    //             log(`  - ${f.key}: '${c[f.key]}'`)
    //         })
    //     })
    // }

    // Dump status of contracts for a few raw contacts to verify status values
    log('--- Sample Contract Statuses ---')
    data.slice(0, 5).forEach((c: any) => {
        const statuses = c.client?.contracts?.map((ct: any) => ct.status)
        log(`Client ${c.client?.name}: ${statuses?.join(', ')}`)
    })

}

debugIncomplete()
