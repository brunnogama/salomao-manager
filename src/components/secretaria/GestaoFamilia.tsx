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

  // Busca dados iniciais
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

  // Listener para o botão ESC
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

  // Função para salvar novo lançamento manual
  const handleSaveData = async (formData: any) => {
    try {
      const { error } = await supabase
        .from('familia_salomao_dados')
        .insert([formData])

      if (error) throw error
      
      await fetchDados()
      setIsModalOpen(false)
    } catch (error) {
      console.error('Erro ao salvar:', error)
      alert('Erro ao salvar o lançamento.')
    }
  }

  // Função para deletar registro
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

  // Função para abrir visualização
  const handleViewItem = (item: any) => {
    setSelectedItem(item)
    setIsViewModalOpen(true)
  }

  // Função para Importar XLSX e salvar AUTOMATICAMENTE
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
        
        // Converte data do Excel para formato ISO (AAAA-MM-DD) para o Banco de Dados
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

        // Mapeamento usando EXATAMENTE os nomes das colunas da planilha
        const mapped = data.map((row: any) => ({
          vencimento: formatExcelDateToISO(row['Vencimento']),
          titular: row['Titular']?.toString() || '',
          fornecedor: row['Fornecedor']?.toString() || '',
          descricao_servico: row['Descrição do Serviço']?.toString() || '',
          tipo: row['Tipo']?.toString() || '',
          categoria: row['Categoria']?.toString() || '',
          valor: typeof row['Valor'] === 'number' ? row['Valor'] : parseFloat(row['Valor']?.toString().replace('R$', '').replace('.', '').replace(',', '.')) || 0,
          nota_fiscal: row['Nota Fiscal']?.toString() || '',
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
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-col sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm sm:flex-row">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-50 rounded-lg">
            <Users className="h-5 w-5 text-purple-600" />
          </div>
          <h2 className="text-lg font-bold text-[#112240]">Família Salomão</h2>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-lg w-fit">
          <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'dashboard' ? 'bg-white text-[#112240] shadow-sm' : 'text-gray-500 hover:text-[#112240]'}`}>
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </button>
          <button onClick={() => setActiveTab('dados')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'dados' ? 'bg-white text-[#112240] shadow-sm' : 'text-gray-500 hover:text-[#112240]'}`}>
            <Database className="h-4 w-4" /> Dados
          </button>
        </div>
      </div>

      <div className="flex-1">
        {activeTab === 'dashboard' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-red-50 rounded-lg text-red-600"><Heart className="h-6 w-6" /></div>
                <span className="text-xs font-bold text-gray-400 uppercase">Total Registros</span>
              </div>
              <p className="text-3xl font-bold text-[#112240]">{dadosFamilia.length}</p>
              <p className="text-sm text-gray-500 mt-1">Lançamentos na base de dados</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4">
              <div>
                <h3 className="font-bold text-[#112240]">Base de Dados Familiar</h3>
                <p className="text-xs text-gray-500">Importe planilhas ou adicione manualmente</p>
              </div>
              
              <div className="flex gap-3">
                <label className={`flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 cursor-pointer transition-colors shadow-sm ${isImporting ? 'opacity-50 pointer-events-none' : ''}`}>
                  {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 text-green-600" />}
                  {isImporting ? 'Salvando...' : 'Importar XLSX'}
                  <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleImportExcel} disabled={isImporting} />
                </label>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 bg-[#1e3a8a] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1e3a8a]/90 shadow-md transition-all active:scale-95"
                >
                  <PlusCircle className="w-4 h-4" /> Novo Registro
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              <FamiliaTable data={dadosFamilia} onItemClick={handleViewItem} />
            </div>
          </div>
        )}
      </div>

      <FamiliaFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveData}
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
        />
      )}
    </div>
  )
}