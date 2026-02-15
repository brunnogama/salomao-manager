import { useMemo } from 'react'
import { Filter, User, Tag, Building2, X } from 'lucide-react'
import { FilterSelect } from '../controladoria/ui/FilterSelect'

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
      titulares: [
        { label: 'Todos Titulares', value: '' },
        ...Array.from(new Set(data.map(item => item.titular).filter(Boolean))).sort().map(t => ({ label: t, value: t }))
      ],
      categorias: [
        { label: 'Todas Categorias', value: '' },
        ...Array.from(new Set(data.map(item => item.categoria).filter(Boolean))).sort().map(c => ({ label: c, value: c }))
      ],
      fornecedores: [
        { label: 'Todos Fornecedores', value: '' },
        ...Array.from(new Set(data.map(item => item.fornecedor).filter(Boolean))).sort().map(f => ({ label: f, value: f }))
      ]
    }
  }, [data])

  const hasActiveFilters = filterTitular || filterCategoria || filterFornecedor

  const clearAll = () => {
    setFilterTitular('')
    setFilterCategoria('')
    setFilterFornecedor('')
  }

  return (
    <div className="flex items-center gap-3">
      {/* Filtro Titular */}
      <FilterSelect
        icon={User}
        value={filterTitular}
        onChange={setFilterTitular}
        options={options.titulares}
        placeholder="Titulares"
      />

      {/* Filtro Categoria */}
      <FilterSelect
        icon={Tag}
        value={filterCategoria}
        onChange={setFilterCategoria}
        options={options.categorias}
        placeholder="Categorias"
      />

      {/* Filtro Fornecedor */}
      <FilterSelect
        icon={Building2}
        value={filterFornecedor}
        onChange={setFilterFornecedor}
        options={options.fornecedores}
        placeholder="Fornecedores"
      />

      {/* Botão Limpar */}
      {hasActiveFilters && (
        <button
          onClick={clearAll}
          className="flex items-center gap-2 px-3 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all border border-red-100 shadow-sm group"
          title="Limpar filtros"
        >
          <X className="w-4 h-4 group-hover:rotate-90 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-wider">Limpar</span>
        </button>
      )}
    </div>
  )
}