import XLSX from 'xlsx-js-style'
import { Collaborator, Partner } from '../../../types/controladoria'
import { formatDateToDisplay } from './colaboradoresUtils'

interface ExportOptions {
    filtered: Collaborator[];
    rateios: { id: string | number; name: string }[];
    hiringReasons: { id: string | number; name: string }[];
    partners: Partial<Partner>[];
    colaboradores: Collaborator[];
    terminationInitiatives: { id: string | number; name: string }[];
    terminationTypes: { id: string | number; name: string }[];
    terminationReasons: { id: string | number; name: string }[];
    roles?: { id: string | number; name: string }[];
    locations?: { id: string | number; name: string }[];
    teams?: { id: string | number; name: string }[];
    atuacoes?: { id: string | number; name: string }[];
    fileName?: string;
}

const getLookupName = (list: { id: string | number; name: string }[], id?: string | number) => {
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
        terminationReasons,
        roles = [],
        locations = [],
        teams = [],
        atuacoes = []
    } = options

    const sortedData = [...filtered].sort((a, b) => {
        if (a.status === b.status) return (a.name || '').localeCompare(b.name || '');
        return a.status === 'active' ? -1 : 1;
    });

    const dataToExport = sortedData.map(c => ({
        'ID': c.matricula_interna || c.id,
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
        'Nome da Mãe': c.mae,
        'Nome do Pai': c.pai,
        'Nacionalidade': c.nacionalidade,
        'Naturalidade (Cidade)': c.naturalidade_cidade,
        'Naturalidade (UF)': c.naturalidade_uf,
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
        'OAB Emissão': formatDateToDisplay(c.oab_emissao),
        'OAB Validade': formatDateToDisplay(c.oabs?.find((o: any) => o.tipo === 'Principal')?.validade) || '',
        'Tipo Inscrição OAB': c.oabs?.find((o: any) => o.tipo === 'Principal')?.tipo || '',

        'PIS/PASEP': c.pis || c.pis_pasep,
        'Título de Eleitor': c.tituloseleitor,
        'Matrícula e-Social': c.matricula_esocial,
        'Dispensa Militar/Reservista': c.dispensa_militar || c.reservista,
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

        'Forma de Pagamento': c.forma_pagamento,
        'Nome do Banco': c.banco_nome,
        'Tipo de Conta': c.banco_tipo_conta,
        'Agência': c.banco_agencia,
        'Conta': c.banco_conta,
        'Tipo PIX': c.pix_tipo,
        'Chave PIX': c.pix_chave,

        'Status': c.status === 'active' ? 'Ativo' : 'Inativo',
        'Rateio': getLookupName(rateios, c.rateio_id),
        'Data Admissão': formatDateToDisplay(c.hire_date),
        'Motivo Contratação': getLookupName(hiringReasons, c.hiring_reason_id),
        'Tipo Contrato': c.contract_type,
        'Email Corporativo': c.email,
        'Email Pessoal': c.email_pessoal,
        'Telefone': c.telefone,
        'Área': c.area,
        'Sócio Responsável': (c as any).partner?.name || getLookupName(partners as any[], c.partner_id),
        'Líder Direto': (c as any).leader?.name || getLookupName(colaboradores as any[], c.leader_id),
        'Equipe': (c as any).teams?.name || getLookupName(teams, c.equipe) || c.equipe,
        'Cargo': (c as any).roles?.name || getLookupName(roles, c.role) || c.role,
        'Atuação': getLookupName(atuacoes, c.atuacao) || c.atuacao,
        'Local': (c as any).locations?.name || getLookupName(locations, c.local) || c.local,
        'Tipo Transporte': c.transportes?.map((t: any) => t.tipo).join(', ') || '',
        'Quantidade Ida': c.transportes?.reduce((sum: number, t: any) => sum + (t.ida_qtd || 0), 0) || 0,
        'Quantidade Volta': c.transportes?.reduce((sum: number, t: any) => sum + (t.volta_qtd || 0), 0) || 0,
        'Total Ida': c.transportes?.reduce((sum: number, t: any) => sum + (t.ida_valores?.reduce((a: number, b: number) => a + (b || 0), 0) || 0), 0) || 0,
        'Total Volta': c.transportes?.reduce((sum: number, t: any) => sum + (t.volta_valores?.reduce((a: number, b: number) => a + (b || 0), 0) || 0), 0) || 0,
        'Custo Total Transporte': c.transportes?.reduce((sum: number, t: any) => sum + (t.ida_valores?.reduce((a: number, b: number) => a + (b || 0), 0) || 0) + (t.volta_valores?.reduce((a: number, b: number) => a + (b || 0), 0) || 0), 0) || 0,

        'Data Desligamento': formatDateToDisplay(c.termination_date),
        'Iniciativa Desligamento': getLookupName(terminationInitiatives, c.termination_initiative_id),
        'Tipo Desligamento': getLookupName(terminationTypes, c.termination_type_id),
        'Motivo Desligamento': getLookupName(terminationReasons, c.termination_reason_id),
        'Observações Histórico': c.history_observations
    }));

    const now = new Date();
    const formattedDate = now.toLocaleDateString('pt-BR').replace(/\//g, '-');
    const formattedTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }).replace(':', '-');
    const finalFileName = options.fileName
        ? `${options.fileName}.xlsx`
        : `Colaboradores_${formattedDate}_${formattedTime}.xlsx`;

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
    XLSX.writeFile(wb, finalFileName);
};
