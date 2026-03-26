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
    activeFilterColNames?: string[];
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

const formatDateBR = (isoDate: string | undefined | null): string => {
    if (!isoDate) return '';
    if (isoDate.includes('/')) return isoDate;
    const cleanDate = isoDate.split('T')[0];
    const parts = cleanDate.split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoDate;
};

const formatPerfil = (perfil: any): string => {
    if (!perfil) return '';
    if (Array.isArray(perfil)) {
        return perfil.map(p => typeof p === 'object' ? (p.name || p.tag || JSON.stringify(p)) : p).join('; ');
    }
    if (typeof perfil === 'string') {
        try {
            const parsed = JSON.parse(perfil);
            if (Array.isArray(parsed)) return parsed.join('; ');
        } catch {}
        // Split by standard delimiters and rejoin with semicolon to guarantee separation
        return perfil.split(/[\n,]+/).map(t => t.trim()).filter(Boolean).join('; ');
    }
    return String(perfil);
};

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
        const matriculaStr = c.matricula_interna ? String(c.matricula_interna) : String(c.id);
        const formatID = matriculaStr.startsWith('COL -') ? matriculaStr : `COL - ${matriculaStr}`;

        const fullObj = {
        'ID': formatID,
        'Nome Completo': c.name,
        'CPF': c.cpf,
        'RG': c.rg,
        'Data Nascimento': parseDateForExcel(c.birthday),
        'Gênero': formatGender(c.gender),
        'Estado Civil': formatCivilStatus(c.civil_status),
        'Possui Filhos?': c.has_children ? 'Sim' : 'Não',
        'Quantidade de Filhos': c.children_count || 0,
        'Nomes dos Filhos': c.children_data?.map((f: any) => f.name).join(' \r\n ') || '',
        'Datas Nasc. Filhos': c.children_data?.map((f: any) => formatDateBR(f.birth_date)).join(' \r\n ') || '',
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
        'Competências Técnicas/Perfil': formatPerfil(c.perfil),
        'Indicado Por': c.indicado_por || '',

        'Nível Escolaridade': c.education_history?.length ? c.education_history.map((e: any) => e.nivel).filter(Boolean).join(' \r\n ') : c.escolaridade_nivel,
        'Subnível': c.education_history?.length ? c.education_history.map((e: any) => e.subnivel).filter(Boolean).join(' \r\n ') : c.escolaridade_subnivel,
        'Instituição': c.education_history?.length ? c.education_history.map((e: any) => e.instituicao).filter(Boolean).join(' \r\n ') : c.escolaridade_instituicao,
        'Curso': c.education_history?.length ? c.education_history.map((e: any) => e.curso).filter(Boolean).join(' \r\n ') : c.escolaridade_curso,
        'Matrícula Escolar': c.education_history?.length ? c.education_history.map((e: any) => e.matricula).filter(Boolean).join(' \r\n ') : c.escolaridade_matricula,
        'Semestre': c.education_history?.length ? c.education_history.map((e: any) => e.semestre).filter(Boolean).join(' \r\n ') : c.escolaridade_semestre,
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
            const baseCols = ['ID', 'Nome Completo'];
            const activeCols = options.activeFilterColNames || [];
            
            // Remove activeCols and baseCols from selectedColumns to avoid duplication
            const remainingSelected = options.selectedColumns.filter(c => !activeCols.includes(c) && !baseCols.includes(c));
            
            // The final order is: Active Filters -> Identifiers -> Remaining Selected Columns
            const finalOrder = [...activeCols, ...baseCols, ...remainingSelected];
            
            const filteredObj: any = {};
            finalOrder.forEach(key => {
                if ((fullObj as any)[key] !== undefined) {
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
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

    // Identify which column indices are active filters to highlight
    const activeFilterColIndices = new Set<number>();
    if (options.activeFilterColNames && options.activeFilterColNames.length > 0) {
        for (let C = 0; C <= range.e.c; ++C) {
            const cellRef = XLSX.utils.encode_cell({ r: 0, c: C });
            const cell = ws[cellRef];
            if (cell && cell.v && options.activeFilterColNames.includes(cell.v.toString())) {
                activeFilterColIndices.add(C);
            }
        }
    }

    const keysMap = Object.keys(dataToExport[0] || {});
    const nameColIndex = keysMap.indexOf('Nome Completo');

    for (let R = 0; R <= range.e.r; ++R) {
        for (let C = 0; C <= range.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
            if (!ws[cellAddress]) continue;

            const isFilterCol = activeFilterColIndices.has(C);

            if (R === 0) {
                ws[cellAddress].s = {
                    font: { bold: true, color: { rgb: isFilterCol ? "000000" : "FFFFFF" } },
                    fill: { fgColor: { rgb: isFilterCol ? "FDE047" : "1E3A8A" } }, // Yellow header for filter cols
                    alignment: { vertical: "center", horizontal: "center" }
                };
            } else {
                const isInactive = sortedData[R - 1]?.status !== 'active';
                const isNameCol = C === nameColIndex;
                const cellStyle: any = {};
                
                if (isInactive && isNameCol) {
                    cellStyle.font = { color: { rgb: "FF0000" }, bold: true };
                }
                
                if (isFilterCol) {
                    cellStyle.fill = { fgColor: { rgb: "FEF3C7" } }; // Light yellow data cell background
                }
                
                if (Object.keys(cellStyle).length > 0) {
                    ws[cellAddress].s = cellStyle;
                }
            }
        }
    }

    // Freeze Header Row
    ws['!views'] = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];

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

    // Style Header Row (Dark Blue background, White text)
    for (let C = 0; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
        if (!ws[cellAddress]) continue;
        ws[cellAddress].s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "1E3A8A" } },
            alignment: { vertical: "center", horizontal: "center" }
        };
    }

    // Freeze Header Row
    ws['!views'] = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];

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
