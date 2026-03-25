import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

function normalizeString(str) {
    if (!str) return ''
    return str.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function getSegment(colaborador) {
    const area = normalizeString(colaborador.area)
    if (area === 'administrativa' || area === 'administrativo') return 'Administrativo'
    if (area === 'juridica' || area === 'juridico') return 'Jurídico'
    if (area === 'terceirizada' || area === 'terceirizado') return 'Terceirizada'

    const roleName = colaborador.roles?.name || String(colaborador.role || '')
    const teamName = colaborador.teams?.name || String(colaborador.equipe || '')

    const role = normalizeString(roleName)
    const team = normalizeString(teamName)

    const legalKeywords = ['advogado', 'juridico', 'estagiario de direito', 'estagiario', 'socio']

    if (legalKeywords.some(k => role.includes(k) || team.includes(k))) {
        return 'Jurídico'
    }

    const terceirizadaKeywords = ['terceiriz', 'limpeza', 'seguranca', 'manutencao']
    if (terceirizadaKeywords.some(k => role.includes(k) || team.includes(k))) {
        return 'Terceirizada'
    }

    return 'Administrativo'
}

async function run() {
    console.log("Fetching collaborators...")
    const [
      colabRes,
      rolesRes,
      teamsRes
    ] = await Promise.all([
      supabase.from('collaborators').select('*'),
      supabase.from('roles').select('id, name'),
      supabase.from('teams').select('id, name')
    ]);

    const rolesMap = new Map(rolesRes.data?.map(r => [String(r.id), r.name]) || [])
    const teamsMap = new Map(teamsRes.data?.map(t => [String(t.id), t.name]) || [])

    const enrichedData = colabRes.data.map(c => ({
      ...c,
      roles: { name: rolesMap.get(String(c.role)) || c.role },
      teams: { name: teamsMap.get(String(c.equipe)) || c.equipe },
    }))

    const jur = enrichedData.filter(d => getSegment(d) === 'Jurídico');
    const ter = enrichedData.filter(d => getSegment(d) === 'Terceirizada');
    const adm = enrichedData.filter(d => getSegment(d) === 'Administrativo');

    console.log('--- Headcount Segments ---');
    console.log('Jurídico:', jur.length, 'No hire_date:', jur.filter(d => !d.hire_date).length);
    console.log('Terceirizada:', ter.length, 'No hire_date:', ter.filter(d => !d.hire_date).length);
    console.log('Administrativo:', adm.length, 'No hire_date:', adm.filter(d => !d.hire_date).length);

    console.log('\n--- Sample Jurídico without hire_date ---');
    console.log(jur.filter(d => !d.hire_date).slice(0, 2).map(d => d.name));

}

run();
