import { useMemo } from 'react'
import { Filter, User, Tag, Building2 } from 'lucide-react'
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

    </div>
  )
}