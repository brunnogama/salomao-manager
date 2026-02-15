// src/components/crm/Clients.tsx
import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import {
  Search,
  Plus,
  Pencil,
  Trash,
  Gift,
  Building2,
  Users,
  Check,
  X,
  ChevronDown
} from 'lucide-react'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { CRMContactModal } from './CRMContactModal'
import { CRMContact, getGiftBadgeColor, getGiftIconColor } from '../../types/crmContact'

interface ClientsProps {
  initialFilters?: { socio?: string; brinde?: string };
  userName?: string;
  onModuleHome?: () => void;
  onLogout?: () => void;
}

interface CompanyRow {
  client: any;
  contacts: CRMContact[];
  contactCount: number;
  giftByType: {
    vip: number;
    medio: number;
    outros: number;
  };
}

export function Clients({
  initialFilters,
}: ClientsProps) {
  /* State */
  const [contacts, setContacts] = useState<CRMContact[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view')
  const [contactToEdit, setContactToEdit] = useState<CRMContact | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<CompanyRow | null>(null)
  const [viewingCompany, setViewingCompany] = useState<CompanyRow | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [filterSocio, setFilterSocio] = useState<string>('')
  const [filterGiftType, setFilterGiftType] = useState<string>('')

  useEffect(() => { fetchContacts() }, [])
  useEffect(() => {
    if (initialFilters?.socio) setFilterSocio(initialFilters.socio)
    if (initialFilters?.brinde) setFilterGiftType(initialFilters.brinde)
  }, [initialFilters])

  const fetchContacts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('client_contacts')
      .select(`
        *,
        client:clients(
          id, name,
          partner:partners(id, name)
        )
      `)
      .order('client(name), name')

    if (error) {
      console.error('Error fetching contacts:', error)
    }

    if (!error && data) {
      setContacts(data as unknown as CRMContact[])
    }

    setLoading(false)
  }

  const handleDeleteCompany = async (company: CompanyRow) => {
    // Delete all contacts of this company
    if (company.client?.id) {
      await supabase.from('client_contacts').delete().eq('client_id', company.client.id)
      setDeleteConfirm(null)
      fetchContacts()
    }
  }

  // Group contacts by company and calculate statistics
  const companyRows = useMemo(() => {
    let filtered = contacts.filter((c: CRMContact) => {
      const matchSearch = !searchTerm ||
        [c.name, c.role, c.client?.name, c.email].some(f =>
          f?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      const matchSocio = !filterSocio || c.client?.partner?.name === filterSocio
      const matchGift = !filterGiftType || c.gift_type === filterGiftType
      return matchSearch && matchSocio && matchGift
    })

    // Group by client and calculate stats
    const grouped = filtered.reduce((acc: any, contact: CRMContact) => {
      const clientId = contact.client?.id || 'no-client'
      if (!acc[clientId]) {
        acc[clientId] = {
          client: contact.client,
          contacts: [],
          contactCount: 0,
          giftByType: {
            vip: 0,
            medio: 0,
            outros: 0
          }
        }
      }
      acc[clientId].contacts.push(contact)
      acc[clientId].contactCount++

      // Count gifts by type
      if (contact.gift_type && contact.gift_type !== 'Não recebe') {
        const qty = contact.gift_quantity || 1
        if (contact.gift_type === 'Brinde VIP') {
          acc[clientId].giftByType.vip += qty
        } else if (contact.gift_type === 'Brinde Médio') {
          acc[clientId].giftByType.medio += qty
        } else {
          // "Outro" and any other types
          acc[clientId].giftByType.outros += qty
        }
      }
      return acc
    }, {} as Record<string, CompanyRow>)

    return Object.values(grouped).sort((a: any, b: any) =>
      (a.client?.name || '').localeCompare(b.client?.name || '')
    )
  }, [contacts, searchTerm, filterSocio, filterGiftType])

  const availableSocios = useMemo(() =>
    Array.from(new Set(contacts.map((c: CRMContact) => c.client?.partner?.name).filter(Boolean))).sort(),
    [contacts]
  )

  const availableGiftTypes = useMemo(() =>
    Array.from(new Set(contacts.map((c: CRMContact) => c.gift_type).filter(Boolean))).sort(),
    [contacts]
  )

  // Calculate gift statistics
  const giftStats = useMemo(() => {
    const stats: Record<string, number> = {}
    contacts.forEach((c: CRMContact) => {
      if (c.gift_type && c.gift_type !== 'Não recebe') {
        const qty = c.gift_quantity || 1
        stats[c.gift_type] = (stats[c.gift_type] || 0) + qty
      }
    })
    return stats
  }, [contacts])

  const totalGifts = useMemo(() =>
    Object.values(giftStats).reduce((sum, count) => sum + count, 0),
    [giftStats]
  )

  return (
    <div className="flex flex-col h-full space-y-6 p-6 bg-gradient-to-br from-gray-50 to-gray-100">
      {/* PAGE HEADER - Matching Dashboard */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg">
            <Gift className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
              Clientes
            </h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">
              Gestão de contatos para distribuição de brindes
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              setModalMode('create')
              setContactToEdit(null)
              setIsModalOpen(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-[#1e3a8a] to-[#112240] hover:from-[#2a4a9a] hover:to-[#213250] text-white rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg hover:shadow-xl active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Novo Contato
          </button>
        </div>
      </div>

      {/* Gift Statistics Cards */}
      <div className="flex flex-wrap gap-4">
        {/* Total Gifts Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col gap-3 flex-1 min-w-[180px] transition-all hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg">
              <Gift className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Total de Brindes</p>
              <p className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none mt-1">{totalGifts}</p>
            </div>
          </div>
        </div>

        {/* Gift Type Cards with matching icon colors */}
        {Object.entries(giftStats)
          .sort((a, b) => b[1] - a[1])
          .map(([tipo, qtd]) => (
            <div
              key={tipo}
              onClick={() => setFilterGiftType(tipo === filterGiftType ? '' : tipo)}
              className={`bg-white p-6 rounded-2xl shadow-sm border-2 flex flex-col gap-3 cursor-pointer hover:shadow-md transition-all flex-1 min-w-[180px] active:scale-95 ${filterGiftType === tipo ? 'border-[#1e3a8a] bg-blue-50' : 'border-gray-200 hover:border-[#1e3a8a]/30'
                }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${getGiftIconColor(tipo)} shadow-lg`}>
                  <Gift className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] line-clamp-1">{tipo}</p>
                  <p className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none mt-1">{qtd}</p>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
        <div className="flex gap-3 items-center flex-wrap">
          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por empresa, sócio, contato..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Sócio Filter */}
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
                        <span>Sócios</span>
                        {filterSocio === '' && <Check className="h-4 w-4 text-[#1e3a8a]" />}
                      </button>
                    )}
                  </Menu.Item>
                  {availableSocios.map((s: any) => (
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

          {/* Brinde Filter */}
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white text-gray-700 hover:bg-gray-50 hover:border-[#1e3a8a]/30 transition-all">
              <Gift className="h-4 w-4" />
              <span>{filterGiftType || 'Brindes'}</span>
            </Menu.Button>
            <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100">
              <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl bg-white shadow-xl border border-gray-200 focus:outline-none z-20 max-h-60 overflow-y-auto custom-scrollbar">
                <div className="p-1.5">
                  <Menu.Item>
                    {({ active }) => (
                      <button onClick={() => setFilterGiftType('')} className={`${active ? 'bg-gray-50' : ''} group flex w-full items-center justify-between px-3 py-2.5 text-xs text-gray-700 rounded-lg font-bold`}>
                        <span>Brindes</span>
                        {filterGiftType === '' && <Check className="h-4 w-4 text-[#1e3a8a]" />}
                      </button>
                    )}
                  </Menu.Item>
                  {availableGiftTypes.map((type: any) => (
                    <Menu.Item key={type}>
                      {({ active }) => (
                        <button onClick={() => setFilterGiftType(type)} className={`${active ? 'bg-gray-50' : ''} group flex w-full items-center justify-between px-3 py-2.5 text-xs text-gray-700 rounded-lg`}>
                          <span className="truncate">{type}</span>
                          {filterGiftType === type && <Check className="h-4 w-4 text-[#1e3a8a]" />}
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                </div>
              </Menu.Items>
            </Transition>
          </Menu>

          {/* Add Clear Filters button which was missing or needs to be adapted? IncompleteClients has it.
           Clients.tsx code I saw earlier didn't seem to have a clear button in the viewed logic,
           Wait, I see `hasActiveFilters` logic isn't there in `Clients.tsx` original code I read.
           Let me check if I should add it.
           The user said: "use o filtro de sócios da pagina Incompletos como paramentro".
           In `IncompleteClients`, there is a clear button.
           I'll add it if there isn't one. The original `Clients.tsx` didn't show a clear button.
           But I should focus on replacing the selects first.
           I will add the clear button if `filterSocio` or `filterGiftType` or `searchTerm` is active.
           But `hasActiveFilters` variable is not defined in `Clients.tsx`.
           I'll define it inside the render or just inline the check.
           */}
          {(filterSocio || filterGiftType) && (
            <button
              onClick={() => { setFilterSocio(''); setFilterGiftType(''); }}
              className="p-2.5 text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-all"
              title="Limpar filtros"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content - Company List Table */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-10">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#1e3a8a]/20 border-t-[#1e3a8a]"></div>
          </div>
        ) : companyRows.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">Nenhuma empresa encontrada</h3>
            <p className="text-gray-500">Adicione contatos para organizar a distribuição de brindes</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Table Header */}
            <div className="bg-gradient-to-r from-[#1e3a8a] to-[#112240] border-b border-gray-200">
              <div className="grid grid-cols-12 gap-4 px-6 py-4">
                <div className="col-span-3">
                  <p className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em]">Empresa</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em]">Sócio</p>
                </div>
                <div className="col-span-1">
                  <p className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em] text-center">Contatos</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em] text-center">Brinde VIP</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em] text-center">Brinde Médio</p>
                </div>
                <div className="col-span-1">
                  <p className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em] text-center">Outros</p>
                </div>
                <div className="col-span-1">
                  <p className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em] text-right">Ações</p>
                </div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-100">
              {companyRows.map((row: CompanyRow, idx: number) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setViewingCompany(row)}
                >
                  {/* Company Name */}
                  <div className="col-span-3 flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-[#1e3a8a] to-[#112240] rounded-lg shadow-sm">
                      <Building2 className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-gray-800">{row.client?.name || 'Sem empresa'}</span>
                  </div>

                  {/* Partner */}
                  <div className="col-span-2 flex items-center">
                    <span className="text-sm text-gray-600 font-semibold">
                      {row.client?.partner?.name || '-'}
                    </span>
                  </div>

                  {/* Contact Count */}
                  <div className="col-span-1 flex items-center justify-center">
                    <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-lg">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-black text-blue-700">{row.contactCount}</span>
                    </div>
                  </div>

                  {/* Brinde VIP Count */}
                  <div className="col-span-2 flex items-center justify-center">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${row.giftByType.vip > 0 ? 'bg-purple-50' : 'bg-gray-50'}`}>
                      <Gift className={`w-4 h-4 ${row.giftByType.vip > 0 ? 'text-purple-600' : 'text-gray-400'}`} />
                      <span className={`text-sm font-black ${row.giftByType.vip > 0 ? 'text-purple-700' : 'text-gray-400'}`}>
                        {row.giftByType.vip}
                      </span>
                    </div>
                  </div>

                  {/* Brinde Médio Count */}
                  <div className="col-span-2 flex items-center justify-center">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${row.giftByType.medio > 0 ? 'bg-blue-50' : 'bg-gray-50'}`}>
                      <Gift className={`w-4 h-4 ${row.giftByType.medio > 0 ? 'text-blue-600' : 'text-gray-400'}`} />
                      <span className={`text-sm font-black ${row.giftByType.medio > 0 ? 'text-blue-700' : 'text-gray-400'}`}>
                        {row.giftByType.medio}
                      </span>
                    </div>
                  </div>

                  {/* Outros Count */}
                  <div className="col-span-1 flex items-center justify-center">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${row.giftByType.outros > 0 ? 'bg-amber-50' : 'bg-gray-50'}`}>
                      <Gift className={`w-4 h-4 ${row.giftByType.outros > 0 ? 'text-amber-600' : 'text-gray-400'}`} />
                      <span className={`text-sm font-black ${row.giftByType.outros > 0 ? 'text-amber-700' : 'text-gray-400'}`}>
                        {row.giftByType.outros}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteConfirm(row)
                      }}
                      className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all"
                      title="Excluir empresa e contatos"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Company View Modal */}
      {viewingCompany && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#1e3a8a] to-[#112240] px-6 py-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/10 rounded-xl">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black">{viewingCompany.client?.name || 'Empresa'}</h3>
                  <p className="text-sm text-white/70 font-medium">
                    Sócio: {viewingCompany.client?.partner?.name || 'Não definido'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingCompany(null)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-6">
                <h4 className="text-sm font-black text-gray-500 uppercase tracking-wide mb-4">
                  Contatos da Empresa ({viewingCompany.contactCount})
                </h4>

                {viewingCompany.contacts.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-semibold">Nenhum contato cadastrado</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {viewingCompany.contacts.map((contact: CRMContact, idx: number) => (
                      <div
                        key={idx}
                        className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-[#1e3a8a]/30 transition-all cursor-pointer group"
                        onClick={() => {
                          setModalMode('view');
                          setContactToEdit(contact);
                          setIsModalOpen(true);
                        }}
                      >
                        <div className="grid grid-cols-12 gap-4 items-center">
                          {/* Contact Info */}
                          <div className="col-span-4">
                            <p className="font-bold text-gray-800 text-base group-hover:text-[#1e3a8a] transition-colors">{contact.name}</p>
                            <p className="text-sm text-gray-500 font-medium">{contact.role || 'Cargo não informado'}</p>
                            {contact.email && (
                              <p className="text-xs text-gray-400 mt-1">{contact.email}</p>
                            )}
                          </div>

                          {/* Gift Type */}
                          <div className="col-span-3">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1">
                              Tipo de Brinde
                            </p>
                            {contact.gift_type ? (
                              <div className="flex items-center gap-2">
                                <div className={`p-2 rounded-lg bg-gradient-to-br ${getGiftIconColor(contact.gift_type)}`}>
                                  <Gift className="w-3 h-3 text-white" />
                                </div>
                                <span className="text-sm font-bold text-gray-700">{contact.gift_type}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </div>

                          {/* Gift Quantity */}
                          <div className="col-span-2 text-center">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1">
                              Quantidade
                            </p>
                            <p className="text-lg font-black text-gray-800">
                              {contact.gift_type === 'Não recebe' ? '-' : (contact.gift_quantity || 1)}
                            </p>
                          </div>

                          {/* Gift Details */}
                          <div className="col-span-3">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1">
                              Observações
                            </p>
                            {contact.gift_type === 'Outro' && contact.gift_other ? (
                              <p className="text-xs font-semibold text-gray-600 line-clamp-2">
                                {contact.gift_other}
                              </p>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2 justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setModalMode('view')
                              setContactToEdit(contact)
                              setIsModalOpen(true)
                            }}
                            className="px-3 py-1.5 text-xs font-bold text-[#1e3a8a] hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1"
                          >
                            <Pencil className="w-3 h-3" />
                            Editar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center">
              <button
                onClick={() => {
                  const newContact: Partial<CRMContact> = {
                    client_id: viewingCompany.client?.id,
                    client: viewingCompany.client
                  }
                  setModalMode('create')
                  setContactToEdit(newContact as CRMContact)
                  setIsModalOpen(true)
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-[#1e3a8a] to-[#112240] hover:from-[#2a4a9a] hover:to-[#213250] text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg hover:shadow-xl active:scale-95"
              >
                <Plus className="h-4 w-4" />
                Adicionar Contato
              </button>
              <button
                onClick={() => setViewingCompany(null)}
                className="px-6 py-2 text-sm font-bold text-gray-600 hover:text-gray-800 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CRM Contact Modal */}
      <CRMContactModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        contact={contactToEdit || undefined}
        initialMode={modalMode}
        onSave={() => {
          setIsModalOpen(false);
          setViewingCompany(null); // Close company modal to avoid stale data
          fetchContacts();
        }}
      />

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 text-white">
              <h3 className="text-lg font-black">Confirmar Exclusão</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Tem certeza que deseja excluir a empresa <strong>{deleteConfirm.client?.name}</strong>?
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800 font-semibold">
                  ⚠️ Isso excluirá <strong>{deleteConfirm.contactCount} contato(s)</strong> vinculado(s) a esta empresa.
                </p>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteCompany(deleteConfirm)}
                className="px-6 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg"
              >
                Excluir Empresa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}