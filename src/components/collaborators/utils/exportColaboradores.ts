import XLSX from 'xlsx-js-style'
import { Collaborator, Partner } from '../../../types/controladoria'

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
    selectedColumns?: string[];
}

const getLookupName = (list: { id: string | number; name: string }[], id?: string | number) => {
    if (!id) return ''
    return list.find(i => String(i.id) === String(id))?.name || ''
}

const formatGender = (g?: string) => {
    if (g === 'M') return 'Masculino';
    if (g === 'F') return 'Feminino';
    return g || '';
}

const formatCivilStatus = (cs?: string) => {
    if (!cs) return '';
    const map: Record<string, string> = {
        'solteiro': 'Solteiro(a)',
        'casado': 'Casado(a)',
        'divorciado': 'Divorciado(a)',
        'viuvo': 'Viúvo(a)',
        'uniao_estavel': 'União Estável'
    };
    return map[cs.toLowerCase()] || cs;
}

const formatValueFallback = (val: any) => {
    return val || '';
}

const formatContractType = (ct?: string) => {
    if (!ct) return '';
    if (ct.toUpperCase() === 'CLT') return 'CLT';
    
    return ct.toLowerCase().split(' ').map(word => {
        if (word.length === 0) return word;
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
}

const parseDateForExcel = (isoDate: string | undefined | null): Date | string => {
    if (!isoDate) return '';
    if (isoDate.includes('/')) {
        const parts = isoDate.split('/');
        if (parts.length === 3) {
            return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        }
        if (parts.length === 2) {
            return new Date(Number(parts[1]), Number(parts[0]) - 1, 1);
        }
        return isoDate;
    }
    const cleanDate = isoDate.split('T')[0];
    const parts = cleanDate.split('-');
    if (parts.length !== 3) return isoDate;
    const [y, m, d] = parts;
    return new Date(Number(y), Number(m) - 1, Number(d));
};

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

    const dataToExport = sortedData.map(c => {
        const fullObj = {
        'ID': `COL - ${c.matricula_interna || c.id}`,
        'Nome Completo': c.name,
        'CPF': c.cpf,
        'RG': c.rg,
        'Data Nascimento': parseDateForExcel(c.birthday),
        'Gênero': formatGender(c.gender),
        'Estado Civil': formatCivilStatus(c.civil_status),
        'Possui Filhos?': c.has_children ? 'Sim' : 'Não',
        'Quantidade de Filhos': c.children_count || 0,
        'Filhos (Nome e Nascimento)': c.children_data?.map((f: any) => `${f.name} (${parseDateForExcel(f.birth_date)})`).join(' | ') || '',
        'Nome Emergência': c.emergencia_nome,
        'Telefone Emergência': c.emergencia_telefone,
        'Parentesco Emergência': c.emergencia_parentesco,
        'Contatos de Emergência': c.emergency_contacts?.map((e: any) => `${e.nome} - ${e.telefone} (${e.parentesco})`).join(' | ') || '',
        'Nome da Mãe': c.mae,
        'Nome do Pai': c.pai,
        'Nacionalidade': c.nacionalidade,
        'Naturalidade (Cidade)': c.naturalidade_cidade,
        'Naturalidade (UF)': c.naturalidade_uf,
        'CNH': c.cnh || '',
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
        'OAB Emissão': parseDateForExcel(c.oab_emissao),
        'OAB Validade': parseDateForExcel(c.oabs?.find((o: any) => o.tipo === 'Principal')?.validade) || '',
        'Tipo Inscrição OAB': c.oabs?.find((o: any) => o.tipo === 'Principal')?.tipo || '',

        'PIS/PASEP': c.pis || c.pis_pasep,
        'Título de Eleitor': c.tituloseleitor,
        'Matrícula e-Social': c.matricula_esocial,
        'Dispensa Militar/Reservista': c.dispensa_militar || c.reservista,
        'CTPS': c.ctps || c.ctps_numero,
        'Série CTPS': c.ctps_serie,
        'UF CTPS': c.ctps_uf,
        
        'Resumo CV': c.resumo_cv || '',
        'Idiomas': c.idiomas || '',
        'Atividades Acadêmicas': c.atividades_academicas || '',
        'Competências Técnicas/Perfil': c.perfil || '',
        'Indicado Por': c.indicado_por || '',

        'Nível Escolaridade': c.escolaridade_nivel,
        'Subnível': c.escolaridade_subnivel,
        'Instituição': c.escolaridade_instituicao,
        'Curso': c.escolaridade_curso,
        'Matrícula Escolar': c.escolaridade_matricula,
        'Semestre': c.escolaridade_semestre,
        'Previsão Conclusão': parseDateForExcel(c.escolaridade_previsao_conclusao),
        'Formação Histórica': c.education_history?.map((e: any) => `${e.nivel} em ${e.curso} - ${e.instituicao} (${e.status})`).join(' | ') || '',

        'Forma de Pagamento': c.forma_pagamento,
        'Nome do Banco': c.banco_nome,
        'Tipo de Conta': c.banco_tipo_conta,
        'Agência': c.banco_agencia,
        'Conta': c.banco_conta,
        'Tipo PIX': c.pix_tipo,
        'Chave PIX': c.pix_chave,

        'Status': c.status === 'active' ? 'Ativo' : 'Inativo',
        'Rateio': getLookupName(rateios, c.rateio_id),
        'Data Admissão': parseDateForExcel(c.hire_date),
        'Motivo Contratação': getLookupName(hiringReasons, c.hiring_reason_id),
        'Tipo Contrato': formatContractType(c.contract_type),
        'Email Corporativo': c.email,
        'Email Pessoal': c.email_pessoal,
        'Telefone': c.telefone,
        'Área': c.area,
        'Sócio Responsável': (c as any).partner?.name || getLookupName(partners as any[], c.partner_id),
        'Líder Direto': (c as any).leader?.name || getLookupName(colaboradores as any[], c.leader_id),
        'Equipe': (c as any).teams?.name || getLookupName(teams, c.equipe) || formatValueFallback(c.equipe),
        'Cargo': (c as any).roles?.name || getLookupName(roles, c.role) || formatValueFallback(c.role),
        'Atuação': getLookupName(atuacoes, c.atuacao) || formatValueFallback(c.atuacao),
        'Local': (c as any).locations?.name || getLookupName(locations, c.local) || formatValueFallback(c.local),
        'Horário Entrada': c.work_schedule_start || '',
        'Horário Saída': c.work_schedule_end || '',
        'Posto / Mesa': c.posto || '',
        'Tipo Transporte': c.transportes?.map((t: any) => t.tipo).join(', ') || '',
        'Quantidade Ida': c.transportes?.reduce((sum: number, t: any) => sum + (t.ida_qtd || 0), 0) || 0,
        'Quantidade Volta': c.transportes?.reduce((sum: number, t: any) => sum + (t.volta_qtd || 0), 0) || 0,
        'Total Ida': c.transportes?.reduce((sum: number, t: any) => sum + (t.ida_valores?.reduce((a: number, b: number) => a + (b || 0), 0) || 0), 0) || 0,
        'Total Volta': c.transportes?.reduce((sum: number, t: any) => sum + (t.volta_valores?.reduce((a: number, b: number) => a + (b || 0), 0) || 0), 0) || 0,
        'Custo Total Transporte': c.transportes?.reduce((sum: number, t: any) => sum + (t.ida_valores?.reduce((a: number, b: number) => a + (b || 0), 0) || 0) + (t.volta_valores?.reduce((a: number, b: number) => a + (b || 0), 0) || 0), 0) || 0,

        'Data Desligamento': parseDateForExcel(c.termination_date),
        'Iniciativa Desligamento': getLookupName(terminationInitiatives, c.termination_initiative_id),
        'Tipo Desligamento': getLookupName(terminationTypes, c.termination_type_id),
        'Motivo Desligamento': getLookupName(terminationReasons, c.termination_reason_id),
        'Observações Histórico': c.history_observations
        };

        if (options.selectedColumns) {
            const allowedCols = new Set(['ID', 'Nome Completo', ...options.selectedColumns]);
            const filteredObj: any = {};
            Object.keys(fullObj).forEach(key => {
                if (allowedCols.has(key)) {
                    filteredObj[key] = (fullObj as any)[key];
                }
            });
            return filteredObj;
        }

        return fullObj;
    });

    const now = new Date();
    const formattedDate = now.toLocaleDateString('pt-BR').replace(/\//g, '-');
    const formattedTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }).replace(':', '-');
    const finalFileName = options.fileName
        ? `${options.fileName}.xlsx`
        : `Colaboradores_${formattedDate}_${formattedTime}.xlsx`;

    const ws = XLSX.utils.json_to_sheet(dataToExport, { cellDates: true, dateNF: 'dd/mm/yyyy' });

    // Apply Styles
    // Range gives us the dimensions Ex: "A1:Z100"
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

    // Iterate rows (skipping header 0)
    for (let R = 1; R <= range.e.r; ++R) {
        // Check status in the data source (sortedData[R-1])
        const isInactive = sortedData[R - 1]?.status !== 'active';

        if (isInactive) {
            // Find cell address for 'Nome Completo' dynamically
            const keys = Object.keys(dataToExport[0] || {});
            const nameColIndex = keys.indexOf('Nome Completo');
            
            if (nameColIndex === -1) continue;
            
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: nameColIndex }); 

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

    // Style Header Row (Royal Blue background, White text)
    for (let C = 0; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
        if (!ws[cellAddress]) continue;
        ws[cellAddress].s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "4169E1" } },
            alignment: { vertical: "center", horizontal: "center" }
        };
    }

    // Freeze Header Row
    if (!ws['!views']) ws['!views'] = [];
    ws['!views'].push({ state: 'frozen', xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft' });

    // Auto-width for columns dynamically based on content
    const keys = Object.keys(dataToExport[0] || {});
    const wscols = keys.map(key => {
        let maxLen = key.length;
        dataToExport.forEach(row => {
            const val = (row as any)[key];
            if (val !== undefined && val !== null) {
                const len = String(val).length;
                if (len > maxLen) maxLen = len;
            }
        });
        return { wch: Math.min(Math.max(maxLen + 2, 10), 60) };
    });
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Integrantes");
    XLSX.writeFile(wb, finalFileName);
};

export const exportVTXLSX = (options: ExportOptions) => {
    const {
        filtered,
        colaboradores,
    } = options;

    const sortedData = [...filtered].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    const dataToExport = sortedData.map(c => {
        const lider = (c as any).leader?.name || getLookupName(colaboradores as any[], c.leader_id) || '-';
        // Use custom mapped currentVtTotal if available (from Integrantes page UI logic), otherwise fallback to 0 calculation
        const transporte = (c as any).currentVtTotal !== undefined
            ? (c as any).currentVtTotal
            : 0;

        return {
            'Nome (do integrante)': c.name,
            'Líder Direto': lider,
            'Previsão de Formatura': parseDateForExcel(c.previsao_formatura) || '-',
            'Término Contrato': parseDateForExcel(c.termino_contrato_estagio) || '-',
            'Bolsa': c.bolsa_valor || '-',
            'Transporte': transporte,
            'VR': c.vr_valor || '-',
            'Endereço': c.address || '-',
            'Bairro': c.neighborhood || '-',
            'Cidade': c.city || '-',
            'Estado': c.state || '-'
        };
    });

    const now = new Date();
    const formattedDate = now.toLocaleDateString('pt-BR').replace(/\//g, '-');
    const finalFileName = options.fileName
        ? `${options.fileName}.xlsx`
        : `Custo_Vale_Transporte_${formattedDate}.xlsx`;

    const ws = XLSX.utils.json_to_sheet(dataToExport, { cellDates: true, dateNF: 'dd/mm/yyyy' });

    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

    // Style Header Row (Royal Blue background, White text)
    for (let C = 0; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
        if (!ws[cellAddress]) continue;
        ws[cellAddress].s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "4169E1" } },
            alignment: { vertical: "center", horizontal: "center" }
        };
    }

    // Freeze Header Row
    if (!ws['!views']) ws['!views'] = [];
    ws['!views'].push({ state: 'frozen', xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft' });

    // Auto-width for columns dynamically based on content
    const keys = Object.keys(dataToExport[0] || {});
    const wscols = keys.map(key => {
        let maxLen = key.length;
        dataToExport.forEach(row => {
            const val = (row as any)[key];
            if (val !== undefined && val !== null) {
                const len = String(val).length;
                if (len > maxLen) maxLen = len;
            }
        });
        return { wch: Math.min(Math.max(maxLen + 2, 10), 60) };
    });
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "RelatorioVT");
    XLSX.writeFile(wb, finalFileName);
};
