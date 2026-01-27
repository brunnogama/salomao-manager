import { useState, useEffect, useRef } from 'react'
import { 
  Search, Filter, Upload, Download, Plus, X, 
  MapPin, User, Briefcase, Calendar, Trash2, Pencil, Save
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabase'

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

interface GenericOption {
  id: number;
  nome: string;
}

const ESTADOS_BRASIL = [
  'Acre', 'Alagoas', 'Amapá', 'Amazonas', 'Bahia', 'Ceará', 'Distrito Federal', 
  'Espírito Santo', 'Goiás', 'Maranhão', 'Mato Grosso', 'Mato Grosso do Sul', 
  'Minas Gerais', 'Pará', 'Paraíba', 'Paraná', 'Pernambuco', 'Piauí', 
  'Rio de Janeiro', 'Rio Grande do Norte', 'Rio Grande do Sul', 'Rondônia', 
  'Roraima', 'Santa Catarina', 'São Paulo', 'Sergipe', 'Tocantins'
];

export function Colaboradores() {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list')
  
  // Estados de Filtro
  const [searchTerm, setSearchTerm] = useState('')
  const [filterLider, setFilterLider] = useState('')
  const [filterLocal, setFilterLocal] = useState('')

  // Estados de Opções Dinâmicas
  const [equipes, setEquipes] = useState<GenericOption[]>([])
  const [locais, setLocais] = useState<GenericOption[]>([])
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<'equipes' | 'locais' | null>(null)
  const [newOptionValue, setNewOptionValue] = useState('')

  // Estado do Formulário
  const [formData, setFormData] = useState<Partial<Colaborador>>({
    status: 'Ativo',
    estado: 'Rio de Janeiro'
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchColaboradores()
    fetchOptions()
  }, [])

  // --- BUSCAS ---
  const fetchColaboradores = async () => {
    setLoading(true)
    const { data } = await supabase.from('colaboradores').select('*').order('nome')
    if (data) setColaboradores(data)
    setLoading(false)
  }

  const fetchOptions = async () => {
    const { data: eq } = await supabase.from('opcoes_equipes').select('*').order('nome')
    const { data: lo } = await supabase.from('opcoes_locais').select('*').order('nome')
    if (eq) setEquipes(eq)
    if (lo) setLocais(lo)
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
          // Converter sigla UF para nome completo (básico)
          // Para produção ideal usar um map completo, aqui simplificando ou mantendo o que vier se o user ajustar
          const estadoExtenso = ESTADOS_BRASIL.find(e => e.includes(data.uf)) || data.uf
          
          setFormData(prev => ({
            ...prev,
            endereco: data.logradouro,
            bairro: data.bairro,
            cidade: data.localidade,
            estado: data.est
          })) // Nota: ViaCEP retorna UF (RJ), o formulário pede extenso. O usuário pode ajustar no dropdown.
        }
      } catch (error) {
        console.error("Erro CEP:", error)
      }
    }
  }

  // --- CRUD COLABORADOR ---
  const handleSave = async () => {
    if (!formData.nome) return alert('Nome é obrigatório')
    
    // Converter datas DD/MM/YYYY para YYYY-MM-DD para o banco (se necessário) ou salvar como string se o banco for text.
    // O SQL criado usa DATE. Precisamos converter.
    const toISODate = (str?: string) => {
      if (!str || str.length !== 10) return null
      const [d, m, y] = str.split('/')
      return `${y}-${m}-${d}`
    }

    const payload = {
      ...formData,
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
      setFormData({})
    }
  }

  const handleEdit = (colab: Colaborador) => {
    // Converter data YYYY-MM-DD do banco para DD/MM/YYYY do form
    const toFormDate = (str?: string) => {
      if (!str) return ''
      const date = new Date(str)
      return date.toLocaleDateString('pt-BR')
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

  // --- GESTÃO DE OPÇÕES (EQUIPES/LOCAIS) ---
  const handleAddOption = async () => {
    if (!newOptionValue) return
    const table = isConfigModalOpen === 'equipes' ? 'opcoes_equipes' : 'opcoes_locais'
    await supabase.from(table).insert({ nome: newOptionValue })
    setNewOptionValue('')
    fetchOptions()
  }

  const handleDeleteOption = async (id: number, type: 'equipes' | 'locais') => {
    const table = type === 'equipes' ? 'opcoes_equipes' : 'opcoes_locais'
    await supabase.from(table).delete().eq('id', id)
    fetchOptions()
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
      const wsname = wb.SheetNames[0]
      const ws = wb.Sheets[wsname]
      const data = XLSX.utils.sheet_to_json(ws) as any[]
      
      // Mapeamento simples (assumindo que as colunas do Excel batem com as chaves do banco ou nomes)
      // Ajuste conforme necessário. O prompt diz "colunas possuem exatamente os mesmo nomes".
      // Vamos normalizar chaves para lowercase para garantir.
      
      const formattedData = data.map(row => {
        const normalize = (key: string) => row[key] || row[key.toUpperCase()] || row[key.toLowerCase()] || ''
        
        // Função auxiliar para converter Excel date serial number se necessário, ou string
        // Assumindo string DD/MM/YYYY vindo do excel ou texto
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
          nome: normalize('NOME'),
          genero: normalize('GÊNERO') || normalize('GENERO'),
          cep: normalize('CEP'),
          endereco: normalize('ENDEREÇO') || normalize('ENDERECO'),
          numero: normalize('NÚMERO') || normalize('NUMERO'),
          bairro: normalize('BAIRRO'),
          cidade: normalize('CIDADE'),
          estado: normalize('ESTADO'),
          cpf: normalize('CPF'),
          data_nascimento: processDate(normalize('DATA DE NASCIMENTO')),
          tipo: normalize('TIPO'),
          equipe: normalize('EQUIPE'),
          local: normalize('LOCAL'),
          lider_equipe: normalize('LÍDER DE EQUIPE') || normalize('LIDER'),
          cargo: normalize('CARGO'),
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

  // Listas únicas para filtros
  const unicosLideres = Array.from(new Set(colaboradores.map(c => c.lider_equipe).filter(Boolean)))
  const unicosLocais = Array.from(new Set(colaboradores.map(c => c.local).filter(Boolean)))

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* HEADER E FILTROS */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Colaboradores</h1>
            <p className="text-sm text-gray-500">Gestão completa de quadro de funcionários</p>
          </div>
          <div className="flex gap-2">
            <input type="file" hidden ref={fileInputRef} accept=".xlsx" onChange={handleImport} />
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 font-medium text-sm transition-colors">
              <Upload className="h-4 w-4" /> Importar
            </button>
            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium text-sm transition-colors">
              <Download className="h-4 w-4" /> Exportar
            </button>
            <button onClick={() => { setFormData({}); setViewMode('form') }} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium text-sm transition-colors">
              <Plus className="h-4 w-4" /> Novo Colaborador
            </button>
          </div>
        </div>

        {viewMode === 'list' && (
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Buscar por nome ou CPF..." 
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
              value={filterLider}
              onChange={e => setFilterLider(e.target.value)}
            >
              <option value="">Todos os Líderes</option>
              {unicosLideres.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <select 
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
              value={filterLocal}
              onChange={e => setFilterLocal(e.target.value)}
            >
              <option value="">Todos os Locais</option>
              {unicosLocais.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* CONTEÚDO: LISTA OU FORMULÁRIO */}
      {viewMode === 'list' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Colaborador</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Equipe/Cargo</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Local</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredData.map(colab => (
                  <tr key={colab.id} className="hover:bg-gray-50 group transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">
                          {colab.nome?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{colab.nome}</p>
                          <p className="text-xs text-gray-500">{colab.email || colab.cpf}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{colab.cargo}</p>
                      <p className="text-xs text-gray-500">{colab.equipe}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        <MapPin className="h-3 w-3" /> {colab.local}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        colab.status === 'Ativo' ? 'bg-green-100 text-green-700' : 
                        colab.status === 'Desligado' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {colab.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleEdit(colab)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(colab.id)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors ml-2"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
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
            <button onClick={() => setViewMode('list')} className="text-gray-500 hover:text-gray-700"><X className="h-6 w-6" /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* DADOS PESSOAIS */}
            <div className="md:col-span-3"><h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-4 flex items-center gap-2"><User className="h-4 w-4"/> Dados Pessoais</h3></div>
            
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nome Completo</label>
              <input className="w-full border border-gray-300 rounded p-2" value={formData.nome || ''} onChange={e => setFormData({...formData, nome: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Gênero</label>
              <select className="w-full border border-gray-300 rounded p-2" value={formData.genero || ''} onChange={e => setFormData({...formData, genero: e.target.value})}>
                <option value="">Selecione</option>
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">CPF</label>
              <input className="w-full border border-gray-300 rounded p-2" value={formData.cpf || ''} onChange={e => setFormData({...formData, cpf: maskCPF(e.target.value)})} maxLength={14} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Data Nascimento</label>
              <input className="w-full border border-gray-300 rounded p-2" value={formData.data_nascimento || ''} onChange={e => setFormData({...formData, data_nascimento: maskDate(e.target.value)})} maxLength={10} placeholder="DD/MM/AAAA" />
            </div>
            
            {/* ENDEREÇO */}
            <div className="md:col-span-3 mt-4"><h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-4 flex items-center gap-2"><MapPin className="h-4 w-4"/> Endereço</h3></div>
            
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">CEP</label>
              <input className="w-full border border-gray-300 rounded p-2" value={formData.cep || ''} onChange={e => setFormData({...formData, cep: maskCEP(e.target.value)})} onBlur={handleCepBlur} maxLength={9} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Endereço</label>
              <input className="w-full border border-gray-300 rounded p-2" value={formData.endereco || ''} onChange={e => setFormData({...formData, endereco: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Número</label>
              <input className="w-full border border-gray-300 rounded p-2" value={formData.numero || ''} onChange={e => setFormData({...formData, numero: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Bairro</label>
              <input className="w-full border border-gray-300 rounded p-2" value={formData.bairro || ''} onChange={e => setFormData({...formData, bairro: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Cidade</label>
              <input className="w-full border border-gray-300 rounded p-2" value={formData.cidade || ''} onChange={e => setFormData({...formData, cidade: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Estado</label>
              <select className="w-full border border-gray-300 rounded p-2" value={formData.estado || ''} onChange={e => setFormData({...formData, estado: e.target.value})}>
                {ESTADOS_BRASIL.map(uf => <option key={uf} value={uf}>{uf}</option>)}
              </select>
            </div>

            {/* DADOS DA EMPRESA */}
            <div className="md:col-span-3 mt-4"><h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-4 flex items-center gap-2"><Briefcase className="h-4 w-4"/> Dados da Empresa</h3></div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1 flex justify-between">
                Equipe
                <button onClick={() => setIsConfigModalOpen('equipes')} className="text-blue-600 hover:underline text-[10px]">Gerenciar</button>
              </label>
              <select className="w-full border border-gray-300 rounded p-2" value={formData.equipe || ''} onChange={e => setFormData({...formData, equipe: e.target.value})}>
                <option value="">Selecione</option>
                {equipes.map(e => <option key={e.id} value={e.nome}>{e.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1 flex justify-between">
                Local
                <button onClick={() => setIsConfigModalOpen('locais')} className="text-blue-600 hover:underline text-[10px]">Gerenciar</button>
              </label>
              <select className="w-full border border-gray-300 rounded p-2" value={formData.local || ''} onChange={e => setFormData({...formData, local: e.target.value})}>
                <option value="">Selecione</option>
                {locais.map(l => <option key={l.id} value={l.nome}>{l.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Cargo</label>
              <input className="w-full border border-gray-300 rounded p-2" value={formData.cargo || ''} onChange={e => setFormData({...formData, cargo: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Líder de Equipe</label>
              <input className="w-full border border-gray-300 rounded p-2" value={formData.lider_equipe || ''} onChange={e => setFormData({...formData, lider_equipe: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Tipo</label>
              <input className="w-full border border-gray-300 rounded p-2" value={formData.tipo || ''} onChange={e => setFormData({...formData, tipo: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Status</label>
              <select className="w-full border border-gray-300 rounded p-2" value={formData.status || 'Ativo'} onChange={e => setFormData({...formData, status: e.target.value})}>
                <option value="Ativo">Ativo</option>
                <option value="Desligado">Desligado</option>
                <option value="Inativo">Inativo</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Data Admissão</label>
              <input className="w-full border border-gray-300 rounded p-2" value={formData.data_admissao || ''} onChange={e => setFormData({...formData, data_admissao: maskDate(e.target.value)})} maxLength={10} placeholder="DD/MM/AAAA" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Data Desligamento</label>
              <input className="w-full border border-gray-300 rounded p-2" value={formData.data_desligamento || ''} onChange={e => setFormData({...formData, data_desligamento: maskDate(e.target.value)})} maxLength={10} placeholder="DD/MM/AAAA" />
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
            <button onClick={() => setViewMode('list')} className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors">Cancelar</button>
            <button onClick={handleSave} className="px-6 py-2.5 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 shadow-md transition-colors flex items-center gap-2"><Save className="h-4 w-4"/> Salvar Colaborador</button>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIGURAÇÃO (EQUIPES/LOCAIS) */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Gerenciar {isConfigModalOpen === 'equipes' ? 'Equipes' : 'Locais'}</h3>
              <button onClick={() => setIsConfigModalOpen(null)}><X className="h-5 w-5 text-gray-500"/></button>
            </div>
            
            <div className="flex gap-2 mb-4">
              <input 
                className="flex-1 border border-gray-300 rounded p-2 text-sm" 
                placeholder="Novo item..."
                value={newOptionValue}
                onChange={e => setNewOptionValue(e.target.value)}
              />
              <button onClick={handleAddOption} className="bg-blue-600 text-white p-2 rounded"><Plus className="h-4 w-4"/></button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {(isConfigModalOpen === 'equipes' ? equipes : locais).map(opt => (
                <div key={opt.id} className="flex justify-between items-center bg-gray-50 p-2 rounded border">
                  <span className="text-sm">{opt.nome}</span>
                  <button onClick={() => handleDeleteOption(opt.id, isConfigModalOpen as any)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 className="h-4 w-4"/></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}