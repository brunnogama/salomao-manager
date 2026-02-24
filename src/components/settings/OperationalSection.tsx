import React, { useState } from 'react'
import { Download, Upload, FileSpreadsheet, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'
import XLSX from 'xlsx-js-style'
import { supabase } from '../../lib/supabase'

interface OperationalSectionProps {
    isAdmin: boolean
}

interface ImportRow {
    'Data da Venda'?: string | number
    'Produto': string
    'Loja'?: string
    'Quantidade'?: number | string
    'Quantidade Devolvida'?: number | string
    'Data da Devolução'?: string | number
    'Quantidade Vendida'?: number | string
    'Estoque Acumulado'?: number | string
    'Preço Unitário'?: number | string
    'Valor de Venda Total'?: number | string
    [key: string]: string | number | undefined
}

export function OperationalSection({ isAdmin }: OperationalSectionProps) {
    const [importing, setImporting] = useState(false)
    const [importStats, setImportStats] = useState<{ total: number; success: number; errors: string[] } | null>(null)

    const handleDownloadTemplate = () => {
        const headers = [
            'Data da Venda', 'Produto', 'Loja', 'Quantidade',
            'Quantidade Devolvida', 'Data da Devolução', 'Quantidade Vendida',
            'Estoque Acumulado', 'Preço Unitário', 'Valor de Venda Total'
        ]

        const ws = XLSX.utils.aoa_to_sheet([headers])
        const wscols = headers.map(h => ({ wch: h.length + 5 }))
        ws['!cols'] = wscols
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Modelo Importação Estoque")
        XLSX.writeFile(wb, "modelo_importacao_estoque.xlsx")
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

            let successCount = 0
            let errors: string[] = []

            for (let i = 0; i < jsonData.length; i++) {
                const row = jsonData[i]
                const rowNum = i + 2

                try {
                    if (!row['Produto']) throw new Error(`Linha ${rowNum}: Produto é obrigatório.`)

                    const dbRow = {
                        sale_date: parseDate(row['Data da Venda']),
                        product: String(row['Produto']),
                        store: row['Loja'],
                        quantity: Number(row['Quantidade']) || 0,
                        returned_quantity: Number(row['Quantidade Devolvida']) || 0,
                        return_date: parseDate(row['Data da Devolução']),
                        sold_quantity: Number(row['Quantidade Vendida']) || 0,
                        accumulated_stock: Number(row['Estoque Acumulado']) || 0,
                        unit_price: Number(row['Preço Unitário']) || 0,
                        total_sale_value: Number(row['Valor de Venda Total']) || 0
                    }

                    const { error } = await supabase.from('operational_stock_ledger').insert(dbRow)
                    if (error) throw error
                    successCount++

                } catch (err: any) {
                    errors.push(err.message || `Erro desconhecido na linha ${rowNum}`)
                }
            }

            setImportStats({ total: jsonData.length, success: successCount, errors })

        } catch (error: any) {
            setImportStats({ total: 0, success: 0, errors: ['Erro crítico ao ler arquivo: ' + error.message] })
        } finally {
            setImporting(false)
            if (e.target) e.target.value = ''
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-50 rounded-lg">
                        <FileSpreadsheet className="h-5 w-5 text-[#1e3a8a]" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-base">Importação de Estoque</h3>
                        <p className="text-xs text-gray-500">Gerencie a base de estoque via planilha (Ledger)</p>
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
                                    Baixe a planilha padrão para preecimento do estoque.
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
                                <h4 className="font-bold text-emerald-900 text-sm mb-1">Importar Planilha</h4>
                                <p className="text-xs text-gray-600 mb-4">
                                    Selecione o arquivo (.xlsx) preenchido para alimentar o estoque.
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

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                            <div className="bg-white/60 p-2 rounded-lg text-center">
                                <span className="block text-[10px] text-gray-500 uppercase font-black">Total processado</span>
                                <span className="text-lg font-bold text-gray-800">{importStats.total}</span>
                            </div>
                            <div className="bg-white/60 p-2 rounded-lg text-center">
                                <span className="block text-[10px] text-gray-500 uppercase font-black">Sucesso</span>
                                <span className="text-lg font-bold text-green-600">{importStats.success}</span>
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
        </div>
    )
}
