import { useState } from 'react'
import {
  MessageSquare,
  Trash2,
  Pencil,
  Users,
  Calendar,
  Pin,
  Tag,
  MessageSquarePlus,
  Megaphone,
  X,
  Tag as TagIcon
} from 'lucide-react'
import { AlertModal } from '../../../components/ui/AlertModal'
import { FilterBar, FilterCategory } from '../components/FilterBar'

type ComunicacaoCategoria = 'Aviso' | 'Comunicado' | 'Política' | 'Procedimento' | 'Outro'
type ComunicacaoPublico = 'Todos' | 'Advogados' | 'Estagiários' | 'Administrativo' | 'Diretoria'
type ActiveTab = 'Todos' | 'Fixados' | 'Avisos'

interface Comunicacao {
  id: string
  titulo: string
  conteudo: string
  categoria: ComunicacaoCategoria
  publico: ComunicacaoPublico
  data_publicacao: string
  fixado: boolean
  autor: string
}

const CATEGORIA_COLORS: Record<ComunicacaoCategoria, string> = {
  Aviso: 'bg-amber-50 text-amber-700',
  Comunicado: 'bg-blue-50 text-blue-700',
  Política: 'bg-purple-50 text-purple-700',
  Procedimento: 'bg-green-50 text-green-700',
  Outro: 'bg-gray-100 text-gray-600',
}

const MOCK_COMUNICACOES: Comunicacao[] = [
  {
    id: '1',
    titulo: 'Alteração do Horário de Atendimento',
    conteudo: 'Informamos que a partir do dia 01/04, o horário de atendimento ao público será das 09h às 18h, de segunda a sexta-feira.',
    categoria: 'Aviso',
    publico: 'Todos',
    data_publicacao: '2026-03-20',
    fixado: true,
    autor: 'Recursos Humanos',
  },
  {
    id: '2',
    titulo: 'Política de Home Office',
    conteudo: 'Foi aprovada a nova política de trabalho híbrido. Os integrantes poderão trabalhar remotamente até 2 vezes por semana, mediante aprovação da liderança.',
    categoria: 'Política',
    publico: 'Todos',
    data_publicacao: '2026-03-15',
    fixado: false,
    autor: 'Diretoria',
  },
  {
    id: '3',
    titulo: 'Procedimento de Solicitação de Férias',
    conteudo: 'Reforçamos que as solicitações de férias devem ser feitas com no mínimo 30 dias de antecedência, diretamente pelo sistema.',
    categoria: 'Procedimento',
    publico: 'Todos',
    data_publicacao: '2026-03-10',
    fixado: false,
    autor: 'Recursos Humanos',
  },
]

const formatDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

