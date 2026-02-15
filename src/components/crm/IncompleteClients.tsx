import { useEffect, useState, useMemo, Fragment } from 'react'
import { supabase } from '../../lib/supabase'
import {
  CheckCircle, Pencil, Search, X,
  Check, FileSpreadsheet, Users,
  AlertTriangle, UserCircle,
  Grid, LogOut, Building2
} from 'lucide-react'
import { Menu, Transition } from '@headlessui/react'
import { CRMContactModal } from './CRMContactModal'
import { CRMContact } from '../../types/crmContact'
import * as XLSX from 'xlsx'

interface IncompleteClientsProps {
  userName?: string;
  onModuleHome?: () => void;
  onLogout?: () => void;
}

export function IncompleteClients({
  userName = 'Usuário',
  onModuleHome,
  onLogout
}: IncompleteClientsProps) {
  const [contacts, setContacts] = useState<CRMContact[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [contactToEdit, setContactToEdit] = useState<CRMContact | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [filterSocio, setFilterSocio] = useState<string>('')
  const [sortOrder] = useState<'name' | 'client' | 'socio'>('client')

  const [availableSocios, setAvailableSocios] = useState<string[]>([])

  const REQUIRED_FIELDS = [
    { key: 'email', label: 'E-mail' },
    { key: 'phone', label: 'Telefone' },
    { key: 'zip_code', label: 'CEP' },
    { key: 'address', label: 'Logradouro' },
    { key: 'address_number', label: 'Número' },
    { key: 'neighborhood', label: 'Bairro' },
    { key: 'city', label: 'Cidade' },
    { key: 'uf', label: 'Estado' },
    { key: 'gift_type', label: 'Tipo de Brinde' }
  ]

  const fetchIncompleteContacts = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('client_contacts')
        .select(`
          *,
          client:clients(
            id, name,
            partner:partners(id, name),
            contracts(status)
          )
        `)

      if (data) {
        // Filter contacts from clients with active contracts (active, proposal, probono)
        const contactsWithActiveContracts = data.filter((c: any) => {
          const contracts = c.client?.contracts || []
          return contracts.some((contractByClient: any) =>
            ['active', 'proposal', 'probono'].includes(contractByClient.status)
          )
        })

        const incomplete = contactsWithActiveContracts.filter((c: any) => {
          const ignored = c.ignored_fields || []

          const hasMissing = REQUIRED_FIELDS.some(field => {
            const value = c[field.key]
            const isEmpty = !value || value.toString().trim() === '' || (field.key === 'uf' && (value === 'Selecione' || value === ''))
            const isIgnored = ignored.includes(field.label)
            return isEmpty && !isIgnored
          })

          return hasMissing
        })
        setContacts(incomplete)

        const socios = Array.from(new Set(data.map((c: any) => c.client?.partner?.name).filter(Boolean))) as string[]
        setAvailableSocios(socios.sort())
      }
    } catch (err) {
      console.error("Erro ao buscar contatos incompletos:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIncompleteContacts()
  }, [])

  const processedContacts = useMemo(() => {
    let result = [...contacts]

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase()
      result = result.filter(c =>
        (c.name?.toLowerCase() || '').includes(lowerTerm) ||
        (c.client?.name?.toLowerCase() || '').includes(lowerTerm) ||
        (c.email?.toLowerCase() || '').includes(lowerTerm) ||
        (c.client?.partner?.name?.toLowerCase() || '').includes(lowerTerm)
      )
    }

    if (filterSocio) {
      result = result.filter(c => c.client?.partner?.name === filterSocio)
    }

    result.sort((a: any, b: any) => {
      if (sortOrder === 'name') return (a.name || '').localeCompare(b.name || '')
      if (sortOrder === 'client') return (a.client?.name || '').localeCompare(b.client?.name || '')
      if (sortOrder === 'socio') return (a.client?.partner?.name || '').localeCompare(b.client?.partner?.name || '')
      return 0
    })

    return result
  }, [contacts, searchTerm, filterSocio, sortOrder])

  const handleEdit = (contact: CRMContact) => {
    setContactToEdit(contact)
    setIsModalOpen(true)
  }

  const handleIgnore = async (contact: any) => {
    if (!confirm("Deseja desconsiderar este contato dos incompletos?")) return;

    const missingFields = REQUIRED_FIELDS
      .filter(field => {
        const val = contact[field.key]
        return !val || val.toString().trim() === '' || (field.key === 'uf' && (val === 'Selecione' || val === ''))
      })
      .map(field => field.label);

    const currentIgnored = contact.ignored_fields || [];
    const newIgnored = [...new Set([...currentIgnored, ...missingFields])];

    const { error } = await supabase
      .from('client_contacts')
      .update({ ignored_fields: newIgnored })
      .eq('id', contact.id);

    if (!error) fetchIncompleteContacts();
    else alert('Erro ao desconsiderar: ' + error.message);
  }

  const handleExport = () => {
    const exportData = processedContacts.map(c => {
      const missing = REQUIRED_FIELDS
        .filter(f => {
          const val = c[f.key as keyof CRMContact] as string
          const isEmpty = !val || val.toString().trim() === '' || (f.key === 'uf' && (val === 'Selecione' || val === ''))
          return isEmpty && !(c.ignored_fields || []).includes(f.label)
        })
        .map(f => f.label)

      return {
        'Nome (Contato)': c.name,
        'Nome Cliente': c.client?.name,
        'Sócio Responsável': c.client?.partner?.name,
        'Campos Faltantes': missing.join(', '),
        'Qde de campos vazios': missing.length
      }
    })

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Contatos Incompletos");
    XLSX.writeFile(wb, "contatos_incompletos.xlsx");
  }

  const hasActiveFilters = searchTerm !== '' || filterSocio !== '';

  const clearFilters = () => {
    setSearchTerm('');
    setFilterSocio('');
  }

  if (loading) return (
    <div className="flex justify-center items-center h-full">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1e3a8a]"></div>
    </div>
  )

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 p-6 space-y-6">

      {/* PAGE HEADER */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg">
            <AlertTriangle className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
              Incompletos
            </h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">
              <span className="text-red-600 font-black">{processedContacts.length}</span> {processedContacts.length === 1 ? 'contato pendente' : 'contatos pendentes'}
            </p>
          </div>
        </div>

        {/* User Actions - Moved from toolbar */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg hover:bg-emerald-700 active:scale-95"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Exportar XLSX
          </button>
        </div>
      </div>

      {/* TOOLBAR & FILTERS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap items-center gap-3">

          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, cliente ou e-mail..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white transition-all font-medium"
            />
          </div>

          <div className="flex items-center gap-2">
            <Menu as="div" className="relative">
              <Menu.Button className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white text-gray-700 hover:bg-gray-50 hover:border-[#1e3a8a]/30 transition-all">
                <Users className="h-4 w-4" />
                <span>{filterSocio || 'Sócios'}</span>
              </Menu.Button>
              <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100">
                <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl bg-white shadow-xl border border-gray-200 focus:outline-none z-20 max-h-60 overflow-y-auto custom-scrollbar">
                  <div className="p-1.5">
                    <Menu.Item>
                      {({ active }) => (
                        <button onClick={() => setFilterSocio('')} className={`${active ? 'bg-gray-50' : ''} group flex w-full items-center justify-between px-3 py-2.5 text-xs text-gray-700 rounded-lg font-bold`}>
                          <span>Todos os Sócios</span>
                          {filterSocio === '' && <Check className="h-4 w-4 text-[#1e3a8a]" />}
                        </button>
                      )}
                    </Menu.Item>
                    {availableSocios.map((s) => (
                      <Menu.Item key={s}>
                        {({ active }) => (
                          <button onClick={() => setFilterSocio(s)} className={`${active ? 'bg-gray-50' : ''} group flex w-full items-center justify-between px-3 py-2.5 text-xs text-gray-700 rounded-lg`}>
                            <span className="truncate">{s}</span>
                            {filterSocio === s && <Check className="h-4 w-4 text-[#1e3a8a]" />}
                          </button>
                        )}
                      </Menu.Item>
                    ))}
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>

            {/* Export button moved to header */}

            {hasActiveFilters && (
              <button onClick={clearFilters} className="p-2.5 text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-all">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TABLE - Focus on Contacts */}
      <div className="flex-1 overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col">
        <div className="overflow-x-auto overflow-y-auto custom-scrollbar flex-1 text-[#0a192f]">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gradient-to-r from-[#1e3a8a] to-[#112240] text-white">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Cliente</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Contato</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Sócio Responsável</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-center">Campos Vazios</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {processedContacts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <CheckCircle className="h-16 w-16 mb-4 text-green-500" />
                      <p className="font-black text-xl text-[#0a192f]">Tudo em dia!</p>
                      <p className="text-sm text-gray-500">Nenhum contato pendente encontrado.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                processedContacts.map((contact: any) => {
                  const missing = REQUIRED_FIELDS
                    .filter(f => {
                      const val = contact[f.key]
                      const isEmpty = !val || val.toString().trim() === '' || (f.key === 'uf' && (val === 'Selecione' || val === ''))
                      return isEmpty && !(contact.ignored_fields || []).includes(f.label)
                    })
                    .map(f => f.label)

                  return (
                    <tr key={contact.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-300" />
                          <span className="text-sm font-semibold text-gray-600">{contact.client?.name || 'Sem Cliente'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 font-black text-sm">
                            {contact.name ? contact.name[0].toUpperCase() : '?'}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-[#0a192f]">{contact.name || 'Sem Nome'}</p>
                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{contact.role || 'Sem Cargo'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <UserCircle className="h-4 w-4 text-gray-300" />
                          <span className="text-sm font-semibold text-gray-600">{contact.client?.partner?.name || 'Sem Sócio'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center justify-center px-3 py-1 bg-red-50 text-red-700 rounded-full border border-red-100">
                          <span className="text-sm font-black">{missing.length}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleIgnore(contact)}
                            className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                          >
                            Desconsiderar
                          </button>
                          <button
                            onClick={() => handleEdit(contact)}
                            className="flex items-center gap-2 px-4 py-2 bg-[#1e3a8a] text-white text-[9px] font-black rounded-lg hover:bg-[#112240] shadow-md transition-all active:scale-95 uppercase tracking-widest"
                          >
                            <Pencil className="h-3 w-3" />
                            Editar
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CRMContactModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        contact={contactToEdit || undefined}
        onSave={() => { setIsModalOpen(false); fetchIncompleteContacts(); }}
        initialMode="view"
      />
    </div>
  )
}