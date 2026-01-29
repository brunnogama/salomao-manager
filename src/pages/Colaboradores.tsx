// Caminho: src/pages/Colaboradores.tsx

import { useState, useEffect, useRef } from 'react'
import { 
  Search, Upload, Download, Plus, X, 
  MapPin, User, Briefcase, Trash2, Pencil, Save, 
  Users, UserMinus, CheckCircle, UserX, Calendar, Building2, Camera, Image, Mail
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabase'
import { SearchableSelect } from '../components/SearchableSelect'

// --- TIPOS ---
interface Colaborador {
  id: number;
  nome: string;
  email?: string;
  genero: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
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
  foto_url?: string;
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
  const [selectedColaborador, setSelectedColaborador] = useState<Colaborador | null>(null)
    
  // Estados de Filtro
  const [searchTerm, setSearchTerm] = useState('')
  const [filterLider, setFilterLider] = useState('')
  const [filterLocal, setFilterLocal] = useState('')

  // Estado do Formulário
  const [formData, setFormData] = useState<Partial<Colaborador>>({
    status: 'Ativo',
    estado: 'Rio de Janeiro'
  })

  // Estado para upload de foto
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  // Estado para refresh do SearchableSelect
  const [refreshKey, setRefreshKey] = useState(0)

  // Estado para visualização da foto em tamanho real
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchColaboradores()
  }, [])

  // Efeito para fechar modais com ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (viewingPhoto) {
          setViewingPhoto(null)
        } else if (selectedColaborador) {
          setSelectedColaborador(null)
        }
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [viewingPhoto, selectedColaborador])

  // --- HELPER: CAMEL CASE ---
  const toTitleCase = (str: string) => {
    if (!str) return ''
    return str.toLowerCase().split(' ').map(word => {
      return (word.length > 2) ? word.charAt(0).toUpperCase() + word.slice(1) : word;
    }).join(' ');
  }

  const formatDateDisplay = (str?: string) => {
    if (!str) return '-'
    const date = new Date(str)
    return new Date(date.valueOf() + date.getTimezoneOffset() * 60000).toLocaleDateString('pt-BR')
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

  // --- UPLOAD DE FOTO ---
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validação do tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem')
      return
    }

    // Validação do tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB')
      return
    }

    // Criar preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const uploadPhoto = async (file: File, colaboradorId: number): Promise<string | null> => {
    try {
      setUploadingPhoto(true)

      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop()
      const fileName = `${colaboradorId}_${Date.now()}.${fileExt}`
      const filePath = `colaboradores/${fileName}`

      // Upload para o Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('fotos-colaboradores')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('fotos-colaboradores')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error)
      alert('Erro ao fazer upload da foto')
      return null
    } finally {
      setUploadingPhoto(false)
    }
  }

  const deleteFoto = async (fotoUrl: string) => {
    try {
      // Extrair o caminho do arquivo da URL
      const urlParts = fotoUrl.split('/fotos-colaboradores/')
      if (urlParts.length < 2) return

      const filePath = urlParts[1]

      // Deletar do storage
      const { error } = await supabase.storage
        .from('fotos-colaboradores')
        .remove([`colaboradores/${filePath}`])

      if (error) throw error
    } catch (error) {
      console.error('Erro ao deletar foto:', error)
    }
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

    let fotoUrl = formData.foto_url

    // Se houver uma nova foto selecionada, fazer upload
    if (photoPreview && photoInputRef.current?.files?.[0]) {
      const file = photoInputRef.current.files[0]
      
      // Se está editando e já tem foto, deletar a antiga
      if (formData.id && formData.foto_url) {
        await deleteFoto(formData.foto_url)
      }

      // Upload da nova foto
      const tempId = formData.id || Date.now()
      fotoUrl = await uploadPhoto(file, tempId)
    }

    const payload = {
      ...formData,
      nome: toTitleCase(formData.nome || ''),
      email: formData.email?.toLowerCase() || '',
      endereco: toTitleCase(formData.endereco || ''),
      complemento: toTitleCase(formData.complemento || ''),
      bairro: toTitleCase(formData.bairro || ''),
      cidade: toTitleCase(formData.cidade || ''),
      lider_equipe: toTitleCase(formData.lider_equipe || ''),
      cargo: toTitleCase(formData.cargo || ''),
      data_nascimento: toISODate(formData.data_nascimento),
      data_admissao: toISODate(formData.data_admissao),
      data_desligamento: toISODate(formData.data_desligamento),
      foto_url: fotoUrl
    }

    const { error } = formData.id 
      ? await supabase.from('colaboradores').update(payload).eq('id', formData.id)
      : await supabase.from('colaboradores').insert(payload)

    if (error) alert('Erro ao salvar: ' + error.message)
    else {
      setViewMode('list')
      fetchColaboradores()
      setFormData({ status: 'Ativo', estado: 'Rio de Janeiro' })
      setPhotoPreview(null)
      if (photoInputRef.current) photoInputRef.current.value = ''
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
    setPhotoPreview(colab.foto_url || null)
    setViewMode('form')
    setSelectedColaborador(null) 
  }

  const handleDelete = async (id: number) => {
    if(!confirm('Excluir colaborador?')) return
    
    // Buscar colaborador para deletar foto se existir
    const colab = colaboradores.find(c => c.id === id)
    if (colab?.foto_url) {
      await deleteFoto(colab.foto_url)
    }
    
    await supabase.from('colaboradores').delete().eq('id', id)
    fetchColaboradores()
    setSelectedColaborador(null)
  }

  const handleRemovePhoto = () => {
    setPhotoPreview(null)
    if (photoInputRef.current) photoInputRef.current.value = ''
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
          email: normalize('EMAIL') || normalize('E-MAIL'),
          genero: toTitleCase(normalize('GÊNERO')),
          cep: normalize('CEP'),
          endereco: toTitleCase(normalize('ENDEREÇO')),
          numero: normalize('NÚMERO'),
          complemento: normalize('COMPLEMENTO'),
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
    
    const matchLider = filterLider 
        ? c.lider_equipe?.toLowerCase() === filterLider.toLowerCase() 
        : true;
        
    const matchLocal = filterLocal 
        ? c.local?.toLowerCase() === filterLocal.toLowerCase() 
        : true;
        
    return matchSearch && matchLider && matchLocal
  })

  // Funções de Limpeza de Filtro
  const hasActiveFilters = searchTerm !== '' || filterLider !== '' || filterLocal !== ''
    
  const clearFilters = () => {
    setSearchTerm('')
    setFilterLider('')
    setFilterLocal('')
  }

  const unicosLideres = Array.from(new Set(colaboradores.map(c => c.lider_equipe).filter(Boolean))).sort()
  const unicosLocais = Array.from(new Set(colaboradores.map(c => c.local).filter(Boolean))).sort()

  // KPIs
  const totalAtivos = colaboradores.filter(c => c.status?.toLowerCase() === 'ativo').length
  const totalDesligados = colaboradores.filter(c => c.status?.toLowerCase() === 'desligado').length
  const totalInativos = colaboradores.filter(c => c.status?.toLowerCase() === 'inativo').length

  // Helper para renderizar campo no modal
  const DetailItem = ({ label, value, icon: Icon, className }: { label: string, value?: string | number, icon?: any, className?: string }) => (
    <div className={`bg-gray-50 p-3 rounded-lg border border-gray-100 ${className}`}>
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon className="h-3.5 w-3.5 text-gray-400" />}
        <p className="text-xs font-bold text-gray-500 uppercase">{label}</p>
      </div>
      <p className="text-gray-900 text-sm font-medium break-words">{value || '-'}</p>
    </div>
  )

  // Componente Avatar com Foto - ATUALIZADO COM CLIQUE
  const Avatar = ({ colab, size = 'md', clickable = false }: { colab: Colaborador, size?: 'sm' | 'md' | 'lg', clickable?: boolean }) => {
    const sizes = {
      sm: 'w-10 h-10 text-base',
      md: 'w-14 h-14 text-2xl',
      lg: 'w-20 h-20 text-3xl'
    }

    if (colab.foto_url) {
      return (
        <img 
          src={colab.foto_url} 
          alt={colab.nome}
          onClick={(e) => {
            if (clickable) {
              e.stopPropagation()
              setViewingPhoto(colab.foto_url!)
            }
          }}
          className={`${sizes[size]} rounded-full object-cover border-2 border-gray-200 shadow-sm ${clickable ? 'cursor-pointer hover:ring-4 hover:ring-blue-200 transition-all' : ''}`}
        />
      )
    }

    return (
      <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300 flex items-center justify-center text-gray-600 font-bold shadow-sm`}>
        {colab.nome?.charAt(0).toUpperCase()}
      </div>
    )
  }

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
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            
          {/* Busca e Filtros */}
          {viewMode === 'list' && (
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto flex-1 items-center">
              <div className="relative flex-1 min-w-[280px] w-full">
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Buscar nome ou CPF..." 
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="w-full sm:w-48">
                <SearchableSelect 
                   placeholder="Líderes"
                   value={filterLider}
                   onChange={setFilterLider}
                   options={unicosLideres.map(l => ({ name: toTitleCase(l) }))}
                />
              </div>

              <div className="w-full sm:w-48">
                <SearchableSelect 
                   placeholder="Locais"
                   value={filterLocal}
                   onChange={setFilterLocal}
                   options={unicosLocais.map(l => ({ name: toTitleCase(l) }))}
                />
              </div>

              {/* Botão Limpar Filtros */}
              {hasActiveFilters && (
                <button 
                  onClick={clearFilters}
                  className="px-3 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1 border border-red-200 whitespace-nowrap animate-in fade-in zoom-in-95"
                  title="Limpar todos os filtros"
                >
                  <X className="h-4 w-4" /> Limpar
                </button>
              )}
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
            <button onClick={() => { setFormData({ status: 'Ativo', estado: 'Rio de Janeiro' }); setPhotoPreview(null); setViewMode('form') }} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-bold text-sm transition-colors shadow-sm">
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
                    <tr 
                      key={colab.id} 
                      onClick={() => setSelectedColaborador(colab)}
                      className="hover:bg-blue-50/50 group transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar colab={colab} size="sm" />
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{toTitleCase(colab.nome)}</p>
                            <p className="text-xs text-gray-500">{colab.email || colab.cpf}</p>
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
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleEdit(colab); }} 
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" 
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(colab.id); }} 
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors" 
                            title="Excluir"
                          >
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
            <button onClick={() => { setViewMode('list'); setPhotoPreview(null); }} className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="h-6 w-6" /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* SEÇÃO DE FOTO */}
            <div className="md:col-span-3 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-100">
              <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-2 mb-4">
                <Camera className="h-4 w-4"/> Foto do Colaborador
              </h3>
              <div className="flex items-center gap-6">
                <div className="relative">
                  {photoPreview ? (
                    <div className="relative">
                      <img 
                        src={photoPreview} 
                        alt="Preview" 
                        className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                      />
                      <button
                        onClick={handleRemovePhoto}
                        className="absolute -top-2 -right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors"
                        type="button"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 border-4 border-white shadow-lg flex items-center justify-center">
                      <Image className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    ref={photoInputRef}
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    type="button"
                  >
                    {uploadingPhoto ? (
                      <>Fazendo upload...</>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        {photoPreview ? 'Alterar Foto' : 'Adicionar Foto'}
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-600 mt-2">
                    Formatos aceitos: JPG, PNG, GIF (máx. 5MB)
                  </p>
                </div>
              </div>
            </div>

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
              <SearchableSelect 
                label="Gênero"
                value={formData.genero || ''}
                onChange={(val) => setFormData({...formData, genero: val})}
                options={[
                  { name: 'Masculino' },
                  { name: 'Feminino' },
                  { name: 'Outro' }
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">CPF</label>
              <input className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.cpf || ''} onChange={e => setFormData({...formData,cpf: maskCPF(e.target.value)})} maxLength={14} />
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

            {/* Linha agrupando Número e Complemento */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Número</label>
                  <input className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.numero || ''} onChange={e => setFormData({...formData, numero: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Complemento</label>
                  <input className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.complemento || ''} onChange={e => setFormData({...formData, complemento: e.target.value})} />
                </div>
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
              <SearchableSelect 
                label="Estado"
                value={formData.estado || ''}
                onChange={(val) => setFormData({...formData, estado: val})}
                options={ESTADOS_BRASIL.map(est => ({ name: est.nome }))}
              />
            </div>

            {/* DADOS DA EMPRESA */}
            <div className="md:col-span-3 bg-gray-50 p-3 rounded-lg border border-gray-100 mt-2">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <Briefcase className="h-4 w-4"/> Dados Corporativos
                </h3>
            </div>

            {/* CAMPO EMAIL */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">E-mail Corporativo</label>
              <input type="email" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="exemplo@empresa.com.br" />
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

            {/* CARGO - COM SEARCHABLE SELECT */}
            <SearchableSelect 
              key={`cargo-${refreshKey}`}
              label="Cargo"
              value={formData.cargo || ''}
              onChange={(value) => setFormData({...formData, cargo: value})}
              table="opcoes_cargos"
              nameField="nome"
              placeholder="Selecione um cargo"
              onRefresh={handleRefresh}
            />

            {/* LÍDER - COM SEARCHABLE SELECT */}
            <SearchableSelect 
              key={`lider-${refreshKey}`}
              label="Líder de Equipe"
              value={formData.lider_equipe || ''}
              onChange={(value) => setFormData({...formData, lider_equipe: value})}
              table="opcoes_lideres"
              nameField="nome"
              placeholder="Selecione um líder"
              onRefresh={handleRefresh}
            />

            {/* TIPO - COM SEARCHABLE SELECT */}
            <SearchableSelect 
              key={`tipo-${refreshKey}`}
              label="Tipo"
              value={formData.tipo || ''}
              onChange={(value) => setFormData({...formData, tipo: value})}
              table="opcoes_tipos"
              nameField="nome"
              placeholder="Selecione um tipo"
              onRefresh={handleRefresh}
            />

            <div>
              <SearchableSelect 
                label="Status"
                value={formData.status || 'Ativo'}
                onChange={(val) => setFormData({...formData, status: val})}
                options={[
                  { name: 'Ativo' },
                  { name: 'Desligado' },
                  { name: 'Inativo' }
                ]}
              />
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
            <button onClick={() => { setViewMode('list'); setPhotoPreview(null); }} className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors shadow-sm">Cancelar</button>
            <button onClick={handleSave} disabled={uploadingPhoto} className="px-6 py-2.5 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 shadow-md transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"><Save className="h-4 w-4"/> Salvar</button>
          </div>
        </div>
      )}

      {/* MODAL DE DETALHES DO COLABORADOR */}
      {selectedColaborador && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] p-4 flex items-center justify-center animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col animate-in zoom-in-95 duration-200 border border-gray-200 relative">
              
              {/* Header */}
              <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50 rounded-t-2xl shrink-0">
                <div className="flex items-center gap-4">
                  <Avatar colab={selectedColaborador} size="lg" clickable={true} />
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{toTitleCase(selectedColaborador.nome)}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-500 font-medium">{toTitleCase(selectedColaborador.cargo) || '-'}</span>
                      <span className="text-gray-300">•</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                        selectedColaborador.status === 'Ativo' ? 'bg-green-100 text-green-700' : 
                        selectedColaborador.status === 'Desligado' ? 'bg-red-100 text-red-700' : 
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {selectedColaborador.status}
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedColaborador(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Conteúdo - Ajustado para caber sem rolar */}
              <div className="p-8 space-y-6 overflow-y-auto">
                
                {/* Grid principal para distribuir espaço */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Coluna Esquerda: Pessoal + Endereço */}
                    <div className="space-y-6">
                        {/* Seção Pessoal */}
                        <div>
                          <h3 className="text-sm font-bold text-[#112240] uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                            <User className="h-4 w-4" /> Dados Pessoais
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            <DetailItem label="CPF" value={selectedColaborador.cpf} />
                            <DetailItem label="Data Nascimento" value={formatDateDisplay(selectedColaborador.data_nascimento)} icon={Calendar} />
                            <DetailItem label="Gênero" value={selectedColaborador.genero} />
                            <DetailItem label="Tipo" value={selectedColaborador.tipo} />
                          </div>
                        </div>

                        {/* Seção Endereço */}
                        <div>
                          <h3 className="text-sm font-bold text-[#112240] uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                            <MapPin className="h-4 w-4" /> Endereço
                          </h3>
                          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                            <DetailItem label="CEP" value={selectedColaborador.cep} />
                            <div className="col-span-2">
                                <DetailItem label="Logradouro" value={`${selectedColaborador.endereco || ''}, ${selectedColaborador.numero || ''}`} />
                            </div>
                            <DetailItem label="Complemento" value={selectedColaborador.complemento} />
                            <DetailItem label="Bairro" value={selectedColaborador.bairro} />
                            <DetailItem label="Cidade/UF" value={`${selectedColaborador.cidade} - ${selectedColaborador.estado}`} />
                          </div>
                        </div>
                    </div>

                    {/* Coluna Direita: Corporativo */}
                    <div className="space-y-6">
                        {/* Seção Corporativo */}
                        <div>
                          <h3 className="text-sm font-bold text-[#112240] uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                            <Briefcase className="h-4 w-4" /> Dados Corporativos
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                              <DetailItem label="E-mail" value={selectedColaborador.email} icon={Mail} />
                            </div>
                            <DetailItem label="Equipe" value={selectedColaborador.equipe} />
                            <DetailItem label="Cargo" value={selectedColaborador.cargo} />
                            <DetailItem label="Local" value={selectedColaborador.local} icon={Building2} />
                            <DetailItem label="Líder" value={selectedColaborador.lider_equipe} />
                            <DetailItem label="Data Admissão" value={formatDateDisplay(selectedColaborador.data_admissao)} icon={Calendar} />
                            <DetailItem label="Data Desligamento" value={formatDateDisplay(selectedColaborador.data_desligamento)} icon={Calendar} />
                          </div>
                        </div>
                    </div>
                </div>

              </div>

              {/* Footer Ações */}
              <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-2xl shrink-0">
                <button 
                  onClick={() => handleDelete(selectedColaborador.id)}
                  className="px-4 py-2.5 text-red-600 bg-white border border-red-200 hover:bg-red-50 font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Trash2 className="h-4 w-4" /> Excluir
                </button>
                <button 
                  onClick={() => handleEdit(selectedColaborador)}
                  className="px-6 py-2.5 bg-[#112240] text-white hover:bg-[#1a3a6c] font-bold rounded-lg transition-colors flex items-center gap-2 shadow-lg"
                >
                  <Pencil className="h-4 w-4" /> Editar
                </button>
              </div>

            </div>
        </div>
      )}

      {/* MODAL DE VISUALIZAÇÃO DA FOTO EM TAMANHO REAL */}
      {viewingPhoto && (
        <div 
          className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setViewingPhoto(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setViewingPhoto(null)}
              className="absolute -top-12 right-0 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="h-8 w-8" />
            </button>
            <img 
              src={viewingPhoto} 
              alt="Foto em tamanho real"
              className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  )
}
