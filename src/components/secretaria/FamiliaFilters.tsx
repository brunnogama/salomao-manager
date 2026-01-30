// src/components/secretaria/FamiliaFilters.tsx
import { useMemo } from 'react'
import { Search, Filter, User, Tag, Building2, X } from 'lucide-react'

interface FamiliaFiltersProps {
  data: any[]
  searchTerm: string
  setSearchTerm: (val: string) => void
  filterTitular: string
  setFilterTitular: (val: string) => void
  filterCategoria: string
  setFilterCategoria: (val: string) => void
  filterFornecedor: string
  setFilterFornecedor: (val: string) => void
}

export function FamiliaFilters({
  data,
  searchTerm,
  setSearchTerm,
  filterTitular,
  setFilterTitular,
  filterCategoria,
  setFilterCategoria,
  filterFornecedor,
  setFilterFornecedor
}: FamiliaFiltersProps) {

  // Extrai opções únicas dos dados para os selects
  const options = useMemo(() => {
    return {
      titulares: Array.from(new Set(data.map(item => item.titular).filter(Boolean))).sort(),
      categorias: Array.from(new Set(data.map(item => item.categoria).filter(Boolean))).sort(),
      fornecedores: Array.from(new Set(data.map(item => item.fornecedor).filter(Boolean))).sort()
    }
  }, [data])

  const hasActiveFilters = searchTerm || filterTitular || filterCategoria || filterFornecedor

  const clearAll = () => {
    setSearchTerm('')
    setFilterTitular('')
    setFilterCategoria('')
    setFilterFornecedor('')
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        
        {/* Busca Geral */}
        <div className="md:col-span-4 relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Busca geral (Fornecedor, Serviço...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
          />
        </div>

        {/* Filtro Titular */}
        <div className="md:col-span-2 relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <select
            value={filterTitular}
            onChange={(e) => setFilterTitular(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none appearance-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer"
          >
            <option value="">Titular: Todos</option>
            {options.titulares.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>

        {/* Filtro Categoria */}
        <div className="md:col-span-3 relative">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <select
            value={filterCategoria}
            onChange={(e) => setFilterCategoria(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none appearance-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer"
          >
            <option value="">Categoria: Todas</option>
            {options.categorias.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>

        {/* Filtro Fornecedor */}
        <div className="md:col-span-3 relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <select
            value={filterFornecedor}
            onChange={(e) => setFilterFornecedor(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none appearance-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer"
          >
            <option value="">Fornecedor: Todos</option>
            {options.fornecedores.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      </div>

      {/* Tags de Filtro Ativo */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filtros ativos:
          </span>
          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 px-2 py-1 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold hover:bg-red-100 transition-colors"
          >
            <X className="w-3 h-3" /> Limpar tudo
          </button>
        </div>
      )}
    </div>
  )
}