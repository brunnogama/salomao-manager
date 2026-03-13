import { useState, useEffect, useMemo } from 'react'
import { Plus, Search, FileSpreadsheet, Loader2, Trash2, AlertCircle } from 'lucide-react'
import * as XLSX from 'xlsx' 
import { supabase } from '../../../lib/supabase'
import { DemandasTable } from './DemandasTable'
import { DemandasFormModal } from './DemandasFormModal'

export function DemandasFamilia() {
  const [demandas, setDemandas] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [itemToDelete, setItemToDelete] = useState<any | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchDados = async () => {
    const { data, error } = await supabase
      .from('familia_salomao_demandas')
      .select('*')
      .order('data_solicitacao', { ascending: false })

    if (!error && data) {
      setDemandas(data)
    }
  }

  useEffect(() => {
    fetchDados()
  }, [])

  const filteredData = useMemo(() => {
    return demandas.filter(item => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        item.demanda?.toLowerCase().includes(term) ||
        item.solicitante?.toLowerCase().includes(term) ||
        item.equipamento?.toLowerCase().includes(term) ||
        item.fornecedor?.toLowerCase().includes(term)
      )
    })
  }, [demandas, searchTerm])

  const handleSaveData = async (formData: any) => {
    try {
      if (formData.id) {
        const { error } = await supabase
          .from('familia_salomao_demandas')
          .update(formData)
          .eq('id', formData.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('familia_salomao_demandas')
          .insert([formData])
        if (error) throw error
      }
      await fetchDados()
      setIsModalOpen(false)
      setSelectedItem(null)
    } catch (error) {
      console.error('Erro ao salvar demanda:', error)
      alert('Erro ao salvar a demanda.')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('familia_salomao_demandas')
        .delete()
        .eq('id', id)
      if (error) throw error
      await fetchDados()
      setItemToDelete(null)
    } catch (error) {
      console.error('Erro ao excluir:', error)
      alert('Erro ao excluir a demanda.')
    }
  }

  const handleEditItem = (item: any) => {
    setSelectedItem(item)
    setIsModalOpen(true)
  }

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsImporting(true)
    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: false })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const data = XLSX.utils.sheet_to_json(ws)

        const formatExcelDateToISO = (excelDate: any) => {
          if (!excelDate) return null;
          if (typeof excelDate === 'number') {
            const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
            return date.toISOString().split('T')[0];
          }
          if (typeof excelDate === 'string' && excelDate.includes('/')) {
            const [d, m, a] = excelDate.split('/');
            return `${a}-${m}-${d}`;
          }
          if (typeof excelDate === 'string' && excelDate.includes('-')) {
            return excelDate.split('T')[0];
          }
          return excelDate;
        };

        const mapped = data.map((row: any) => ({
          data_solicitacao: formatExcelDateToISO(row['Data da Solicitação'] || row['Data']),
          solicitante: row['Solicitante']?.toString() || '',
          unidade: row['Unidade']?.toString() || '',
          fornecedor: row['Fornecedor']?.toString() || '',
          equipamento: row['Equipamento']?.toString() || '',
          tipo: row['Tipo']?.toString() || '',
          categoria: row['Categoria']?.toString() || '',
          demanda: row['Demanda']?.toString() || '',
          prioridade: row['Prioridade']?.toString() || 'Média',
          responsavel: row['Responsável']?.toString() || '',
          quem_acompanha: row['Quem acompanha']?.toString() || '',
          status: row['Status']?.toString() || 'Pendente',
          proxima_acao: row['Próxima ação']?.toString() || '',
          prazo: formatExcelDateToISO(row['Prazo']),
          observacoes: row['Observações']?.toString() || ''
        }))

        // O import do supabase muitas vezes tem limite de 1000 linhas se nao bater.
        // Faremos insert em batch se necessário, mas para famílias normalmente é pequeno
        const { error } = await supabase.from('familia_salomao_demandas').insert(mapped)
        if (error) throw error
        await fetchDados()
      } catch (error: any) {
        console.error('Erro na importação:', error)
        alert('Erro ao importar planilha. Verifique as colunas e tente novamente.')
      } finally {
        setIsImporting(false)
        e.target.value = ''
      }
    }
    reader.readAsBinaryString(file)
  }

  // KPIs
  const totalPendentes = demandas.filter(d => d.status === 'Pendente').length
  const totalEmAndamento = demandas.filter(d => d.status === 'Em andamento').length
  const totalAltaPrioridade = demandas.filter(d => d.prioridade === 'Alta' && d.status !== 'Concluído').length

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in zoom-in duration-300">
      
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pendentes</p>
            <p className="text-2xl font-black mt-1 text-amber-600">{totalPendentes}</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <Loader2 className="h-5 w-5" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Em Andamento</p>
            <p className="text-2xl font-black mt-1 text-blue-600">{totalEmAndamento}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <Loader2 className="h-5 w-5" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Alta Prioridade</p>
            <p className="text-2xl font-black mt-1 text-red-600">{totalAltaPrioridade}</p>
          </div>
          <div className="p-3 bg-red-50 rounded-xl text-red-600">
            <AlertCircle className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-3 shrink-0">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar demandas..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-100/50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <label className={`flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-sm hover:bg-gray-50 cursor-pointer transition-all active:scale-95 ${isImporting ? 'opacity-50 pointer-events-none' : ''}`}>
            {isImporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5 text-green-600" />}
            {isImporting ? 'Importando...' : 'Importar'}
            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleImportExcel} disabled={isImporting} />
          </label>
          <button
            onClick={() => { setSelectedItem(null); setIsModalOpen(true); }}
            className="flex flex-1 md:flex-none justify-center items-center gap-2 px-8 py-2.5 bg-[#1e3a8a] text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-[#112240] transition-all active:scale-95 shrink-0"
          >
            <Plus className="h-3.5 w-3.5" /> Nova Demanda
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex-1 min-h-[400px]">
        <DemandasTable
          data={filteredData}
          onEditClick={handleEditItem}
          onDeleteClick={(item) => setItemToDelete(item)}
        />
      </div>

      <DemandasFormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedItem(null); }}
        onSave={handleSaveData}
        initialData={selectedItem}
      />

      {/* Confirmação de Exclusão */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0a192f]/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
                <Trash2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-[#112240] tracking-tight mb-2">Confirmar Exclusão</h3>
              <p className="text-sm text-gray-500 font-semibold leading-relaxed">
                Tem certeza que deseja remover esta demanda de <span className="text-[#112240] font-black">{itemToDelete.solicitante || 'Sem Solicitante'}</span>?
              </p>
            </div>
            <div className="flex border-t border-gray-50">
              <button
                onClick={() => setItemToDelete(null)}
                className="flex-1 px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest hover:bg-gray-50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(itemToDelete.id)}
                className="flex-1 px-6 py-4 text-[9px] font-black text-red-500 uppercase tracking-widest hover:bg-red-50 transition-all border-l border-gray-50"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


