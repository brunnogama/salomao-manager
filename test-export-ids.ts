import { supabase } from './src/lib/supabase';
import { exportColaboradoresXLSX } from './src/components/collaborators/utils/exportColaboradores';

async function run() {
    const { data: cols } = await supabase.from('collaborators').select('*, partner:partner_id(id, name), leader:leader_id(id, name), oab_number(*), education_history:collaborator_education_history(*), team_leader:team_leader(id)').limit(2);
    const { data: roles } = await supabase.from('roles').select('id, name');
    const { data: locations } = await supabase.from('locations').select('id, name');
    const { data: teams } = await supabase.from('teams').select('id, name');
    const { data: rateios } = await supabase.from('rateios').select('id, name');
    const { data: hiringReasons } = await supabase.from('hiring_reasons').select('id, name');
    const { data: atuacoes } = await supabase.from('atuacoes').select('id, name');

    if (!cols || cols.length === 0) { console.log("No data"); return; }
    
    // just map one to see what it looks like before excel
    const c = cols[0];
    
    const getLookupName = (list: any[], id: any) => {
        if (!id) return ''
        return list.find((i: any) => String(i.id) === String(id))?.name || ''
    }

    const testExportObj = {
        'ID': c.matricula_interna || c.id,
        'Nome Completo': c.name,
        'Rateio': getLookupName(rateios || [], c.rateio_id) || c.rateio_id,
        'Motivo Contratação': getLookupName(hiringReasons || [], c.hiring_reason_id) || c.hiring_reason_id,
        'Sócio Responsável': (c as any).partner?.name || getLookupName(cols as any[], c.partner_id) || c.partner_id,
        'Líder Direto': (c as any).leader?.name || getLookupName(cols as any[], c.leader_id) || c.leader_id,
        'Equipe': (c as any).teams?.name || getLookupName(teams || [], c.equipe) || c.equipe,
        'Cargo': (c as any).roles?.name || getLookupName(roles || [], c.role) || c.role,
        'Atuação': getLookupName(atuacoes || [], c.atuacao) || c.atuacao,
        'Local': (c as any).locations?.name || getLookupName(locations || [], c.local) || c.local,
    };

    console.log(JSON.stringify(testExportObj, null, 2));
}

run();
