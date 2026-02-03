import { useState, useEffect, useMemo, useRef } from 'react'
import { 
  FolderSearch, 
  UserCircle, 
  LogOut, 
  Grid, 
  Plus, 
  Search,
  Download,
  Upload,
  Trash2,
  Eye,
  Filter,
  XCircle,
  FileText,
  Calendar,
  Building2,
  Tag,
  Clock,
  Loader2
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'

interface GEDProps {
  userName?: string;
  onModuleHome?: () => void;
  onLogout?: () => void;
}

interface Documento {
  id: string;
  nome_arquivo: string;
  tipo_documento: string;
  categoria: string;
  entidade_vinculada: string;
  id_vinculo: string;
  data_upload: string;
  tamanho: number;
  url_documento: string;
  observacoes?: string;
  usuario_upload: string;
}

export function GED({ 
  userName = 'Usuário', 
  onModuleHome, 
  onLogout 
}: GEDProps) {
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategoria, setSelectedCategoria] = useState<string>('todas')
  const [selectedTipo, setSelectedTipo] = useState<string>('todos')
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<Documento | null>(null)

  const categorias = ['Todas', 'Aeronave', 'Clientes', 'Contratos', 'Financeiro', 'RH', 'Jurídico']
  const tiposDocumento = ['Todos', 'Nota Fiscal', 'Contrato', 'Recibo', 'Laudo', 'Certidão', 'Procuração', 'Relatório', 'Outros']

  const fetchDocumentos = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('ged_documentos')
      .select('*')
      .order('data_upload', { ascending: false })
    
    if (error) {
      console.error('Erro ao buscar documentos:', error)
    } else {
      console.log('Documentos carregados:', data)
      setDocumentos(data || [])
    }
    
    setLoading(false)
  }

  useEffect(() => {
    fetchDocumentos()
  }, [])

  const filteredData = useMemo(() => {
    return documentos.filter(doc => {
      const matchSearch = 
        doc.nome_arquivo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.tipo_documento.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.entidade_vinculada && doc.entidade_vinculada.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchCategoria = selectedCategoria === 'todas' || doc.categoria.toLowerCase() === selectedCategoria.toLowerCase()
      const matchTipo = selectedTipo === 'todos' || doc.tipo_documento.toLowerCase() === selectedTipo.toLowerCase()

      return matchSearch && matchCategoria && matchTipo
    })
  }, [documentos, searchTerm, selectedCategoria, selectedTipo])

  const resetFilters = () => {
    setSearchTerm('')
    setSelectedCategoria('todas')
    setSelectedTipo('todos')
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const handleDownload = async (doc: Documento) => {
    try {
      const { data, error } = await supabase.storage
        .from('ged-documentos')
        .download(doc.url_documento)
      
      if (error) throw error
      
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.nome_arquivo
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erro ao baixar:', error)
      alert('Erro ao baixar o documento')
    }
  }

  const handleDelete = async (doc: Documento) => {
    if (!confirm(`Tem certeza que deseja excluir "${doc.nome_arquivo}"?`)) return

    try {
      // Remove do storage
      await supabase.storage
        .from('ged-documentos')
        .remove([doc.url_documento])

      // Remove do banco
      const { error } = await supabase
        .from('ged_documentos')
        .delete()
        .eq('id', doc.id)

      if (error) throw error

      alert('Documento excluído com sucesso!')
      fetchDocumentos()
      setIsViewModalOpen(false)
      setSelectedDoc(null)
    } catch (error) {
      console.error('Erro ao excluir:', error)
      alert('Erro ao excluir o documento')
    }
  }

  return (
    <div className="flex flex-col min-h-full bg-gradient-to-br from-gray-50 to-gray-100 p-6 space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg">
            <FolderSearch className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">GED - Gestão Eletrônica de Documentos</h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">Repositório Central de Documentos</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end mr-2">
            <span className="text-sm font-bold text-[#0a192f]">{userName}</span>
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Conectado</span>
          </div>
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#1e3a8a] to-[#112240] flex items-center justify-center text-white shadow-md">
            <UserCircle className="h-5 w-5" />
          </div>
          {onModuleHome && (
            <button onClick={onModuleHome} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
              <Grid className="h-5 w-5" />
            </button>
          )}
          {onLogout && (
            <button onClick={onLogout} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all">
              <LogOut className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Filter className="h-4 w-4 text-gray-400" />
            
            <select
              value={selectedCategoria}
              onChange={(e) => setSelectedCategoria(e.target.value)}
              className="px-4 py-2 bg-gray-100/50 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            >
              {categorias.map(cat => (
                <option key={cat} value={cat.toLowerCase()}>{cat}</option>
              ))}
            </select>

            <select
              value={selectedTipo}
              onChange={(e) => setSelectedTipo(e.target.value)}
              className="px-4 py-2 bg-gray-100/50 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            >
              {tiposDocumento.map(tipo => (
                <option key={tipo} value={tipo.toLowerCase()}>{tipo}</option>
              ))}
            </select>
          </div>

          {(searchTerm || selectedCategoria !== 'todas' || selectedTipo !== 'todos') && (
            <button 
              onClick={resetFilters} 
              className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all border border-red-100 animate-in zoom-in duration-300"
            >
              <XCircle className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Limpar Filtros</span>
            </button>
          )}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-2 border-t border-gray-50">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar documentos por nome, tipo ou entidade..." 
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100/50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
            />
          </div>

          <button 
            onClick={() => setIsUploadModalOpen(true)} 
            className="flex items-center gap-2 px-8 py-2.5 bg-[#1e3a8a] text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-[#112240] transition-all active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" /> Novo Documento
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total de Documentos</p>
              <p className="text-2xl font-black text-[#0a192f] mt-1">{documentos.length}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Categorias Ativas</p>
              <p className="text-2xl font-black text-[#0a192f] mt-1">{new Set(documentos.map(d => d.categoria)).size || 0}</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl">
              <Tag className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Espaço Utilizado</p>
              <p className="text-2xl font-black text-[#0a192f] mt-1">
                {formatFileSize(documentos.reduce((acc, doc) => acc + (doc.tamanho || 0), 0))}
              </p>
            </div>
            <div className="p-3 bg-orange-50 rounded-xl">
              <FolderSearch className="h-5 w-5 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Último Upload</p>
              <p className="text-sm font-black text-[#0a192f] mt-1">
                {documentos.length > 0 ? formatDate(documentos[0].data_upload) : '---'}
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl">
              <Clock className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Documentos */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <FolderSearch className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-lg font-bold text-gray-400">Nenhum documento encontrado</p>
            <p className="text-sm text-gray-400 mt-2">Tente ajustar os filtros ou faça upload de um novo documento</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredData.map(doc => (
              <div 
                key={doc.id}
                className="group bg-gray-50/50 border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer"
                onClick={() => { setSelectedDoc(doc); setIsViewModalOpen(true); }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest px-2 py-1 bg-white rounded-lg border border-gray-200">
                    {doc.categoria}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-[#0a192f] mb-2 truncate group-hover:text-blue-600 transition-colors" title={doc.nome_arquivo}>
                  {doc.nome_arquivo}
                </h3>

                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center gap-2">
                    <Tag className="h-3 w-3 text-gray-400" />
                    <span className="text-[10px] font-semibold text-gray-500">{doc.tipo_documento}</span>
                  </div>
                  {doc.entidade_vinculada && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3 w-3 text-gray-400" />
                      <span className="text-[10px] font-semibold text-gray-500 truncate">{doc.entidade_vinculada}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <span className="text-[10px] font-semibold text-gray-500">{formatDate(doc.data_upload)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                    {formatFileSize(doc.tamanho)}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDownload(doc); }}
                      className="p-1.5 hover:bg-blue-100 rounded-lg transition-all"
                      title="Baixar"
                    >
                      <Download className="h-3.5 w-3.5 text-blue-600" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedDoc(doc); setIsViewModalOpen(true); }}
                      className="p-1.5 hover:bg-emerald-100 rounded-lg transition-all"
                      title="Visualizar"
                    >
                      <Eye className="h-3.5 w-3.5 text-emerald-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isUploadModalOpen && (
        <UploadModal 
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onSuccess={fetchDocumentos}
          userName={userName}
        />
      )}

      {isViewModalOpen && selectedDoc && (
        <ViewDocumentModal
          documento={selectedDoc}
          isOpen={isViewModalOpen}
          onClose={() => { setIsViewModalOpen(false); setSelectedDoc(null); }}
          onDownload={handleDownload}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}

// Modal de Upload
function UploadModal({ isOpen, onClose, onSuccess, userName }: any) {
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    categoria: '',
    tipo_documento: '',
    entidade_vinculada: '',
    observacoes: ''
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async () => {
    if (!selectedFile || !formData.categoria || !formData.tipo_documento) {
      alert('Preencha categoria, tipo de documento e selecione um arquivo')
      return
    }

    setUploading(true)
    try {
      const nomeOriginal = selectedFile.name
      const timestamp = Date.now()
      const filePath = `${formData.categoria}/${timestamp}_${nomeOriginal}`

      console.log('📤 Iniciando upload...')
      console.log('Nome original:', nomeOriginal)
      console.log('Caminho storage:', filePath)

      // Upload no storage
      const { error: uploadError } = await supabase.storage
        .from('ged-documentos')
        .upload(filePath, selectedFile)

      if (uploadError) {
        console.error('❌ Erro upload storage:', uploadError)
        throw uploadError
      }

      console.log('✅ Upload storage OK')

      // Inserir no banco
      const { data: insertData, error: insertError } = await supabase
        .from('ged_documentos')
        .insert({
          nome_arquivo: nomeOriginal, // NOME ORIGINAL AQUI
          tipo_documento: formData.tipo_documento,
          categoria: formData.categoria,
          entidade_vinculada: formData.entidade_vinculada || '',
          id_vinculo: '',
          tamanho: selectedFile.size,
          url_documento: filePath,
          observacoes: formData.observacoes || '',
          usuario_upload: userName
        })
        .select()

      if (insertError) {
        console.error('❌ Erro insert banco:', insertError)
        // Limpa storage se falhou no banco
        await supabase.storage.from('ged-documentos').remove([filePath])
        throw insertError
      }

      console.log('✅ Insert banco OK:', insertData)

      alert('✅ Documento enviado com sucesso!')
      
      // Limpa form
      setFormData({ categoria: '', tipo_documento: '', entidade_vinculada: '', observacoes: '' })
      setSelectedFile(null)
      
      await onSuccess()
      onClose()
    } catch (error: any) {
      console.error('❌ Erro geral:', error)
      alert(`Erro: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#0a192f]/60 backdrop-blur-md">
      <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="px-8 py-5 border-b border-gray-50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Upload className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#112240] tracking-tight leading-none">Upload de Documento</h3>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">GED - Gestão Eletrônica</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
            <XCircle className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="px-8 py-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">Categoria *</span>
              <select
                value={formData.categoria}
                onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                className="w-full bg-gray-100/50 border border-gray-200 text-sm rounded-xl p-2.5 outline-none font-medium"
              >
                <option value="">Selecione...</option>
                <option value="Aeronave">Aeronave</option>
                <option value="Clientes">Clientes</option>
                <option value="Contratos">Contratos</option>
                <option value="Financeiro">Financeiro</option>
                <option value="RH">RH</option>
                <option value="Jurídico">Jurídico</option>
              </select>
            </label>

            <label className="block">
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">Tipo de Documento *</span>
              <select
                value={formData.tipo_documento}
                onChange={(e) => setFormData({...formData, tipo_documento: e.target.value})}
                className="w-full bg-gray-100/50 border border-gray-200 text-sm rounded-xl p-2.5 outline-none font-medium"
              >
                <option value="">Selecione...</option>
                <option value="Nota Fiscal">Nota Fiscal</option>
                <option value="Contrato">Contrato</option>
                <option value="Recibo">Recibo</option>
                <option value="Laudo">Laudo</option>
                <option value="Certidão">Certidão</option>
                <option value="Procuração">Procuração</option>
                <option value="Relatório">Relatório</option>
                <option value="Outros">Outros</option>
              </select>
            </label>
          </div>

          <label className="block">
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">Entidade Vinculada</span>
            <input
              type="text"
              value={formData.entidade_vinculada}
              onChange={(e) => setFormData({...formData, entidade_vinculada: e.target.value})}
              placeholder="Cliente, fornecedor, projeto..."
              className="w-full bg-gray-100/50 border border-gray-200 text-sm rounded-xl p-2.5 outline-none font-medium"
            />
          </label>

          <label className="block">
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">Observações</span>
            <textarea
              rows={3}
              value={formData.observacoes}
              onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
              placeholder="Informações adicionais..."
              className="w-full bg-gray-100/50 border border-gray-200 text-sm rounded-xl p-2.5 outline-none font-medium resize-none"
            />
          </label>

          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-all">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xlsx,.xls,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mx-auto flex flex-col items-center gap-2"
            >
              <Upload className="h-8 w-8 text-gray-400" />
              <span className="text-sm font-bold text-gray-600">
                {selectedFile ? selectedFile.name : 'Clique para selecionar o arquivo'}
              </span>
              <span className="text-[10px] text-gray-400">PDF, DOC, XLS, IMG (máx. 25MB)</span>
            </button>
          </div>
        </div>

        <div className="px-8 py-5 border-t border-gray-50 bg-white flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-6 py-2 text-[9px] font-black text-gray-400 hover:text-gray-600 transition-all uppercase tracking-widest disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="flex items-center gap-2 px-8 py-2 bg-[#1e3a8a] text-white text-[9px] font-black rounded-xl hover:bg-[#112240] shadow-lg transition-all active:scale-95 uppercase tracking-widest disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                Enviar Documento
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// Modal de Visualização
function ViewDocumentModal({ documento, isOpen, onClose, onDownload, onDelete }: any) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[#0a192f]/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in duration-300">
        <div className="px-10 py-6 border-b border-gray-50 flex justify-between items-center">
          <div className="flex items-center gap-5">
            <div className="p-3.5 bg-blue-50 rounded-2xl">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-[#112240] tracking-tight leading-none">Detalhes do Documento</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em] mt-1.5">GED - Gestão Eletrônica</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-gray-100 rounded-2xl transition-all group">
            <XCircle className="h-6 w-6 text-gray-400 group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        <div className="px-10 py-8 space-y-6">
          <div className="bg-blue-50/30 p-5 rounded-xl border border-blue-100">
            <h4 className="text-lg font-black text-[#0a192f] mb-2">{documento.nome_arquivo}</h4>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Categoria</span>
                <p className="text-sm font-bold text-gray-700 mt-1">{documento.categoria}</p>
              </div>
              <div>
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Tipo</span>
                <p className="text-sm font-bold text-gray-700 mt-1">{documento.tipo_documento}</p>
              </div>
              <div>
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Entidade</span>
                <p className="text-sm font-bold text-gray-700 mt-1">{documento.entidade_vinculada || '---'}</p>
              </div>
              <div>
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Data Upload</span>
                <p className="text-sm font-bold text-gray-700 mt-1">{new Date(documento.data_upload).toLocaleDateString('pt-BR')}</p>
              </div>
              <div>
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Tamanho</span>
                <p className="text-sm font-bold text-gray-700 mt-1">{(documento.tamanho / 1024).toFixed(2)} KB</p>
              </div>
              <div>
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Enviado por</span>
                <p className="text-sm font-bold text-gray-700 mt-1">{documento.usuario_upload}</p>
              </div>
            </div>
            {documento.observacoes && (
              <div className="mt-4 pt-4 border-t border-blue-100">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Observações</span>
                <p className="text-sm font-semibold text-gray-600 mt-1 italic">"{documento.observacoes}"</p>
              </div>
            )}
          </div>
        </div>

        <div className="px-10 py-6 border-t border-gray-50 bg-gray-50/50 flex justify-between items-center">
          <button
            onClick={() => onDelete(documento)}
            className="flex items-center gap-2 px-6 py-3 text-red-500 hover:bg-red-50 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            <Trash2 className="h-4 w-4" /> Excluir Documento
          </button>

          <div className="flex gap-4">
            <button onClick={onClose} className="px-6 py-3 text-gray-400 hover:text-gray-600 text-[10px] font-black uppercase tracking-widest transition-all">
              Fechar
            </button>
            <button
              onClick={() => onDownload(documento)}
              className="flex items-center gap-3 px-10 py-3 bg-[#1e3a8a] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-[#112240] transition-all transform active:scale-95"
            >
              <Download className="h-4 w-4" /> Baixar Documento
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}