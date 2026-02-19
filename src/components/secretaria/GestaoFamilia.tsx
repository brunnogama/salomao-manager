import { useState, useEffect, useMemo } from 'react'
import {
  LayoutDashboard,
  Database,
  Home,
  FileSpreadsheet,
  Loader2,
  Search,
  Plus,
  Trash2,
  UserCircle,
  LogOut,
  Grid,
  Briefcase
} from 'lucide-react'
import XLSX from 'xlsx-js-style'
import { supabase } from '../../lib/supabase'
import { FamiliaTable } from './FamiliaTable'
import { FamiliaFormModal } from './FamiliaFormModal'
import { FamiliaViewModal } from './FamiliaViewModal'
import { FamiliaStats } from './FamiliaStats'
import { FamiliaFilters } from './FamiliaFilters'

interface GestaoFamiliaProps {
  userName?: string;
  onModuleHome?: () => void;
  onLogout?: () => void;
}

export function GestaoFamilia({
  userName = 'Usuário',
  onModuleHome,
  onLogout
}: GestaoFamiliaProps) {
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
    }
  }

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
    }
  }

  const handleViewItem = (item: any) => {
    setSelectedItem(item)
    setIsViewModalOpen(true)
  }

  const handleEditItem = (item: any) => {
    setSelectedItem(item)
    setIsModalOpen(true)
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

        const { error } = await supabase.from('familia_salomao_dados').insert(mapped)
        if (error) throw error
        await fetchDados()
      } catch (error: any) {
        console.error('Erro na importação:', error)
      } finally {
        setIsImporting(false)
        e.target.value = ''
      }
    }
    reader.readAsBinaryString(file)
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 p-6 space-y-6">

      {/* PAGE HEADER - Padrão Salomão */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg">
            <Briefcase className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
              Gestão Família
            </h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">
              Controle de lançamentos e serviços familiares
            </p>
          </div>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-bold text-[#0a192f]">{userName}</span>
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Conectado</span>
          </div>
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#1e3a8a] to-[#112240] flex items-center justify-center text-white shadow-md">
            <UserCircle className="h-5 w-5" />
          </div>
          {onModuleHome && (
            <button onClick={onModuleHome} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
              <Grid className="h-5 w-5" />
            </button>
          )}
          {onLogout && (
            <button onClick={onLogout} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all">
              <LogOut className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Linha Superior: Cards de Stats e Seletor de Abas */}
      <div className="flex flex-col lg:flex-row items-stretch justify-between gap-6">
        <div className="flex-1">
          <FamiliaStats data={dadosFamilia} />
        </div>

        <div className="flex bg-gray-100/80 p-1 rounded-2xl border border-gray-200 shadow-sm w-fit self-start lg:self-center shrink-0">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'dashboard' ? 'bg-[#1e3a8a] text-white shadow-lg' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
          </button>
          <button
            onClick={() => setActiveTab('dados')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'dados' ? 'bg-[#1e3a8a] text-white shadow-lg' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Database className="h-3.5 w-3.5" /> Dados
          </button>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar lançamentos..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-100/50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
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
              <label className={`flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-sm hover:bg-gray-50 cursor-pointer transition-all active:scale-95 ${isImporting ? 'opacity-50 pointer-events-none' : ''}`}>
                {isImporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5 text-green-600" />}
                {isImporting ? 'Salvando...' : 'Importar'}
                <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleImportExcel} disabled={isImporting} />
              </label>
            )}
            <button
              onClick={() => { setSelectedItem(null); setIsModalOpen(true); }}
              className="flex items-center gap-2 px-8 py-2.5 bg-[#1e3a8a] text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-[#112240] transition-all active:scale-95 shrink-0"
            >
              <Plus className="h-3.5 w-3.5" /> Novo
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1">
        {activeTab === 'dashboard' ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in zoom-in duration-300">
            <StatCard title="Total Registros" value={dadosFamilia.length} icon={Home} />
            <div className="md:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center flex flex-col items-center justify-center">
              <div className="p-4 bg-blue-50 rounded-full mb-4">
                <Home className="h-12 w-12 text-blue-200" />
              </div>
              <h3 className="text-xl font-black text-[#112240] tracking-tight">Dashboard de Gestão Familiar</h3>
              <p className="text-gray-400 text-sm font-semibold mt-1">Selecione a aba Dados para gerenciar os lançamentos em detalhe.</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-300">
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
        onClose={() => { setIsModalOpen(false); setSelectedItem(null); }}
        onSave={handleSaveData}
        initialData={selectedItem}
      />

      {selectedItem && (
        <FamiliaViewModal
          item={selectedItem}
          isOpen={isViewModalOpen}
          onClose={() => { setIsViewModalOpen(false); setSelectedItem(null); }}
          onDelete={() => setItemToDelete(selectedItem)}
          onEdit={handleEditFromView}
        />
      )}

      {/* Modal de Confirmação - Padrão [2rem] radius */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0a192f]/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
                <Trash2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-[#112240] tracking-tight mb-2">Confirmar Exclusão</h3>
              <p className="text-sm text-gray-500 font-semibold leading-relaxed">
                Tem certeza que deseja remover o lançamento de <span className="text-[#112240] font-black">{itemToDelete.fornecedor}</span>?
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

function StatCard({ title, value, icon: Icon }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all">
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</p>
        <p className="text-3xl font-black mt-1 text-[#112240] tracking-tighter">{value}</p>
      </div>
      <div className="p-3.5 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
        <Icon className="h-6 w-6" />
      </div>
    </div>
  )
}