import XLSX from 'xlsx-js-style'
import { Collaborator, Partner } from '../../../types/controladoria'
import { formatDateToDisplay } from './colaboradoresUtils'

interface ExportOptions {
    filtered: Collaborator[];
    rateios: { id: string; name: string }[];
    hiringReasons: { id: string; name: string }[];
    partners: Partial<Partner>[];
    colaboradores: Collaborator[];
    terminationInitiatives: { id: string; name: string }[];
    terminationTypes: { id: string; name: string }[];
    terminationReasons: { id: string; name: string }[];
}

const getLookupName = (list: { id: string; name: string }[], id?: string | number) => {
    if (!id) return ''
    return list.find(i => String(i.id) === String(id))?.name || ''
}

export const exportColaboradoresXLSX = (options: ExportOptions) => {
    const {
        filtered,
        rateios,
        hiringReasons,
        partners,
        colaboradores,
        terminationInitiatives,
        terminationTypes,
        terminationReasons
    } = options

    const sortedData = [...filtered].sort((a, b) => {
        if (a.status === b.status) return (a.name || '').localeCompare(b.name || '');
        return a.status === 'active' ? -1 : 1;
    });

    const dataToExport = sortedData.map(c => ({
        'ID': c.id,
        'Nome Completo': c.name,
        'CPF': c.cpf,
        'RG': c.rg,
        'Data Nascimento': formatDateToDisplay(c.birthday),
        'Gênero': c.gender,
        'Estado Civil': c.civil_status,
        'Possui Filhos?': c.has_children ? 'Sim' : 'Não',
        'Quantidade de Filhos': c.children_count || 0,
        'Nome Emergência': c.emergencia_nome,
        'Telefone Emergência': c.emergencia_telefone,
        'Parentesco Emergência': c.emergencia_parentesco,
        'Observações': c.observacoes,
        'CEP': c.zip_code,
        'Endereço': c.address,
        'Número': c.address_number,
        'Complemento': c.address_complement,
        'Bairro': c.neighborhood,
        'Cidade': c.city,
        'Estado': c.state,

        'OAB Número': c.oabs?.find((o: any) => o.tipo === 'Principal')?.numero || '',
        'OAB UF': c.oabs?.find((o: any) => o.tipo === 'Principal')?.uf || '',
        'OAB Validade': formatDateToDisplay(c.oabs?.find((o: any) => o.tipo === 'Principal')?.validade) || '',
        'Tipo Inscrição OAB': c.oabs?.find((o: any) => o.tipo === 'Principal')?.tipo || '',
        'PIS/PASEP': c.pis || c.pis_pasep,
        'Matrícula e-Social': c.matricula_esocial,
        'Dispensa Militar': c.dispensa_militar,
        'CTPS': c.ctps || c.ctps_numero,
        'Série CTPS': c.ctps_serie,
        'UF CTPS': c.ctps_uf,

        'Nível Escolaridade': c.escolaridade_nivel,
        'Subnível': c.escolaridade_subnivel,
        'Instituição': c.escolaridade_instituicao,
        'Curso': c.escolaridade_curso,
        'Matrícula Escolar': c.escolaridade_matricula,
        'Semestre': c.escolaridade_semestre,
        'Previsão Conclusão': formatDateToDisplay(c.escolaridade_previsao_conclusao),

        'Status': c.status === 'active' ? 'Ativo' : 'Inativo',
        'Rateio': getLookupName(rateios, c.rateio_id),
        'Data Admissão': formatDateToDisplay(c.hire_date),
        'Motivo Contratação': getLookupName(hiringReasons, c.hiring_reason_id),
        'Tipo Contrato': c.contract_type,
        'Email Corporativo': c.email,
        'Sócio Responsável': (c as any).partner?.name || getLookupName(partners as any[], c.partner_id),
        'Líder Direto': (c as any).leader?.name || getLookupName(colaboradores as any[], c.leader_id),
        'Equipe/Área': (c as any).teams?.name || c.equipe,
        'Cargo': (c as any).roles?.name || c.role,
        'Centro de Custo': c.centro_custo,
        'Local': (c as any).locations?.name || c.local,

        'Data Desligamento': formatDateToDisplay(c.termination_date),
        'Iniciativa Desligamento': getLookupName(terminationInitiatives, c.termination_initiative_id),
        'Tipo Desligamento': getLookupName(terminationTypes, c.termination_type_id),
        'Motivo Desligamento': getLookupName(terminationReasons, c.termination_reason_id),
        'Observações Histórico': c.history_observations
    }));

    const now = new Date();
    const formattedDate = now.toLocaleDateString('pt-BR').replace(/\//g, '-');
    const formattedTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }).replace(':', '-');
    const fileName = `Colaboradores_${formattedDate}_${formattedTime}.xlsx`;

    const ws = XLSX.utils.json_to_sheet(dataToExport);

    // Apply Styles
    // Range gives us the dimensions Ex: "A1:Z100"
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

    // Iterate rows (skipping header 0)
    for (let R = 1; R <= range.e.r; ++R) {
        // Check status in the data source (sortedData[R-1])
        const isInactive = sortedData[R - 1]?.status !== 'active';

        if (isInactive) {
            // Encode cell address for 'Nome Completo' (Column A -> 0)
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: 0 }); // 0 is Name column index

            if (!ws[cellAddress]) continue;

            // Apply Red Font Style
            ws[cellAddress].s = {
                font: {
                    color: { rgb: "FF0000" },
                    bold: true
                }
            };
        }
    }

    // Auto-width for columns (Optional but good)
    const wscols = Object.keys(dataToExport[0] || {}).map(() => ({ wch: 20 }));
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Colaboradores");
    XLSX.writeFile(wb, fileName);
};
