import { useState, useEffect, useMemo } from 'react'
import { LayoutDashboard, Database, Users, Home, FileSpreadsheet, PlusCircle, Loader2, Search, Plus, Filter, X, ChevronDown, Trash2 } from 'lucide-react'
import * as XLSX from 'xlsx'
import { supabase } from '../../lib/supabase'
import { FamiliaTable } from './FamiliaTable'
import { FamiliaFormModal } from './FamiliaFormModal'
import { FamiliaViewModal } from './FamiliaViewModal'
import { FamiliaStats } from './FamiliaStats'
import { FamiliaFilters } from './FamiliaFilters'

export function GestaoFamilia() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'dados'>('dashboard')
  const [dadosFamilia, setDadosFamilia] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<any | null>(null)

  // Estados de Filtro
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTitular, setFilterTitular] = useState('')
  const [filterCategoria, setFilterCategoria] = useState('')
  const [filterFornecedor, setFilterFornecedor] = useState('')

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

  // Lógica de Filtragem
  const filteredData = useMemo(() => {
    return dadosFamilia.filter(item => {
      const matchSearch = searchTerm === '' || 
        item.fornecedor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.descricao_servico?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.titular?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchTitular = filterTitular === '' || item.titular === filterTitular
      const matchCategoria = filterCategoria === '' || item.categoria === filterCategoria
      const matchFornecedor = filterFornecedor === '' || item.fornecedor === filterFornecedor

      return matchSearch && matchTitular && matchCategoria && matchFornecedor
    })
  }, [dadosFamilia, searchTerm, filterTitular, filterCategoria, filterFornecedor])

  // Listener para o botão ESC
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsViewModalOpen(false)
        setSelectedItem(null)
        setItemToDelete(null)
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [])

  // Função para salvar ou atualizar lançamento
  const handleSaveData = async (formData: any) => {
    try {
      if (formData.id) {
        // Lógica de Edição (Update)
        const { error } = await supabase
          .from('familia_salomao_dados')
          .update(formData)
          .eq('id', formData.id)

        if (error) throw error
      } else {
        // Lógica de Novo Registro (Insert)
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

  // Função para deletar registro
  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('familia_salomao_dados')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      await fetchDados()
      setIsViewModalOpen(false)
      setSelectedItem(null)
      setItemToDelete(null)
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

  // Função para disparar a edição
  const handleEditItem = (item: any) => {
    setSelectedItem(item)
    setIsModalOpen(true)
  }

  // Função para disparar a edição a partir do modal de visualização
  const handleEditFromView = (item: any) => {
    setIsViewModalOpen(false)
    setSelectedItem(item)
    setIsModalOpen(true)
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
    <div className="max-w-[95%] mx-auto space-y-6 pb-12">
      {/* Linha Superior: Card de Total (Esquerda) e Abas (Direita) */}
      <div className="flex items-center justify-between">
        <div>
          <FamiliaStats data={dadosFamilia} />
        </div>

        <div className="flex bg-gray-100/80 p-1.5 rounded-xl border border-gray-200 shadow-sm w-fit">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${activeTab === 'dashboard' ? 'bg-white text-blue-600 shadow-md transform scale-[1.02]' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200/50'}`}
          >
            <LayoutDashboard className={`h-4 w-4 ${activeTab === 'dashboard' ? 'text-blue-600' : ''}`} /> Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('dados')} 
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${activeTab === 'dados' ? 'bg-white text-blue-600 shadow-md transform scale-[1.02]' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200/50'}`}
          >
            <Database className={`h-4 w-4 ${activeTab === 'dados' ? 'text-blue-600' : ''}`} /> Dados
          </button>
        </div>
      </div>

      {/* Barra de Baixo: Busca, Filtros e Novo */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar registros..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>

        <div className="flex items-center gap-3">
          <FamiliaFilters 
            data={dadosFamilia}
            filterTitular={filterTitular}
            setFilterTitular={setFilterTitular}
            filterCategoria={filterCategoria}
            setFilterCategoria={setFilterCategoria}
            filterFornecedor={filterFornecedor}
            setFilterFornecedor={setFilterFornecedor}
          />

          <div className="flex gap-2">
            {activeTab === 'dados' && (
              <label className={`flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl font-bold text-sm shadow-sm hover:bg-gray-50 cursor-pointer transition-all ${isImporting ? 'opacity-50 pointer-events-none' : ''}`}>
                {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 text-green-600" />}
                {isImporting ? 'Salvando...' : 'Importar'}
                <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleImportExcel} disabled={isImporting} />
              </label>
            )}
            <button 
              onClick={() => {
                setSelectedItem(null)
                setIsModalOpen(true)
              }} 
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#1e3a8a] to-[#0f172a] text-white rounded-xl font-bold text-sm shadow-md hover:from-[#112240] hover:to-[#020617] transition-all transform hover:scale-[1.02] active:scale-95"
            >
              <Plus className="h-4 w-4" /> Novo
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1">
        {activeTab === 'dashboard' ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-4">
            <StatCard title="Total Registros" value={dadosFamilia.length} icon={Home} color="blue" />
            <div className="md:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <Home className="h-12 w-12 text-blue-100 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900">Dashboard de Gestão Familiar</h3>
              <p className="text-gray-500 text-sm">Selecione a aba Dados para gerenciar os lançamentos.</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            <FamiliaTable 
              data={filteredData} 
              onEditClick={handleEditItem}
              onDeleteClick={(item) => setItemToDelete(item)}
            />
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
          onDelete={(id) => setItemToDelete(selectedItem)}
          onEdit={handleEditFromView}
        />
      )}

      {/* Modal de Confirmação Elegante */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0a192f]/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-[#112240] mb-2">Confirmar Exclusão</h3>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">
                Tem certeza que deseja remover o lançamento de <span className="font-bold text-[#112240]">{itemToDelete.fornecedor}</span>? Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="flex border-t border-gray-50">
              <button 
                onClick={() => setItemToDelete(null)}
                className="flex-1 px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleDelete(itemToDelete.id)}
                className="flex-1 px-6 py-4 text-[10px] font-black text-red-500 uppercase tracking-widest hover:bg-red-50 transition-colors border-l border-gray-50"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ title, value, icon: Icon, color }: any) {
  const themes: any = { 
    blue: 'text-blue-600 bg-blue-50 border-blue-100', 
    green: 'text-green-600 bg-green-50 border-green-100', 
    red: 'text-red-600 bg-red-50 border-red-100', 
    gray: 'text-gray-600 bg-gray-50 border-gray-100' 
  }
  return (
    <div className={`bg-white p-6 rounded-xl shadow-sm border flex items-center justify-between ${themes[color].split(' ')[2]}`}>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-3xl font-bold mt-1 text-gray-900">{value}</p>
      </div>
      <div className={`p-3 rounded-xl ${themes[color].split(' ')[0]} ${themes[color].split(' ')[1]}`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
  )
}