import { useState, useEffect, useRef } from 'react'
import { 
  Search, Upload, Download, Plus, X, 
  MapPin, User, Briefcase, Trash2, Pencil, Save, 
  Users, UserMinus, CheckCircle, UserX
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabase'
import { SearchableSelect } from '../components/SearchableSelect'

// --- TIPOS ---
interface Colaborador {
  id: number;
  nome: string;
  genero: string;
  cep: string;
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  cpf: string;
  data_nascimento: string;
  tipo: string;
  equipe: string;
  local: string;
  lider_equipe: string;
  cargo: string;
  data_admissao: string;
  data_desligamento: string;
  status: string;
}

const ESTADOS_BRASIL = [
  { sigla: 'AC', nome: 'Acre' }, { sigla: 'AL', nome: 'Alagoas' }, { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'AM', nome: 'Amazonas' }, { sigla: 'BA', nome: 'Bahia' }, { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' }, { sigla: 'ES', nome: 'Espírito Santo' }, { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'Maranhão' }, { sigla: 'MT', nome: 'Mato Grosso' }, { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' }, { sigla: 'PA', nome: 'Pará' }, { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PR', nome: 'Paraná' }, { sigla: 'PE', nome: 'Pernambuco' }, { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' }, { sigla: 'RN', nome: 'Rio Grande do Norte' }, { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondônia' }, { sigla: 'RR', nome: 'Roraima' }, { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'São Paulo' }, { sigla: 'SE', nome: 'Sergipe' }, { sigla: 'TO', nome: 'Tocantins' }
];

export function Colaboradores() {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list')
  
  // Estados de Filtro
  const [searchTerm, setSearchTerm] = useState('')
  const [filterLider, setFilterLider] = useState('')
  const [filterLocal, setFilterLocal] = useState('')

  // Estado do Formulário
  const [formData, setFormData] = useState<Partial<Colaborador>>({
    status: 'Ativo',
    estado: 'Rio de Janeiro'
  })

  // Estado para refresh do SearchableSelect
  const [refreshKey, setRefreshKey] = useState(0)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchColaboradores()
  }, [])

  // --- HELPER: CAMEL CASE ---
  const toTitleCase = (str: string) => {
    if (!str) return ''
    return str.toLowerCase().split(' ').map(word => {
      return (word.length > 2) ? word.charAt(0).toUpperCase() + word.slice(1) : word;
    }).join(' ');
  }

  // --- BUSCAS ---
  const fetchColaboradores = async () => {
    setLoading(true)
    const { data } = await supabase.from('colaboradores').select('*').order('nome')
    if (data) setColaboradores(data)
    setLoading(false)
  }

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
    fetchColaboradores()
  }

  // --- MÁSCARAS E VIACEP ---
  const maskCEP = (value: string) => value.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9)
  const maskCPF = (value: string) => value.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1')
  const maskDate = (value: string) => value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})(\d)/, '$1/$2').slice(0, 10)

  const handleCepBlur = async () => {
    const cep = formData.cep?.replace(/\D/g, '')
    if (cep?.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
        const data = await response.json()
        if (!data.erro) {
          const estadoEncontrado = ESTADOS_BRASIL.find(e => e.sigla === data.uf)
          
          setFormData(prev => ({
            ...prev,
            endereco: toTitleCase(data.logradouro),
            bairro: toTitleCase(data.bairro),
            cidade: toTitleCase(data.localidade),
            estado: estadoEncontrado ? estadoEncontrado.nome : data.uf
          })) 
        }
      } catch (error) {
        console.error("Erro CEP:", error)
      }
    }
  }

  // --- CRUD COLABORADOR ---
  const handleSave = async () => {
    if (!formData.nome) return alert('Nome é obrigatório')
    
    const toISODate = (str?: string) => {
      if (!str || str.length !== 10) return null
      const [d, m, y] = str.split('/')
      return `${y}-${m}-${d}`
    }

    const payload = {
      ...formData,
      nome: toTitleCase(formData.nome || ''),
      endereco: toTitleCase(formData.endereco || ''),
      bairro: toTitleCase(formData.bairro || ''),
      cidade: toTitleCase(formData.cidade || ''),
      lider_equipe: toTitleCase(formData.lider_equipe || ''),
      cargo: toTitleCase(formData.cargo || ''),
      data_nascimento: toISODate(formData.data_nascimento),
      data_admissao: toISODate(formData.data_admissao),
      data_desligamento: toISODate(formData.data_desligamento),
    }

    const { error } = formData.id 
      ? await supabase.from('colaboradores').update(payload).eq('id', formData.id)
      : await supabase.from('colaboradores').insert(payload)

    if (error) alert('Erro ao salvar: ' + error.message)
    else {
      setViewMode('list')
      fetchColaboradores()
      setFormData({ status: 'Ativo', estado: 'Rio de Janeiro' })
    }
  }

  const handleEdit = (colab: Colaborador) => {
    const toFormDate = (str?: string) => {
      if (!str) return ''
      const date = new Date(str)
      return new Date(date.valueOf() + date.getTimezoneOffset() * 60000).toLocaleDateString('pt-BR')
    }

    setFormData({
      ...colab,
      data_nascimento: toFormDate(colab.data_nascimento),
      data_admissao: toFormDate(colab.data_admissao),
      data_desligamento: toFormDate(colab.data_desligamento),
    })
    setViewMode('form')
  }

  const handleDelete = async (id: number) => {
    if(!confirm('Excluir colaborador?')) return
    await supabase.from('colaboradores').delete().eq('id', id)
    fetchColaboradores()
  }

  // --- IMPORTAÇÃO / EXPORTAÇÃO ---
  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(colaboradores)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Colaboradores")
    XLSX.writeFile(wb, "colaboradores.xlsx")
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (evt) => {
      const bstr = evt.target?.result
      const wb = XLSX.read(bstr, { type: 'binary' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const data = XLSX.utils.sheet_to_json(ws) as any[]
      
      const formattedData = data.map(row => {
        const normalize = (key: string) => row[key] || row[key.toUpperCase()] || ''
        const processDate = (val: any) => {
            if(typeof val === 'number') {
                const date = new Date(Math.round((val - 25569)*86400*1000));
                return date.toISOString().split('T')[0]
            }
            if(typeof val === 'string' && val.includes('/')) {
                const [d, m, y] = val.split('/')
                return `${y}-${m}-${d}`
            }
            return null
        }

        return {
          nome: toTitleCase(normalize('NOME')),
          genero: toTitleCase(normalize('GÊNERO')),
          cep: normalize('CEP'),
          endereco: toTitleCase(normalize('ENDEREÇO')),
          numero: normalize('NÚMERO'),
          bairro: toTitleCase(normalize('BAIRRO')),
          cidade: toTitleCase(normalize('CIDADE')),
          estado: toTitleCase(normalize('ESTADO')),
          cpf: normalize('CPF'),
          data_nascimento: processDate(normalize('DATA DE NASCIMENTO')),
          tipo: toTitleCase(normalize('TIPO')),
          equipe: toTitleCase(normalize('EQUIPE')),
          local: toTitleCase(normalize('LOCAL')),
          lider_equipe: toTitleCase(normalize('LÍDER DE EQUIPE')),
          cargo: toTitleCase(normalize('CARGO')),
          data_admissao: processDate(normalize('DATA DE ADMISSÃO')),
          data_desligamento: processDate(normalize('DATA DE DESLIGAMENTO')),
          status: normalize('STATUS') || 'Ativo'
        }
      })

      const { error } = await supabase.from('colaboradores').insert(formattedData)
      if (error) alert('Erro na importação: ' + error.message)
      else {
        alert('Importação concluída!')
        fetchColaboradores()
      }
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
    reader.readAsBinaryString(file)
  }

  // --- FILTRAGEM ---
  const filteredData = colaboradores.filter(c => {
    const matchSearch = c.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || c.cpf?.includes(searchTerm)
    const matchLider = filterLider ? c.lider_equipe === filterLider : true
    const matchLocal = filterLocal ? c.local === filterLocal : true
    return matchSearch && matchLider && matchLocal
  })

  const unicosLideres = Array.from(new Set(colaboradores.map(c => c.lider_equipe).filter(Boolean))).sort()
  const unicosLocais = Array.from(new Set(colaboradores.map(c => c.local).filter(Boolean))).sort()

  // KPIs - CORRIGIDO para case-insensitive
  const totalAtivos = colaboradores.filter(c => c.status?.toLowerCase() === 'ativo').length
  const totalDesligados = colaboradores.filter(c => c.status?.toLowerCase() === 'desligado').length
  const totalInativos = colaboradores.filter(c => c.status?.toLowerCase() === 'inativo').length

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* 1. KPI CARDS */}
      {viewMode === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Colaboradores</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{colaboradores.length}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-200 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Ativos</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{totalAtivos}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-200 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Desligados</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{totalDesligados}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-xl">
              <UserMinus className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-300 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Inativos</p>
              <p className="text-3xl font-bold text-gray-600 mt-1">{totalInativos}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-xl">
              <UserX className="h-6 w-6 text-gray-500" />
            </div>
          </div>
        </div>
      )}

      {/* 2. BARRA DE FERRAMENTAS E FILTROS */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 sticky top-4 z-10">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          
          {/* Busca e Filtros */}
          {viewMode === 'list' && (
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto flex-1">
              <div className="relative flex-1 min-w-[280px]">
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Buscar nome ou CPF..." 
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <select 
                className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={filterLider}
                onChange={e => setFilterLider(e.target.value)}
              >
                <option value="">Líderes</option>
                {unicosLideres.map(l => <option key={l} value={l}>{toTitleCase(l)}</option>)}
              </select>
              <select 
                className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={filterLocal}
                onChange={e => setFilterLocal(e.target.value)}
              >
                <option value="">Locais</option>
                {unicosLocais.map(l => <option key={l} value={l}>{toTitleCase(l)}</option>)}
              </select>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex gap-2 w-full lg:w-auto justify-end">
            <input type="file" hidden ref={fileInputRef} accept=".xlsx" onChange={handleImport} />
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 font-bold text-sm transition-colors border border-green-200">
              <Upload className="h-4 w-4" /> Importar
            </button>
            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-bold text-sm transition-colors border border-blue-200">
              <Download className="h-4 w-4" /> Exportar
            </button>
            <button onClick={() => { setFormData({ status: 'Ativo', estado: 'Rio de Janeiro' }); setViewMode('form') }} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-bold text-sm transition-colors shadow-sm">
              <Plus className="h-4 w-4" /> Novo Colaborador
            </button>
          </div>
        </div>
      </div>

      {/* 3. CONTEÚDO PRINCIPAL */}
      {viewMode === 'list' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Colaborador</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Equipe / Cargo</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Local</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredData.map(colab => {
                  const statusLower = colab.status?.toLowerCase() || '';
                  return (
                    <tr key={colab.id} className="hover:bg-blue-50/50 group transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300 flex items-center justify-center text-gray-600 font-bold shadow-sm">
                            {colab.nome?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{toTitleCase(colab.nome)}</p>
                            <p className="text-xs text-gray-500">{colab.cpf}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{toTitleCase(colab.cargo)}</p>
                        <p className="text-xs text-gray-500">{toTitleCase(colab.equipe)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <MapPin className="h-3.5 w-3.5 text-gray-400" />
                          {toTitleCase(colab.local)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          statusLower === 'ativo' ? 'bg-green-50 text-green-700 border-green-200' : 
                          statusLower === 'desligado' ? 'bg-red-50 text-red-700 border-red-200' : 
                          'bg-gray-100 text-gray-600 border-gray-300'
                        }`}>
                          {colab.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-2">
                          <button onClick={() => handleEdit(colab)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Editar">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(colab.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Excluir">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // --- FORMULÁRIO ---
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center mb-8 border-b pb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              {formData.id ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              {formData.id ? 'Editar Colaborador' : 'Novo Colaborador'}
            </h2>
            <button onClick={() => setViewMode('list')} className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="h-6 w-6" /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* DADOS PESSOAIS */}
            <div className="md:col-span-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <User className="h-4 w-4"/> Dados Pessoais
                </h3>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nome Completo</label>
              <input className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={formData.nome || ''} onChange={e => setFormData({...formData, nome: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Gênero</label>
              <select className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={formData.genero || ''} onChange={e => setFormData({...formData, genero: e.target.value})}>
                <option value="">Selecione</option>
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">CPF</label>
              <input className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.cpf || ''} onChange={e => setFormData({...formData, cpf: maskCPF(e.target.value)})} maxLength={14} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Data Nascimento</label>
              <input className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.data_nascimento || ''} onChange={e => setFormData({...formData, data_nascimento: maskDate(e.target.value)})} maxLength={10} placeholder="DD/MM/AAAA" />
            </div>
            
            {/* ENDEREÇO */}
            <div className="md:col-span-3 bg-gray-50 p-3 rounded-lg border border-gray-100 mt-2">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <MapPin className="h-4 w-4"/> Endereço
                </h3>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">CEP</label>
              <input className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.cep || ''} onChange={e => setFormData({...formData, cep: maskCEP(e.target.value)})} onBlur={handleCepBlur} maxLength={9} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Endereço</label>
              <input className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.endereco || ''} onChange={e => setFormData({...formData, endereco: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Número</label>
              <input className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.numero || ''} onChange={e => setFormData({...formData, numero: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Bairro</label>
              <input className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.bairro || ''} onChange={e => setFormData({...formData, bairro: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Cidade</label>
              <input className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.cidade || ''} onChange={e => setFormData({...formData, cidade: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Estado</label>
              <select className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={formData.estado || ''} onChange={e => setFormData({...formData, estado: e.target.value})}>
                {ESTADOS_BRASIL.map(est => <option key={est.sigla} value={est.nome}>{est.nome}</option>)}
              </select>
            </div>

            {/* DADOS DA EMPRESA */}
            <div className="md:col-span-3 bg-gray-50 p-3 rounded-lg border border-gray-100 mt-2">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <Briefcase className="h-4 w-4"/> Dados Corporativos
                </h3>
            </div>

            {/* EQUIPE - COM SEARCHABLE SELECT */}
            <SearchableSelect
              key={`equipe-${refreshKey}`}
              label="Equipe"
              value={formData.equipe || ''}
              onChange={(value) => setFormData({...formData, equipe: value})}
              table="opcoes_equipes"
              nameField="nome"
              placeholder="Selecione uma equipe"
              onRefresh={handleRefresh}
            />

            {/* LOCAL - COM SEARCHABLE SELECT */}
            <SearchableSelect
              key={`local-${refreshKey}`}
              label="Local"
              value={formData.local || ''}
              onChange={(value) => setFormData({...formData, local: value})}
              table="opcoes_locais"
              nameField="nome"
              placeholder="Selecione um local"
              onRefresh={handleRefresh}
            />

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Cargo</label>
              <input className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.cargo || ''} onChange={e => setFormData({...formData, cargo: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Líder de Equipe</label>
              <input className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.lider_equipe || ''} onChange={e => setFormData({...formData, lider_equipe: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Tipo</label>
              <input className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.tipo || ''} onChange={e => setFormData({...formData, tipo: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Status</label>
              <select className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={formData.status || 'Ativo'} onChange={e => setFormData({...formData, status: e.target.value})}>
                <option value="Ativo">Ativo</option>
                <option value="Desligado">Desligado</option>
                <option value="Inativo">Inativo</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Data Admissão</label>
              <input className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.data_admissao || ''} onChange={e => setFormData({...formData, data_admissao: maskDate(e.target.value)})} maxLength={10} placeholder="DD/MM/AAAA" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Data Desligamento</label>
              <input className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.data_desligamento || ''} onChange={e => setFormData({...formData, data_desligamento: maskDate(e.target.value)})} maxLength={10} placeholder="DD/MM/AAAA" />
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-100">
            <button onClick={() => setViewMode('list')} className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors shadow-sm">Cancelar</button>
            <button onClick={handleSave} className="px-6 py-2.5 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 shadow-md transition-colors flex items-center gap-2"><Save className="h-4 w-4"/> Salvar</button>
          </div>
        </div>
      )}
    </div>
  )
}