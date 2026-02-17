import React, { useState } from 'react'
import { Download, Upload, FileSpreadsheet, AlertTriangle, CheckCircle, Loader2, X } from 'lucide-react'
import * as XLSX from 'xlsx'
import { supabase } from '../../../lib/supabase'

interface CollaboratorSettingsModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
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
    [key: string]: string | number | undefined
}

export function CollaboratorSettingsModal({ isOpen, onClose, onSuccess }: CollaboratorSettingsModalProps) {
    const [importing, setImporting] = useState(false)
    const [importStats, setImportStats] = useState<{ total: number; success: number; errors: string[]; updated: number } | null>(null)

    if (!isOpen) return null

    const handleDownloadTemplate = () => {
        // Define headers matching the database schema or mapped names
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

        // Auto-adjust column widths (approximate)
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

            // Pre-fetch auxiliary data for mapping names to IDs
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
                { data: collaborators } // For leaders and checking existing CPFs
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

            // Helper to find ID by Name (fuzzy match or exact)
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
                const rowNum = i + 2 // 1-based + header

                try {
                    const rowNome = row['Nome']
                    const rowCpf = row['CPF'] ? String(row['CPF']).replace(/\D/g, '') : null

                    if (!rowNome) {
                        throw new Error(`Linha ${rowNum}: Nome é obrigatório.`)
                    }

                    // Map CSV/Excel fields to DB fields
                    const dbRow: any = {
                        name: rowNome,
                        email: row['Email'],
                        cpf: rowCpf,
                        rg: row['RG'],
                        birthday: parseDate(row['Data Nascimento']),
                        gender: row['Gênero'],
                        civil_status: row['Estado Civil'],
                        has_children: String(row['Filhos (Sim/Não)'] || '').toLowerCase() === 'sim',
                        children_count: Number(row['Quantidade de Filhos']) || 0,

                        // Address
                        zip_code: String(row['CEP'] || '').replace(/\D/g, ''),
                        address: row['Endereço'],
                        address_number: String(row['Número']),
                        address_complement: row['Complemento'],
                        neighborhood: row['Bairro'],
                        city: row['Cidade'],
                        state: row['Estado'],

                        // Emergency
                        emergencia_nome: row['Nome Emergência'],
                        emergencia_telefone: String(row['Telefone Emergência'] || ''),
                        emergencia_parentesco: row['Parentesco Emergência'],

                        // Corporate
                        hire_date: parseDate(row['Admissão']),
                        status: (row['Status (Ativo/Inativo)'] || 'Ativo').toLowerCase() === 'ativo' ? 'active' : 'inactive',
                        contract_type: row['Tipo Contratação'],

                        // Foreign Keys mapping
                        role: findId(roles, row['Cargo']),
                        area: (row['Área'] === 'Administrativa' || row['Área'] === 'Jurídica') ? row['Área'] : undefined,
                        equipe: findId(teams, row['Equipe']),
                        partner_id: findId(partners, row['Sócio']),
                        leader_id: findId(collaborators, row['Líder']),
                        local: findId(locations, row['Local']),
                        centro_custo: findId(centers, row['Centro de Custo']),
                        rateio_id: findId(rateios, row['Rateio']),
                        hiring_reason_id: findId(hiringReasons, row['Motivo Contratação']),

                        // Termination
                        termination_date: parseDate(row['Data Desligamento']),
                        termination_initiative_id: findId(terminationInitiatives, String(row['Iniciativa Desligamento'] || '')),
                        termination_type_id: findId(terminationTypes, String(row['Tipo Desligamento'] || '')),
                        // termination_reason_id: findId(terminationReasons, String(row['Motivo Desligamento'] || '')),

                        // Professional
                        oab_numero: String(row['Número da OAB'] || ''),
                        oab_uf: row['OAB UF']?.trim().toUpperCase().substring(0, 2),
                        oab_emissao: parseDate(row['OAB Emissão']),

                        // termination_reason_id: findId(terminationReasons, String(row['Motivo Desligamento'] || '')),



                        observacoes: row['Observações']
                    }

                    // Clean undefined/null keys/values
                    Object.keys(dbRow).forEach(key => {
                        if (dbRow[key] === undefined || dbRow[key] === null || dbRow[key] === '') {
                            delete dbRow[key]
                        }
                    })

                    // Check if ID is provided for Update
                    const rowId = row['ID']
                    let existingCollaborator = null

                    if (rowId) {
                        // Try to find by ID first
                        const { data: foundById } = await supabase.from('collaborators').select('id').eq('id', rowId).single()
                        if (foundById) {
                            existingCollaborator = foundById
                        }
                    }

                    // Fallback to CPF check if no ID or ID not found (and CPF is provided)
                    if (!existingCollaborator && rowCpf) {
                        existingCollaborator = collaborators?.find(c => c.cpf?.replace(/\D/g, '') === rowCpf)
                    }

                    if (existingCollaborator) {
                        // Update
                        const { error } = await supabase
                            .from('collaborators')
                            .update(dbRow)
                            .eq('id', existingCollaborator.id)

                        if (error) throw error
                        updatedCount++
                    } else {
                        // Insert
                        const { error } = await supabase
                            .from('collaborators')
                            .insert(dbRow)

                        if (error) throw error
                        successCount++
                    }

                } catch (err: any) {
                    errors.push(err.message || `Erro desconhecido na linha ${rowNum}`)
                }
            }

            setImportStats({ total: jsonData.length, success: successCount, updated: updatedCount, errors })
            if (successCount > 0 || updatedCount > 0) onSuccess()

        } catch (error: any) {
            setImportStats({ total: 0, success: 0, updated: 0, errors: ['Erro crítico ao ler arquivo: ' + error.message] })
        } finally {
            setImporting(false)
            if (e.target) e.target.value = '' // Reset input
        }
    }

    // Simple date parser (supports Excel serial date or string DD/MM/YYYY)
    const parseDate = (val: string | number | undefined) => {
        if (!val) return null

        // Excel Serial Date (Number)
        if (typeof val === 'number') {
            const date = new Date(Math.round((val - 25569) * 86400 * 1000))
            return date.toISOString().split('T')[0] // YYYY-MM-DD
        }

        // String DD/MM/YYYY
        if (typeof val === 'string' && val.includes('/')) {
            const parts = val.split('/')
            if (parts.length === 3) {
                const [d, m, y] = parts
                return `${y}-${m}-${d}`
            }
        }

        // Already YYYY-MM-DD
        if (typeof val === 'string' && val.includes('-')) {
            return val
        }

        return null
    }

    return (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-black text-[#0a192f]">Importação em Lote</h2>
                        <p className="text-xs text-gray-500 mt-1">Gerencie a importação e exportação de dados</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-all text-gray-400 hover:text-red-500">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    {/* Export Section */}
                    <div className="flex items-start gap-4 p-4 border border-blue-100 bg-blue-50/30 rounded-xl">
                        <div className="p-3 bg-blue-100 text-[#1e3a8a] rounded-lg">
                            <Download className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-[#1e3a8a] text-sm mb-1">Passo 1: Baixar Modelo</h3>
                            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                                Baixe a planilha padrão para preenchimento. Não altere o cabeçalho das colunas para garantir o funcionamento da importação.
                                <br />
                                <span className="text-gray-400 italic">Campos de seleção (Cargo, Equipe, etc) devem ter o nome exato.</span>
                            </p>
                            <button
                                onClick={handleDownloadTemplate}
                                className="px-4 py-2 bg-[#1e3a8a] hover:bg-[#112240] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                            >
                                <FileSpreadsheet className="h-4 w-4" /> Baixar Planilha Modelo
                            </button>
                        </div>
                    </div>

                    {/* Import Section */}
                    <div className="flex items-start gap-4 p-4 border border-gray-200 bg-gray-50/30 rounded-xl relative overflow-hidden">
                        {importing && (
                            <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center flex-col gap-3 backdrop-blur-sm">
                                <Loader2 className="h-8 w-8 text-[#1e3a8a] animate-spin" />
                                <p className="text-sm font-bold text-[#1e3a8a]">Processando arquivo...</p>
                            </div>
                        )}

                        <div className="p-3 bg-gray-100 text-gray-600 rounded-lg">
                            <Upload className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900 text-sm mb-1">Passo 2: Importar Dados</h3>
                            <p className="text-xs text-gray-600 mb-4">
                                Selecione o arquivo preenchido (.xlsx) para processar.
                            </p>
                            <label className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-sm hover:shadow-md cursor-pointer">
                                <FileSpreadsheet className="h-4 w-4" /> Selecionar Arquivo
                                <input type="file" hidden accept=".xlsx, .xls" onChange={processImport} />
                            </label>
                        </div>
                    </div>

                    {/* Stats / Results */}
                    {importStats && (
                        <div className={`rounded-xl p-4 border ${importStats.errors.length > 0 ? 'bg-orange-50 border-orange-100' : 'bg-green-50 border-green-100'}`}>
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

                            <div className="grid grid-cols-4 gap-4 mb-4">
                                <div className="bg-white/60 p-2 rounded-lg text-center">
                                    <span className="block text-xs text-gray-500 uppercase font-black">Total processado</span>
                                    <span className="text-lg font-bold text-gray-800">{importStats.total}</span>
                                </div>
                                <div className="bg-white/60 p-2 rounded-lg text-center">
                                    <span className="block text-xs text-gray-500 uppercase font-black">Novos</span>
                                    <span className="text-lg font-bold text-green-600">{importStats.success}</span>
                                </div>
                                <div className="bg-white/60 p-2 rounded-lg text-center">
                                    <span className="block text-xs text-gray-500 uppercase font-black">Atualizados</span>
                                    <span className="text-lg font-bold text-blue-600">{importStats.updated}</span>
                                </div>
                                <div className="bg-white/60 p-2 rounded-lg text-center">
                                    <span className="block text-xs text-gray-500 uppercase font-black">Erros</span>
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
            </div>
        </div>
    )
}
