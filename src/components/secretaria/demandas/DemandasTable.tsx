import { useState, useMemo } from 'react'
import { Edit2, Search, Trash2 } from 'lucide-react'

interface DemandasTableProps {
  data: any[]
  onEditClick: (item: any) => void
  onDeleteClick: (item: any) => void
}

export function DemandasTable({ data, onEditClick, onDeleteClick }: DemandasTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15

  const statusColors: any = {
    'Pendente': 'bg-amber-100 text-amber-800 border-amber-200',
    'Em andamento': 'bg-blue-100 text-blue-800 border-blue-200',
    'Concluído': 'bg-green-100 text-green-800 border-green-200'
  }

  const prioridadeColors: any = {
    'Alta': 'text-red-600 bg-red-50 border-red-100',
    'Média': 'text-amber-600 bg-amber-50 border-amber-100',
    'Baixa': 'text-green-600 bg-green-50 border-green-100'
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    const [year, month, day] = dateStr.split('T')[0].split('-')
    return `${day}/${month}/${year}`
  }

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      // Sort by status putting Pendente first, then priorities
      if (a.status !== b.status) {
        if (a.status === 'Pendente') return -1;
        if (b.status === 'Pendente') return 1;
        if (a.status === 'Em andamento') return -1;
        if (b.status === 'Em andamento') return 1;
      }
      // Sort by Date Solicitacao DESC
      return new Date(b.data_solicitacao || 0).getTime() - new Date(a.data_solicitacao || 0).getTime();
    })
  }, [data])

  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(data.length / itemsPerPage)

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-white min-h-[400px]">
        <div className="p-4 bg-gray-50 rounded-full mb-4">
          <Search className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Nenhuma demanda encontrada</p>
        <p className="text-xs text-gray-400 mt-2">Os registros aparecerão aqui</p>
      </div>
    )
  }

  return (
    <div className="bg-white flex flex-col h-full rounded-b-xl">
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-[#1e3a8a] to-[#112240]">
              <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap">Data</th>
              <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap">Solicitante</th>
              <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap">Unidade</th>
              <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap">Fornecedor</th>
              <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest min-w-[200px]">Demanda</th>
              <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap text-center">Prioridade</th>
              <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap text-center">Status</th>
              <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap">Prazo</th>
              <th className="p-4 text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginatedData.map((item, index) => (
              <tr 
                key={item.id || index} 
                className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                onClick={() => onEditClick(item)}
              >
                <td className="p-4">
                  <span className="text-xs font-bold text-[#112240] bg-gray-100 px-2 py-1 rounded-md">
                    {formatDate(item.data_solicitacao)}
                  </span>
                </td>
                <td className="p-4">
                  <span className="text-sm font-semibold text-[#112240]">{item.solicitante || '-'}</span>
                </td>
                <td className="p-4">
                  <span className="text-xs font-medium text-gray-600 bg-gray-50 border border-gray-100 px-2 py-1 rounded-md">
                    {item.unidade || '-'}
                  </span>
                </td>
                <td className="p-4 text-sm text-gray-600 font-medium truncate max-w-[150px]">
                  {item.fornecedor || '-'}
                </td>
                <td className="p-4">
                  <p className="text-sm font-medium text-[#112240] truncate max-w-[250px]" title={item.demanda}>
                    {item.demanda || '-'}
                  </p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">
                    {item.categoria || '-'} • {item.tipo || '-'}
                  </p>
                </td>
                <td className="p-4 text-center">
                  <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${prioridadeColors[item.prioridade] || 'text-gray-600 bg-gray-50 border-gray-200'}`}>
                    {item.prioridade || 'Média'}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${statusColors[item.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                    {item.status || 'Pendente'}
                  </span>
                </td>
                <td className="p-4">
                  <span className="text-xs font-semibold text-gray-600">
                    {formatDate(item.prazo)}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); onEditClick(item); }}
                      className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteClick(item); }}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between shrink-0">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Página {currentPage} de {totalPages}
          </span>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-7 h-7 rounded-lg text-xs font-black transition-all ${
                  currentPage === i + 1
                    ? 'bg-[#1e3a8a] text-white shadow-md'
                    : 'text-gray-500 hover:bg-gray-200'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
