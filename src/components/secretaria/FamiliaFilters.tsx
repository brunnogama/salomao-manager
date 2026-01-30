import { useMemo } from 'react'
import { Filter, User, Tag, Building2, X, ChevronDown } from 'lucide-react'

interface FamiliaFiltersProps {
  data: any[]
  filterTitular: string
  setFilterTitular: (val: string) => void
  filterCategoria: string
  setFilterCategoria: (val: string) => void
  filterFornecedor: string
  setFilterFornecedor: (val: string) => void
}

export function FamiliaFilters({
  data,
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

  const hasActiveFilters = filterTitular || filterCategoria || filterFornecedor

  const clearAll = () => {
    setFilterTitular('')
    setFilterCategoria('')
    setFilterFornecedor('')
  }

  return (
    <div className="flex items-center gap-2">
      {/* Filtro Titular */}
      <div className="relative">
        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
        <select
          value={filterTitular}
          onChange={(e) => setFilterTitular(e.target.value)}
          className="pl-9 pr-10 py-2 bg-gray-100/50 border border-gray-200 rounded-xl text-sm font-medium outline-none appearance-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer min-w-[140px] text-gray-700"
        >
          <option value="">Titular</option>
          {options.titulares.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
      </div>

      {/* Filtro Categoria */}
      <div className="relative">
        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
        <select
          value={filterCategoria}
          onChange={(e) => setFilterCategoria(e.target.value)}
          className="pl-9 pr-10 py-2 bg-gray-100/50 border border-gray-200 rounded-xl text-sm font-medium outline-none appearance-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer min-w-[140px] text-gray-700"
        >
          <option value="">Categoria</option>
          {options.categorias.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
      </div>

      {/* Filtro Fornecedor */}
      <div className="relative">
        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
        <select
          value={filterFornecedor}
          onChange={(e) => setFilterFornecedor(e.target.value)}
          className="pl-9 pr-10 py-2 bg-gray-100/50 border border-gray-200 rounded-xl text-sm font-medium outline-none appearance-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer min-w-[140px] text-gray-700"
        >
          <option value="">Fornecedor</option>
          {options.fornecedores.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
      </div>

      {/* Botão Limpar */}
      {hasActiveFilters && (
        <button
          onClick={clearAll}
          className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors border border-red-100 shadow-sm"
          title="Limpar filtros"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}