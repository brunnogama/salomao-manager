import React, { useState } from 'react'
import { Download, Upload, FileSpreadsheet, AlertTriangle, CheckCircle, Loader2, Trash2 } from 'lucide-react'
import XLSX from 'xlsx-js-style'
import { supabase } from '../../lib/supabase'

interface RHSectionProps {
    isAdmin: boolean
    onReset: () => void
    onResetSecondary: () => void
    onResetTertiary: () => void
}

interface ImportRow {
    'ID'?: string
    'Nome': string
    'Email': string
    'CPF': string
    'RG': string
    'Data Nascimento': string | number
    'Gênero': string
    'Estado Civil': string
    'Filhos (Sim/Não)': string
    'Quantidade de Filhos': string | number
    'CEP': string | number
    'Endereço': string
    'Número': string | number
    'Complemento': string
    'Bairro': string
    'Cidade': string
    'Estado': string
    'Nome Emergência': string
    'Telefone Emergência': string
    'Parentesco Emergência': string
    'Admissão': string | number
    'Status (Ativo/Inativo)': string
    'Cargo': string
    'Equipe': string
    'Área': string
    'Sócio': string
    'Líder': string
    'Local': string
    'Centro de Custo': string
    'Rateio': string
    'Motivo Contratação': string
    'Tipo Contratação': string
    'OAB Número': string
    'OAB UF': string
    'OAB Emissão': string | number
    'Observações': string
    'Data Desligamento': string | number
    'Iniciativa Desligamento': string
    'Tipo Desligamento': string
    'Motivo Desligamento': string
    [key: string]: string | number | undefined
}

