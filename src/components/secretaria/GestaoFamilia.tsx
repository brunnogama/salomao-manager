import { useState, useEffect } from 'react'
import { LayoutDashboard, Database, Users, Heart, FileSpreadsheet, PlusCircle, Loader2 } from 'lucide-react'
import * as XLSX from 'xlsx'
import { supabase } from '../../lib/supabase'
import { FamiliaTable } from './FamiliaTable'
import { FamiliaFormModal } from './FamiliaFormModal'
import { FamiliaViewModal } from './FamiliaViewModal'

export function GestaoFamilia() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'dados'>('dashboard')
  const [dadosFamilia, setDadosFamilia] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)

  const fetchDados = async () => {
    const { data, error } = await supabase
      .from('familia_salomao_dados')
      .select('*')
      .order('vencimento', { ascending: false })
    
    if (!error && data) setDadosFamilia(data)
  }

  useEffect(() => {
    fetchDados()
  }, [])

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsViewModalOpen(false)
        setSelectedItem(null)
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [])

  const handleSaveData = async (formData: any) => {
    try {
      if (formData.id) {
        const { error } = await supabase
          .from('familia_salomao_dados')
          .update(formData)
          .eq('id', formData.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('familia_salomao_dados')
          .insert([formData])

        if (error) throw error
      }
      
      await fetchDados()
      setIsModalOpen(false)
      setSelectedItem(null)
    } catch (error) {
      console.error('Erro ao salvar:', error)
      alert('Erro ao salvar o lançamento.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este registro?')) return

    try {
      const { error } = await supabase
        .from('familia_salomao_dados')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      await fetchDados()
      setIsViewModalOpen(false)
      setSelectedItem(null)
    } catch (error) {
      console.error('Erro ao excluir:', error)
      alert('Erro ao excluir o registro.')
    }
  }

  const handleViewItem = (item: any) => {
    setSelectedItem(item)
    setIsViewModalOpen(true)
  }

  const handleEditFromView = (item: any) => {
    setIsViewModalOpen(false)
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
          return excelDate;
        };

        const mapped = data.map((row: any) => ({
          vencimento: formatExcelDateToISO(row['Vencimento']),
          titular: row['Titular']?.toString() || '',
          fornecedor: row['Fornecedor']?.toString() || '',
          descricao_servico: row['Descrição do Serviço']?.toString() || '',
          tipo: row['Tipo']?.toString() || '',
          categoria: row['Categoria']?.toString() || '',
          valor: typeof row['Valor'] === 'number' ? row['Valor'] : parseFloat(row['Valor']?.toString().replace('R$', '').replace('.', '').replace(',', '.')) || 0,
          nota_fiscal: row['Nota Fiscal']?.toString() || '',
          fatura: row['Fatura']?.toString() || '',
          recibo: row['Recibo']?.toString() || '',
          boleto: row['Boleto']?.toString() || '',
          os: row['O.S.']?.toString() || '',
          rateio: row['Rateio']?.toString() || '',
          rateio_porcentagem: parseFloat(row['Porcentagem']) || 0,
          fator_gerador: row['Fator Gerador']?.toString() || '',
          data_envio: formatExcelDateToISO(row['Data de envio']),
          status: row['Status']?.toString() || 'Pendente',
          comprovante: row['Comprovante']?.toString() || ''
        }))

        const { error } = await supabase
          .from('familia_salomao_dados')
          .insert(mapped)

        if (error) throw error

        alert(`${mapped.length} registros importados com sucesso!`)
        await fetchDados()
      } catch (error: any) {
        console.error('Erro na importação:', error)
        alert(`Erro na importação: ${error.message || 'Verifique o arquivo.'}`)
      } finally {
        setIsImporting(false)
        e.target.value = ''
      }
    }
    reader.readAsBinaryString(file)
  }

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-br from-white via-purple-50/30 to-blue-50/20 p-6 rounded-2xl border border-purple-100/50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl shadow-lg shadow-purple-500/20">
            <Heart className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-[#112240] tracking-tight">Família Salomão</h2>
            <p className="text-[10px] font-bold text-purple-600/60 uppercase tracking-wider">Gestão Financeira Familiar</p>
          </div>
        </div>

        <div className="flex bg-white/80 backdrop-blur-sm p-1.5 rounded-xl border border-purple-100/50 shadow-sm">
          <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/30' : 'text-gray-500 hover:text-[#112240] hover:bg-gray-50'}`}>
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </button>
          <button onClick={() => setActiveTab('dados')} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'dados' ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/30' : 'text-gray-500 hover:text-[#112240] hover:bg-gray-50'}`}>
            <Database className="h-4 w-4" /> Dados
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {activeTab === 'dashboard' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
            <div className="bg-gradient-to-br from-white to-purple-50/30 p-8 rounded-2xl border border-purple-100/50 shadow-sm hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl shadow-lg shadow-purple-500/20">
                  <Heart className="h-7 w-7 text-white" />
                </div>
                <span className="text-[9px] font-black text-purple-600/50 uppercase tracking-wider">Total Registros</span>
              </div>
              <p className="text-4xl font-black text-[#112240] mb-2">{dadosFamilia.length}</p>
              <p className="text-sm font-semibold text-gray-500">Lançamentos cadastrados</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full">
            <div className="p-6 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4 flex-shrink-0">
              <div>
                <h3 className="font-black text-lg text-[#112240] tracking-tight">Base de Dados Familiar</h3>
                <p className="text-xs font-semibold text-gray-400 mt-0.5">Importe planilhas ou adicione manualmente</p>
              </div>
              
              <div className="flex gap-3">
                <label className={`flex items-center gap-2.5 bg-white border-2 border-green-200 text-green-700 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-green-50 hover:border-green-300 cursor-pointer transition-all shadow-sm ${isImporting ? 'opacity-50 pointer-events-none' : ''}`}>
                  {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                  {isImporting ? 'Salvando...' : 'Importar XLSX'}
                  <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleImportExcel} disabled={isImporting} />
                </label>
                <button 
                  onClick={() => {
                    setSelectedItem(null)
                    setIsModalOpen(true)
                  }}
                  className="flex items-center gap-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:from-purple-700 hover:to-blue-700 shadow-lg shadow-purple-500/30 transition-all active:scale-95"
                >
                  <PlusCircle className="w-4 h-4" /> Novo Registro
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-auto">
              <FamiliaTable data={dadosFamilia} onItemClick={handleViewItem} />
            </div>
          </div>
        )}
      </div>

      <FamiliaFormModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false)
          setSelectedItem(null)
        }} 
        onSave={handleSaveData}
        initialData={selectedItem}
      />

      {selectedItem && (
        <FamiliaViewModal
          item={selectedItem}
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false)
            setSelectedItem(null)
          }}
          onDelete={handleDelete}
          onEdit={handleEditFromView}
        />
      )}
    </div>
  )
}