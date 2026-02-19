
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const LOG_FILE = 'debug_output.txt';

function log(msg) {
    try {
        fs.appendFileSync(LOG_FILE, msg + '\n');
        console.log(msg); // fallback
    } catch (e) {
        // console.error('Failed to log', e);
    }
}

async function main() {
    try {
        fs.writeFileSync(LOG_FILE, '--- STARTING DEBUG ---\n');

        // 1. Env
        let supabaseUrl = process.env.VITE_SUPABASE_URL;
        let supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            log('Env vars missing from process.env, trying to read file...');
            const envPath = path.resolve(process.cwd(), '.env');
            if (fs.existsSync(envPath)) {
                const envConfig = fs.readFileSync(envPath, 'utf-8');
                envConfig.split('\n').forEach(line => {
                    const parts = line.split('=');
                    if (parts.length >= 2) {
                        const key = parts[0].trim();
                        const value = parts.slice(1).join('=').trim();
                        if (key === 'VITE_SUPABASE_URL') supabaseUrl = value;
                        if (key === 'VITE_SUPABASE_ANON_KEY') supabaseKey = value;
                    }
                });
            }
        }

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing Supabase credentials even after reading .env');
        }

        log('Supabase URL found: ' + supabaseUrl);

        // 2. Client
        const supabase = createClient(supabaseUrl, supabaseKey);
        log('Supabase client created.');

        // 3. Query
        log('Fetching data...');
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
            .limit(50); // Limit for safety

        if (error) {
            log('Supabase Error: ' + JSON.stringify(error));
            return;
        }

        log(`Fetched ${data?.length} rows.`);

        if (!data) return;

        // 4. Analyze
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
        ];

        let incompleteCount = 0;

        data.forEach(c => {
            const clientName = c.client?.name || 'No Client';
            const isActive = c.client?.contracts?.some(ct => ['active', 'proposal', 'probono'].includes(ct.status));

            if (!isActive) return; // Skip inactive

            const ignored = c.ignored_fields || [];
            const missing = [];

            REQUIRED_FIELDS.forEach(field => {
                const val = c[field.key];
                const isEmpty = !val || val.toString().trim() === '' || (field.key === 'uf' && (val === 'Selecione' || val === ''));
                const isIgnored = ignored.includes(field.label);
                if (isEmpty && !isIgnored) missing.push(field.label);
            });

            if (missing.length > 0) {
                incompleteCount++;
                log(`INCOMPLETE: ${c.name} (${clientName}) - Missing: ${missing.join(', ')}`);
            } else {
                // log(`COMPLETE: ${c.name} (${clientName})`);
            }
        });

        log(`Total Incomplete Found: ${incompleteCount}`);

    } catch (err) {
        fs.appendFileSync(LOG_FILE, '\nFATAL ERROR: ' + err.message + '\n' + err.stack);
    }
}

main();