export function RHComunicacoesInternas() {
  const [searchTerm, setSearchTerm] = useState('')
  const [comunicacoes, setComunicacoes] = useState<Comunicacao[]>(MOCK_COMUNICACOES)
  const [activeTab, setActiveTab] = useState<ActiveTab>('Todos')

  // Filter state
  const [filterCategoria, setFilterCategoria] = useState('')
  const [filterPublico, setFilterPublico] = useState('')

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedComunicacao, setSelectedComunicacao] = useState<Comunicacao | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const [formData, setFormData] = useState<Partial<Comunicacao>>({
    titulo: '',
    conteudo: '',
    categoria: 'Comunicado',
    publico: 'Todos',
    fixado: false,
    autor: 'Recursos Humanos',
    data_publicacao: new Date().toISOString().split('T')[0],
  })

  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean
    title: string
    description: string
    variant: 'success' | 'error' | 'info'
  }>({ isOpen: false, title: '', description: '', variant: 'info' })

  const showAlert = (title: string, description: string, variant: 'success' | 'error' | 'info' = 'info') => {
    setAlertConfig({ isOpen: true, title, description, variant })
  }

  const handleOpenNew = () => {
    setSelectedComunicacao(null)
    setFormData({
      titulo: '',
      conteudo: '',
      categoria: 'Comunicado',
      publico: 'Todos',
      fixado: false,
      autor: 'Recursos Humanos',
      data_publicacao: new Date().toISOString().split('T')[0],
    })
    setIsFormOpen(true)
  }

  const handleEdit = (c: Comunicacao) => {
    setSelectedComunicacao(c)
    setFormData({ ...c })
    setIsFormOpen(true)
  }

  const handleSave = () => {
    if (!formData.titulo?.trim() || !formData.conteudo?.trim()) {
      showAlert('Campos obrigatórios', 'Preencha o título e o conteúdo.', 'error')
      return
    }
    if (selectedComunicacao) {
      setComunicacoes(prev =>
        prev.map(c => c.id === selectedComunicacao.id ? { ...c, ...formData } as Comunicacao : c)
      )
      showAlert('Sucesso', 'Comunicação atualizada com sucesso.', 'success')
    } else {
      const nova: Comunicacao = {
        ...(formData as Comunicacao),
        id: Date.now().toString(),
      }
      setComunicacoes(prev => [nova, ...prev])
      showAlert('Sucesso', 'Comunicação criada com sucesso.', 'success')
    }
    setIsFormOpen(false)
  }

  const handleDelete = (id: string) => setPendingDeleteId(id)

  const confirmDelete = () => {
    setComunicacoes(prev => prev.filter(c => c.id !== pendingDeleteId))
    setPendingDeleteId(null)
  }

  const togglePin = (id: string) => {
    setComunicacoes(prev => prev.map(c => c.id === id ? { ...c, fixado: !c.fixado } : c))
  }

  // ---- Filter config for FilterBar ----
  const categoriaOptions = (['Aviso', 'Comunicado', 'Política', 'Procedimento', 'Outro'] as ComunicacaoCategoria[])
    .map(v => ({ value: v, label: v }))

  const publicoOptions = (['Todos', 'Advogados', 'Estagiários', 'Administrativo', 'Diretoria'] as ComunicacaoPublico[])
    .map(v => ({ value: v, label: v }))

  const filterCategories: FilterCategory[] = [
    {
      key: 'categoria',
      label: 'Categoria',
      icon: TagIcon,
      type: 'single',
      options: categoriaOptions,
      value: filterCategoria,
      onChange: setFilterCategoria,
    },
    {
      key: 'publico',
      label: 'Público-Alvo',
      icon: Users,
      type: 'single',
      options: publicoOptions,
      value: filterPublico,
      onChange: setFilterPublico,
    },
  ]

  const activeFilterChips: { key: string; label: string; onClear: () => void }[] = []
  if (filterCategoria) activeFilterChips.push({ key: 'categoria', label: `Cat: ${filterCategoria}`, onClear: () => setFilterCategoria('') })
  if (filterPublico) activeFilterChips.push({ key: 'publico', label: `Para: ${filterPublico}`, onClear: () => setFilterPublico('') })

  const activeFilterCount = activeFilterChips.length

  const handleClearAll = () => {
    setFilterCategoria('')
    setFilterPublico('')
  }

  // ---- Derived filtered list ----
  const filtered = comunicacoes
    .filter(c => {
      const matchSearch =
        c.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.conteudo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.autor.toLowerCase().includes(searchTerm.toLowerCase())

      const matchCategoria = !filterCategoria || c.categoria === filterCategoria
      const matchPublico = !filterPublico || c.publico === filterPublico

      const matchTab =
        activeTab === 'Todos' ? true :
        activeTab === 'Fixados' ? c.fixado :
        activeTab === 'Avisos' ? c.categoria === 'Aviso' : true

      return matchSearch && matchCategoria && matchPublico && matchTab
    })
    .sort((a, b) => {
      if (a.fixado && !b.fixado) return -1
      if (!a.fixado && b.fixado) return 1
      return b.data_publicacao.localeCompare(a.data_publicacao)
    })

  const tabs: { id: ActiveTab; label: string; icon: any; count: number }[] = [
    { id: 'Todos', label: 'Todos', icon: MessageSquare, count: comunicacoes.length },
    { id: 'Fixados', label: 'Fixados', icon: Pin, count: comunicacoes.filter(c => c.fixado).length },
    { id: 'Avisos', label: 'Avisos', icon: Megaphone, count: comunicacoes.filter(c => c.categoria === 'Aviso').length },
  ]

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 space-y-4 sm:space-y-6 relative p-4 sm:p-6">

      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 animate-in slide-in-from-top-4 duration-500">

        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg shrink-0">
            <MessageSquare className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
              Comunicações Internas
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-1 sm:mt-0.5">
              Avisos, comunicados e políticas do Recursos Humanos
            </p>
          </div>
        </div>

        {/* Right: Tabs + round action button */}
        <div className="flex flex-wrap items-center gap-3 shrink-0 w-full md:w-auto justify-end mt-2 md:mt-0">
          <div className="flex items-center bg-gray-100/80 p-1 rounded-xl shrink-0">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-white text-[#1e3a8a] shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {tab.count > 0 && (
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 border-l border-gray-100 pl-4 ml-1">
            <button
              onClick={handleOpenNew}
              className="flex justify-center items-center w-10 h-10 rounded-xl shadow-lg transition-all active:scale-95 bg-white text-[#1e3a8a] hover:bg-gray-50 border border-gray-200 shrink-0"
              title="Nova Comunicação"
            >
              <MessageSquarePlus className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6 w-full">

        {/* TOOLBAR: counter card (left) + FilterBar (right, full width) */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch">

          {/* Counter card */}
          <div className="flex items-stretch shrink-0">
            <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white border border-gray-100 shadow-sm">
              <div className="p-2 rounded-lg bg-blue-50">
                <MessageSquare className="h-5 w-5 text-[#1e3a8a]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 leading-none">Total</span>
                <span className="text-xl font-black text-[#0a192f] leading-tight">{comunicacoes.length}</span>
              </div>
            </div>
          </div>

          {/* FilterBar (grows to fill remaining space) */}
          <div className="flex-1">
            <FilterBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              categories={filterCategories}
              activeFilterChips={activeFilterChips}
              activeFilterCount={activeFilterCount}
              onClearAll={handleClearAll}
            />
          </div>
        </div>

        {/* COMMUNICATIONS CARD GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.length > 0 ? (
            filtered.map((comunicacao) => {
              const ACCENT: Record<ComunicacaoCategoria, string> = {
                Aviso: 'from-amber-400 to-amber-600',
                Comunicado: 'from-blue-500 to-blue-700',
                Política: 'from-purple-500 to-purple-700',
                Procedimento: 'from-green-500 to-green-700',
                Outro: 'from-gray-400 to-gray-600',
              }
              return (
                <div
                  key={comunicacao.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group relative overflow-hidden flex flex-col"
                >
                  {/* Top accent bar */}
                  <div className={`h-1 w-full bg-gradient-to-r ${ACCENT[comunicacao.categoria]} shrink-0`} />

                  {/* Card body */}
                  <div className="flex flex-col flex-1 p-5 gap-3">

                    {/* Badges row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {comunicacao.fixado && (
                        <span className="flex items-center gap-1 px-2 py-1 text-[9px] font-black uppercase tracking-wider rounded-md bg-amber-50 text-amber-600">
                          <Pin className="h-2.5 w-2.5" /> Fixado
                        </span>
                      )}
                      <span className={`px-2 py-1 text-[9px] font-black uppercase tracking-wider rounded-md ${CATEGORIA_COLORS[comunicacao.categoria]}`}>
                        {comunicacao.categoria}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-black text-[#0a192f] leading-snug line-clamp-2">
                      {comunicacao.titulo}
                    </h3>

                    {/* Content preview */}
                    <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 flex-1">
                      {comunicacao.conteudo}
                    </p>

                    {/* Footer */}
                    <div className="pt-3 border-t border-gray-50 flex items-end justify-between gap-2 mt-auto">
                      <div className="flex flex-col gap-1 text-[11px] font-medium text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 shrink-0" />
                          {formatDate(comunicacao.data_publicacao)}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3 w-3 shrink-0" />
                          {comunicacao.publico}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Tag className="h-3 w-3 shrink-0" />
                          {comunicacao.autor}
                        </div>
                      </div>

                      {/* Actions — visible on hover */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={() => togglePin(comunicacao.id)}
                          title={comunicacao.fixado ? 'Desafixar' : 'Fixar'}
                          className={`p-1.5 rounded-lg transition-colors ${comunicacao.fixado ? 'text-amber-500 hover:bg-amber-50' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-50'}`}
                        >
                          <Pin className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleEdit(comunicacao)}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(comunicacao.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-16 flex flex-col items-center justify-center text-center">
                <div className="p-4 rounded-full bg-blue-50 mb-4">
                  <MessageSquare className="h-12 w-12 text-[#1e3a8a] opacity-20" />
                </div>
                <h2 className="text-xl font-black text-[#0a192f]">Nenhuma comunicação encontrada</h2>
                <p className="text-gray-500 max-w-sm mt-2">
                  Crie a primeira comunicação interna clicando no botão verde no topo.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FORM MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240]">
                  <MessageSquarePlus className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#0a192f]">
                    {selectedComunicacao ? 'Editar Comunicação' : 'Nova Comunicação'}
                  </h2>
                  <p className="text-xs text-gray-400 font-medium">Preencha os campos abaixo</p>
                </div>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-1.5">
                  Título *
                </label>
                <input
                  type="text"
                  value={formData.titulo || ''}
                  onChange={e => setFormData(p => ({ ...p, titulo: e.target.value }))}
                  placeholder="Título da comunicação..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent outline-none transition-all font-medium text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-1.5">
                    Categoria
                  </label>
                  <select
                    value={formData.categoria || 'Comunicado'}
                    onChange={e => setFormData(p => ({ ...p, categoria: e.target.value as ComunicacaoCategoria }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] outline-none transition-all font-medium text-sm"
                  >
                    {(['Aviso', 'Comunicado', 'Política', 'Procedimento', 'Outro'] as ComunicacaoCategoria[]).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-1.5">
                    Público-Alvo
                  </label>
                  <select
                    value={formData.publico || 'Todos'}
                    onChange={e => setFormData(p => ({ ...p, publico: e.target.value as ComunicacaoPublico }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] outline-none transition-all font-medium text-sm"
                  >
                    {(['Todos', 'Advogados', 'Estagiários', 'Administrativo', 'Diretoria'] as ComunicacaoPublico[]).map(pub => (
                      <option key={pub} value={pub}>{pub}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-1.5">
                    Data de Publicação
                  </label>
                  <input
                    type="date"
                    value={formData.data_publicacao || ''}
                    onChange={e => setFormData(p => ({ ...p, data_publicacao: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] outline-none transition-all font-medium text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-1.5">
                    Autor / Setor
                  </label>
                  <input
                    type="text"
                    value={formData.autor || ''}
                    onChange={e => setFormData(p => ({ ...p, autor: e.target.value }))}
                    placeholder="Ex: Recursos Humanos"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] outline-none transition-all font-medium text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-1.5">
                  Conteúdo *
                </label>
                <textarea
                  value={formData.conteudo || ''}
                  onChange={e => setFormData(p => ({ ...p, conteudo: e.target.value }))}
                  placeholder="Digite o conteúdo da comunicação..."
                  rows={5}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] outline-none transition-all font-medium text-sm resize-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, fixado: !p.fixado }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${formData.fixado ? 'bg-amber-500' : 'bg-gray-200'}`}
                >
                  <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${formData.fixado ? 'translate-x-5' : ''}`} />
                </button>
                <span className="text-sm font-semibold text-gray-600">Fixar no topo da lista</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
              <button
                onClick={() => setIsFormOpen(false)}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 font-black text-[10px] uppercase tracking-wider transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-8 py-3 bg-gradient-to-r from-[#1e3a8a] to-[#112240] text-white rounded-xl font-black text-[10px] uppercase tracking-wider shadow-lg hover:shadow-xl transition-all active:scale-95"
              >
                {selectedComunicacao ? 'Salvar Alterações' : 'Publicar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <AlertModal
        isOpen={!!pendingDeleteId}
        onClose={() => setPendingDeleteId(null)}
        title="Excluir Comunicação"
        description="Tem certeza que deseja excluir esta comunicação? Esta ação não pode ser desfeita."
        variant="error"
        confirmText="Excluir"
        onConfirm={confirmDelete}
      />

      <AlertModal
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
        title={alertConfig.title}
        description={alertConfig.description}
        variant={alertConfig.variant}
        confirmText="OK"
      />
    </div>
  )
}