export function RHSection({ isAdmin, onReset, onResetSecondary, onResetTertiary }: RHSectionProps) {
    const [importing, setImporting] = useState(false)
    const [importStats, setImportStats] = useState<{ total: number; success: number; errors: string[]; updated: number } | null>(null)

    const handleDownloadTemplate = () => {
        const headers = [
            'ID', 'Nome', 'Email', 'CPF', 'RG', 'Data Nascimento', 'Gênero', 'Estado Civil',
            'Filhos (Sim/Não)', 'Quantidade de Filhos',
            'CEP', 'Endereço', 'Número', 'Complemento', 'Bairro', 'Cidade', 'Estado',
            'Nome Emergência', 'Telefone Emergência', 'Parentesco Emergência',
            'Admissão', 'Status (Ativo/Inativo)',
            'Cargo', 'Área', 'Equipe', 'Sócio', 'Líder', 'Local', 'Centro de Custo',
            'Rateio', 'Motivo Contratação', 'Tipo Contratação',
            'OAB Número', 'OAB UF', 'OAB Emissão',
            'Observações',
            'Data Desligamento', 'Iniciativa Desligamento', 'Tipo Desligamento', 'Motivo Desligamento'
        ]

        const ws = XLSX.utils.aoa_to_sheet([headers])
        const wscols = headers.map(h => ({ wch: h.length + 5 }))
        ws['!cols'] = wscols
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Modelo Importação")
        XLSX.writeFile(wb, "modelo_importacao_colaboradores.xlsx")
    }

    const processImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setImporting(true)
        setImportStats(null)

        try {
            const data = await file.arrayBuffer()
            const workbook = XLSX.read(data)
            const worksheet = workbook.Sheets[workbook.SheetNames[0]]
            const jsonData = XLSX.utils.sheet_to_json<ImportRow>(worksheet)

            const [
                { data: roles },
                { data: teams },
                { data: partners },
                { data: locations },
                { data: centers },
                { data: rateios },
                { data: hiringReasons },
                { data: terminationInitiatives },
                { data: terminationTypes },
                { data: terminationReasons },
                { data: collaborators }
            ] = await Promise.all([
                supabase.from('roles').select('id, name'),
                supabase.from('teams').select('id, name'),
                supabase.from('partners').select('id, name'),
                supabase.from('locations').select('id, name'),
                supabase.from('cost_centers').select('id, name'),
                supabase.from('rateios').select('id, name'),
                supabase.from('hiring_reasons').select('id, name'),
                supabase.from('termination_initiatives').select('id, name'),
                supabase.from('termination_types').select('id, name'),
                supabase.from('termination_reasons').select('id, name'),
                supabase.from('collaborators').select('id, name, cpf')
            ])

            const findId = (list: any[] | null, name: string) => {
                if (!list || !name) return null
                const normalized = String(name).toLowerCase().trim()
                return list.find(item => item.name?.toLowerCase().trim() === normalized)?.id || null
            }

            let successCount = 0
            let updatedCount = 0
            let errors: string[] = []

            for (let i = 0; i < jsonData.length; i++) {
                const row = jsonData[i]
                const rowNum = i + 2

                try {
                    const rowNome = row['Nome'] || row['Nome Completo']
                    const rowCpf = row['CPF'] ? String(row['CPF']).replace(/\D/g, '') : null

                    if (!rowNome) throw new Error(`Linha ${rowNum}: Nome é obrigatório.`)

                    const dbRow: any = {
                        name: rowNome,
                        email: row['Email'] || row['Email Corporativo'],
                        cpf: rowCpf,
                        rg: row['RG'],
                        birthday: parseDate(row['Data Nascimento']),
                        gender: row['Gênero'],
                        civil_status: row['Estado Civil'],
                        has_children: String(row['Filhos (Sim/Não)'] || row['Possui Filhos?'] || '').toLowerCase() === 'sim',
                        children_count: Number(row['Quantidade de Filhos']) || 0,
                        zip_code: String(row['CEP'] || '').replace(/\D/g, ''),
                        address: row['Endereço'],
                        address_number: String(row['Número']),
                        address_complement: row['Complemento'],
                        neighborhood: row['Bairro'],
                        city: row['Cidade'],
                        state: row['Estado'],
                        emergencia_nome: row['Nome Emergência'],
                        emergencia_telefone: String(row['Telefone Emergência'] || ''),
                        emergencia_parentesco: row['Parentesco Emergência'],
                        hire_date: parseDate(row['Admissão'] || row['Data Admissão']),
                        status: (() => {
                            const rawStatus = row['Status (Ativo/Inativo)'] || row['Status'];
                            if (rawStatus === undefined || rawStatus === null || String(rawStatus).trim() === '') return undefined;
                            return String(rawStatus).trim().toLowerCase() === 'inativo' ? 'inactive' : 'active';
                        })(),
                        contract_type: row['Tipo Contratação'] || row['Tipo Contrato'],
                        role: findId(roles, row['Cargo']),
                        area: (row['Área'] === 'Administrativa' || row['Área'] === 'Jurídica') ? row['Área'] : undefined,
                        equipe: findId(teams, row['Equipe'] || row['Equipe/Área']),
                        partner_id: findId(partners, row['Sócio'] || row['Sócio Responsável']),
                        leader_id: findId(collaborators, row['Líder'] || row['Líder Direto']),
                        local: findId(locations, row['Local']),
                        centro_custo: findId(centers, row['Centro de Custo']),
                        rateio_id: findId(rateios, row['Rateio']),
                        hiring_reason_id: findId(hiringReasons, row['Motivo Contratação']),
                        termination_date: parseDate(row['Data Desligamento']),
                        termination_initiative_id: findId(terminationInitiatives, String(row['Iniciativa Desligamento'] || '')),
                        termination_type_id: findId(terminationTypes, String(row['Tipo Desligamento'] || '')),
                        termination_reason_id: findId(terminationReasons, String(row['Motivo Desligamento'] || '')),
                        oab_numero: String(row['OAB Número'] || ''),
                        oab_uf: row['OAB UF']?.trim().toUpperCase().substring(0, 2),
                        oab_emissao: parseDate(row['OAB Emissão']),
                        oab_tipo: row['Tipo Inscrição OAB'],
                        pis: row['PIS/PASEP'],
                        matricula_esocial: row['Matrícula e-Social'],
                        dispensa_militar: row['Dispensa Militar'],
                        ctps: row['CTPS'],
                        ctps_serie: row['Série CTPS'],
                        ctps_uf: row['UF CTPS'],
                        escolaridade_nivel: row['Nível Escolaridade'],
                        escolaridade_subnivel: row['Subnível'],
                        escolaridade_instituicao: row['Instituição'],
                        escolaridade_curso: row['Curso'],
                        escolaridade_matricula: row['Matrícula Escolar'],
                        escolaridade_semestre: row['Semestre'],
                        escolaridade_previsao_conclusao: parseDate(row['Previsão Conclusão']),
                        history_observations: row['Observações Histórico'],
                        observacoes: row['Observações']
                    }

                    Object.keys(dbRow).forEach(key => {
                        if (dbRow[key] === undefined || dbRow[key] === null || dbRow[key] === '') delete dbRow[key]
                    })

                    const rowId = row['ID']
                    let existingCollaborator = null

                    if (rowId) {
                        const { data: foundById } = await supabase.from('collaborators').select('id').eq('id', rowId).single()
                        if (foundById) existingCollaborator = foundById
                    }

                    if (!existingCollaborator && rowCpf) {
                        existingCollaborator = collaborators?.find(c => c.cpf?.replace(/\D/g, '') === rowCpf)
                    }

                    if (existingCollaborator) {
                        const { error } = await supabase.from('collaborators').update(dbRow).eq('id', existingCollaborator.id)
                        if (error) throw error
                        updatedCount++
                    } else {
                        const { error } = await supabase.from('collaborators').insert(dbRow)
                        if (error) throw error
                        successCount++
                    }

                } catch (err: any) {
                    errors.push(err.message || `Erro desconhecido na linha ${rowNum}`)
                }
            }

            setImportStats({ total: jsonData.length, success: successCount, updated: updatedCount, errors })

        } catch (error: any) {
            setImportStats({ total: 0, success: 0, updated: 0, errors: ['Erro crítico ao ler arquivo: ' + error.message] })
        } finally {
            setImporting(false)
            if (e.target) e.target.value = ''
        }
    }

    const parseDate = (val: string | number | undefined) => {
        if (!val) return null
        if (typeof val === 'number') {
            const date = new Date(Math.round((val - 25569) * 86400 * 1000))
            return date.toISOString().split('T')[0]
        }
        if (typeof val === 'string' && val.includes('/')) {
            const parts = val.split('/')
            if (parts.length === 3) {
                const [d, m, y] = parts
                return `${y}-${m}-${d}`
            }
        }
        if (typeof val === 'string' && val.includes('-')) return val
        return null
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">

            {/* --- IMPORT / EXPORT SECTION --- */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-50 rounded-lg">
                        <FileSpreadsheet className="h-5 w-5 text-[#1e3a8a]" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-base">Importação e Exportação</h3>
                        <p className="text-xs text-gray-500">Gerencie a base de colaboradores via planilha</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Export Template */}
                    <div className="border border-blue-100 bg-blue-50/30 rounded-xl p-5">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-blue-100 text-[#1e3a8a] rounded-lg">
                                <Download className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-[#1e3a8a] text-sm mb-1">Baixar Modelo</h4>
                                <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                                    Baixe a planilha padrão. Não altere o cabeçalho das colunas.
                                </p>
                                <button
                                    onClick={handleDownloadTemplate}
                                    className="px-4 py-2 bg-[#1e3a8a] hover:bg-[#112240] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-sm flex items-center gap-2"
                                >
                                    <FileSpreadsheet className="h-3.5 w-3.5" /> Download Modelo
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Import Data */}
                    <div className="border border-gray-200 bg-gray-50/30 rounded-xl p-5 relative overflow-hidden">
                        {importing && (
                            <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center flex-col gap-3 backdrop-blur-sm">
                                <Loader2 className="h-8 w-8 text-[#1e3a8a] animate-spin" />
                                <p className="text-sm font-bold text-[#1e3a8a]">Processando...</p>
                            </div>
                        )}
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                                <Upload className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-emerald-900 text-sm mb-1">Importar Dados</h4>
                                <p className="text-xs text-gray-600 mb-4">
                                    Selecione o arquivo (.xlsx) preenchido para processar.
                                </p>
                                <label className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-sm cursor-pointer">
                                    <Upload className="h-3.5 w-3.5" /> Selecionar Arquivo
                                    <input type="file" hidden accept=".xlsx, .xls" onChange={processImport} />
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Import Stats */}
                {importStats && (
                    <div className={`mt-6 rounded-xl p-4 border ${importStats.errors.length > 0 ? 'bg-orange-50 border-orange-100' : 'bg-green-50 border-green-100'} animate-in zoom-in-95`}>
                        <div className="flex items-center gap-2 mb-3">
                            {importStats.errors.length > 0 ? (
                                <AlertTriangle className="h-5 w-5 text-orange-500" />
                            ) : (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                            )}
                            <h4 className={`font-bold text-sm ${importStats.errors.length > 0 ? 'text-orange-700' : 'text-green-700'}`}>
                                Resultado da Importação
                            </h4>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="bg-white/60 p-2 rounded-lg text-center">
                                <span className="block text-[10px] text-gray-500 uppercase font-black">Total</span>
                                <span className="text-lg font-bold text-gray-800">{importStats.total}</span>
                            </div>
                            <div className="bg-white/60 p-2 rounded-lg text-center">
                                <span className="block text-[10px] text-gray-500 uppercase font-black">Novos</span>
                                <span className="text-lg font-bold text-green-600">{importStats.success}</span>
                            </div>
                            <div className="bg-white/60 p-2 rounded-lg text-center">
                                <span className="block text[10px] text-gray-500 uppercase font-black">Atualizados</span>
                                <span className="text-lg font-bold text-blue-600">{importStats.updated}</span>
                            </div>
                            <div className="bg-white/60 p-2 rounded-lg text-center">
                                <span className="block text-[10px] text-gray-500 uppercase font-black">Erros</span>
                                <span className="text-lg font-bold text-red-600">{importStats.errors.length}</span>
                            </div>
                        </div>

                        {importStats.errors.length > 0 && (
                            <div className="bg-white p-3 rounded-lg border border-orange-100 max-h-40 overflow-y-auto custom-scrollbar">
                                <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Log de Erros:</p>
                                <ul className="space-y-1">
                                    {importStats.errors.map((err, idx) => (
                                        <li key={idx} className="text-xs text-red-600 flex items-start gap-1">
                                            <span className="text-red-300">•</span> {err}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* --- DANGER ZONE (RESET) --- */}
            {isAdmin && (
                <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-red-50 rounded-lg">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-red-900 text-base">Zona de Perigo</h3>
                            <p className="text-xs text-red-600">Ações destrutivas e irreversíveis</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border border-red-100 rounded-lg bg-red-50/30">
                            <div>
                                <h4 className="font-bold text-gray-900 text-sm">Resetar Presenças</h4>
                                <p className="text-xs text-gray-500">Remove todo o histórico de presenças da portaria</p>
                            </div>
                            <button
                                onClick={onReset}
                                className="px-3 py-2 bg-white border border-red-200 text-red-600 text-xs font-bold rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
                            >
                                <Trash2 className="h-3.5 w-3.5" /> Resetar
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 border border-red-100 rounded-lg bg-red-50/30">
                            <div>
                                <h4 className="font-bold text-gray-900 text-sm">Resetar Colaboradores</h4>
                                <p className="text-xs text-gray-500">Remove todos os dados cadastrais de colaboradores</p>
                            </div>
                            <button
                                onClick={onResetSecondary}
                                className="px-3 py-2 bg-white border border-red-200 text-red-600 text-xs font-bold rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
                            >
                                <Trash2 className="h-3.5 w-3.5" /> Resetar
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 border border-red-100 rounded-lg bg-red-50/30">
                            <div>
                                <h4 className="font-bold text-gray-900 text-sm">Resetar Controle de Ponto</h4>
                                <p className="text-xs text-gray-500">Remove todos os registros de marcações de ponto</p>
                            </div>
                            <button
                                onClick={onResetTertiary}
                                className="px-3 py-2 bg-white border border-red-200 text-red-600 text-xs font-bold rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
                            >
                                <Trash2 className="h-3.5 w-3.5" /> Resetar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
