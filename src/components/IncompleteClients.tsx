import { useState, useEffect, useMemo } from 'react'
import { Filter, LayoutList, LayoutGrid, Pencil, Trash2, X, AlertTriangle, ChevronDown, FileSpreadsheet, RefreshCw, AlertCircle, ArrowUpDown } from 'lucide-react'
import { NewClientModal, ClientData } from './NewClientModal'
import { utils, writeFile } from 'xlsx'
import { supabase } from '../lib/supabase'

interface Client extends ClientData {
  id: number;
}

export function IncompleteClients() {
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null)
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)

  // Filtros e Ordenação
  const [socioFilter, setSocioFilter] = useState('')
  const [brindeFilter, setBrindeFilter] = useState('')
  const [sortBy, setSortBy] = useState<'nome' | 'socio' | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const [incompleteClients, setIncompleteClients] = useState<Client[]>([])

  // FUNÇÃO PARA IDENTIFICAR O QUE FALTA
  const getMissingFields = (client: Client) => {
    const missing: string[] = []
    
    // Campos Obrigatórios
    if (!client.nome) missing.push('Nome')
    if (!client.empresa) missing.push('Empresa')
    if (!client.tipoBrinde) missing.push('Tipo Brinde')
    if (client.tipoBrinde === 'Outro' && !client.outroBrinde) missing.push('Espec. Brinde')
    if (!client.quantidade) missing.push('Qtd')
    if (!client.cep) missing.push('CEP')
    if (!client.endereco) missing.push('Endereço')
    if (!client.numero) missing.push('Número')
    if (!client.bairro) missing.push('Bairro')
    if (!client.cidade) missing.push('Cidade')
    if (!client.estado) missing.push('UF')
    if (!client.email) missing.push('Email')
    if (!client.socio) missing.push('Sócio')
    // Telefone pode ou não ser obrigatório, dependendo da sua regra. 
    // Se for obrigatório, descomente a linha abaixo:
    // if (!client.telefone) missing.push('Telefone')

    return missing
  }

  // BUSCAR DADOS
  const fetchIncompleteClients = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar:', error)
    } else {
      // 1. Converter formato (snake_case -> camelCase)
      const allClients: Client[] = data.map((item: any) => ({
        id: item.id,
        nome: item.nome,
        empresa: item.empresa,
        cargo: item.cargo,
        telefone: item.telefone, // <--- CORREÇÃO AQUI: Adicionado o campo telefone
        tipoBrinde: item.tipo_brinde,
        outroBrinde: item.outro_brinde,
        quantidade: item.quantidade,
        cep: item.cep,
        endereco: item.endereco,
        numero: item.numero,
        complemento: item.complemento,
        bairro: item.bairro,
        cidade: item.cidade,
        estado: item.estado,
        email: item.email,
        socio: item.socio,
        observacoes: item.observacoes
      }))

      // 2. Filtrar apenas os que têm campos faltando
      const incomplete = allClients.filter(c => getMissingFields(c).length > 0)
      setIncompleteClients(incomplete)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchIncompleteClients()
  }, [])

  const uniqueSocios = Array.from(new Set(incompleteClients.map(c => c.socio).filter(Boolean)))
  const uniqueBrindes = Array.from(new Set(incompleteClients.map(c => c.tipoBrinde).filter(Boolean)))

  // Lógica Unificada de Filtro e Sort
  const filteredClients = useMemo(() => {
    let result = incompleteClients.filter(client => {
      const matchesSocio = socioFilter ? client.socio === socioFilter : true
      const matchesBrinde = brindeFilter ? client.tipoBrinde === brindeFilter : true
      return matchesSocio && matchesBrinde
    })

    if (sortBy) {
      result.sort((a, b) => {
        let valA = (sortBy === 'nome' ? a.nome : a.socio) || ''
        let valB = (sortBy === 'nome' ? b.nome : b.socio) || ''
        
        return sortDirection === 'asc' 
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA)
      })
    }

    return result
  }, [incompleteClients, socioFilter, brindeFilter, sortBy, sortDirection])

  const toggleSort = (field: 'nome' | 'socio') => {
    if (sortBy === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortDirection('asc')
    }
  }

  // EDITAR / COMPLETAR (Passado para o Modal)
  const handleSaveClient = async (clientData: ClientData) => {
    const dbData = {
      nome: clientData.nome,
      empresa: clientData.empresa,
      cargo: clientData.cargo,
      telefone: clientData.telefone, // Também salvamos o telefone aqui se for editado
      tipo_brinde: clientData.tipoBrinde,
      outro_brinde: clientData.outroBrinde,
      quantidade: clientData.quantidade,
      cep: clientData.cep,
      endereco: clientData.endereco,
      numero: clientData.numero,
      complemento: clientData.complemento,
      bairro: clientData.bairro,
      cidade: clientData.cidade,
      estado: clientData.estado,
      email: clientData.email,
      socio: clientData.socio,
      observacoes: clientData.observacoes
    }

    try {
      if (clientToEdit) {
        const { error } = await supabase.from('clientes').update(dbData).eq('id', clientToEdit.id)
        if (error) throw error
      }
      await fetchIncompleteClients()
      setIsModalOpen(false)
      setClientToEdit(null)
    } catch (error: any) {
      alert(`Erro ao salvar: ${error.message}`)
    }
  }

  // EXCLUIR
  const confirmDelete = async () => {
    if (clientToDelete) {
      try {
        const { error } = await supabase.from('clientes').delete().eq('id', clientToDelete.id)
        if (error) throw error
        await fetchIncompleteClients()
        setClientToDelete(null)
      } catch (error: any) {
        alert(`Erro ao excluir: ${error.message}`)
      }
    }
  }

  // EXPORTAR XLSX
  const handleExportExcel = () => {
    const dataToExport = filteredClients.map(client => ({
      "Nome": client.nome,
      "Empresa": client.empresa,
      "Cargo": client.cargo,
      "Telefone": client.telefone,
      "Sócio": client.socio,
      "Email": client.email,
      "Cidade": client.cidade,
      "PENDÊNCIAS": getMissingFields(client).join(', ') 
    }))

    const ws = utils.json_to_sheet(dataToExport)
    const wscols = [{ wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 25 }, { wch: 20 }, { wch: 40 }]
    ws['!cols'] = wscols
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, "Clientes Incompletos")
    writeFile(wb, `Incompletos_Salomao_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.xlsx`)
  }

  const handleEdit = (client: Client) => {
    setClientToEdit(client)
    setIsModalOpen(true)
  }

  return (
    <div className="h-full flex flex-col relative">
      
      <NewClientModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setClientToEdit(null); }} 
        onSave={handleSaveClient} 
        clientToEdit={clientToEdit} 
      />

      {clientToDelete && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-scaleIn">
             <div className="flex items-center gap-4 mb-4 text-red-600">
               <div className="bg-red-100 p-3 rounded-full"><AlertTriangle className="h-6 w-6" /></div>
               <h3 className="text-xl font-bold text-gray-900">Excluir Registro?</h3>
             </div>
             <p className="text-gray-600 mb-6">Deseja remover este cadastro incompleto permanentemente?</p>
             <div className="flex justify-end gap-3">
               <button onClick={() => setClientToDelete(null)} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancelar</button>
               <button onClick={confirmDelete} className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2"><Trash2 className="h-4 w-4" /> Excluir</button>
             </div>
          </div>
        </div>
      )}

      {/* HEADER / FILTROS */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
        <div className="flex items-center gap-3 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 px-1">
           {/* Filtro Sócio */}
           <div className="relative group">
             <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Filter className="h-4 w-4" /></div>
             <select value={socioFilter} onChange={(e) => setSocioFilter(e.target.value)} className="appearance-none pl-9 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#112240]/20 min-w-[160px]">
                <option value="">Sócio: Todos</option>
                {uniqueSocios.map(s => <option key={s} value={s}>{s}</option>)}
             </select>
             <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><ChevronDown className="h-4 w-4" /></div>
           </div>

           {/* Filtro Brinde */}
           <div className="relative group">
             <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Filter className="h-4 w-4" /></div>
             <select value={brindeFilter} onChange={(e) => setBrindeFilter(e.target.value)} className="appearance-none pl-9 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#112240]/20 min-w-[160px]">
                <option value="">Brinde: Todos</option>
                {uniqueBrindes.map(b => <option key={b} value={b}>{b}</option>)}
             </select>
             <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><ChevronDown className="h-4 w-4" /></div>
           </div>

           {/* Botões de Ordenação */}
           <div className="flex bg-white border border-gray-200 rounded-lg p-1 gap-1">
              <button onClick={() => toggleSort('nome')} className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${sortBy === 'nome' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}><ArrowUpDown className="h-3 w-3 mr-1" /> Nome</button>
              <button onClick={() => toggleSort('socio')} className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${sortBy === 'socio' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}><ArrowUpDown className="h-3 w-3 mr-1" /> Sócio</button>
           </div>

           {(socioFilter || brindeFilter || sortBy) && (
             <button onClick={() => {setSocioFilter(''); setBrindeFilter(''); setSortBy(null)}} className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center px-2 py-1 bg-red-50 rounded"><X className="h-3 w-3 mr-1" /> Limpar</button>
           )}

           <div className="h-6 w-px bg-gray-300 mx-2 hidden md:block"></div>

           <div className="flex bg-white border border-gray-200 rounded-lg p-1">
              <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-gray-100 text-[#112240]' : 'text-gray-400'}`}><LayoutList className="h-5 w-5" /></button>
              <button onClick={() => setViewMode('card')} className={`p-1.5 rounded-md ${viewMode === 'card' ? 'bg-gray-100 text-[#112240]' : 'text-gray-400'}`}><LayoutGrid className="h-5 w-5" /></button>
           </div>
        </div>

        <div className="flex items-center gap-3 w-full xl:w-auto">
            <button onClick={fetchIncompleteClients} className="p-2.5 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50"><RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} /></button>
            <button onClick={handleExportExcel} className="flex-1 xl:flex-none flex items-center justify-center px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-md flex items-center gap-2"><FileSpreadsheet className="h-5 w-5" /> Exportar Pendentes</button>
        </div>
      </div>

      {/* LISTAGEM */}
      <div className="flex-1 overflow-auto pb-4">
        {!loading && filteredClients.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
            <div className="bg-green-50 p-4 rounded-full mb-3"><AlertCircle className="h-8 w-8 text-green-600" /></div>
            <p className="font-medium text-gray-900">Tudo certo!</p>
            <p className="text-sm">Não há cadastros incompletos no momento.</p>
          </div>
        )}

        {filteredClients.length > 0 && viewMode === 'list' && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-red-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-red-700" onClick={() => toggleSort('nome')}>Cliente {sortBy === 'nome' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-red-700" onClick={() => toggleSort('socio')}>Sócio {sortBy === 'socio' && (sortDirection === 'asc' ? '↑' : '↓')}</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  {/* COLUNA DE PENDÊNCIAS */}
                  <th className="px-6 py-4 text-left text-xs font-bold text-red-600 uppercase tracking-wider">Pendências (Obrigatórias)</th>
                  <th className="relative px-6 py-4"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredClients.map((client) => {
                  const missing = getMissingFields(client)
                  return (
                    <tr key={client.id} className="hover:bg-red-50/10 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900">{client.nome || 'Sem Nome'}</span>
                          <span className="text-xs text-gray-500 font-medium">{client.empresa || '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{client.socio || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.email || '-'}</td>
                      
                      {/* CÉLULA DE PENDÊNCIAS */}
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {missing.map(field => (
                            <span key={field} className="px-2 py-0.5 text-[10px] font-bold uppercase bg-red-100 text-red-700 rounded border border-red-200">
                              {field}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(client)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md" title="Completar Cadastro"><Pencil className="h-4 w-4" /></button>
                          <button onClick={() => { setClientToDelete(client) }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md" title="Excluir"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {filteredClients.length > 0 && viewMode === 'card' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => {
               const missing = getMissingFields(client)
               return (
                <div key={client.id} className="bg-white rounded-xl shadow-sm border border-red-200 p-6 hover:shadow-md transition-all relative group">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center text-red-700 font-bold border border-red-100">!</div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 leading-tight">{client.nome || 'Sem Nome'}</h3>
                        <p className="text-sm text-gray-500">{client.empresa || 'Empresa n/a'}</p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-xs font-bold text-red-600 mb-2 uppercase tracking-wide">Campos Faltantes:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {missing.map(field => (
                        <span key={field} className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded border border-red-100">
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end gap-2">
                      <button onClick={() => handleEdit(client)} className="flex-1 py-2 text-sm text-white bg-[#112240] hover:bg-[#1a3a6c] rounded-lg font-medium transition-colors">Completar</button>
                      <button onClick={() => setClientToDelete(client)} className="py-2 px-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
               )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
