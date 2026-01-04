import { useState, useRef, useEffect } from 'react'
import { Download, Upload, FileSpreadsheet, CheckCircle, AlertCircle, Users, Pencil, Trash2, Save, X, RefreshCw } from 'lucide-react'
import { utils, read, writeFile } from 'xlsx'
import { supabase } from '../lib/supabase'

export function Settings() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' })
  
  // Estados para Gestão de Sócios
  const [socios, setSocios] = useState<string[]>([])
  const [loadingSocios, setLoadingSocios] = useState(false)
  const [editingSocio, setEditingSocio] = useState<string | null>(null)
  const [newSocioName, setNewSocioName] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  // --- GESTÃO DE SÓCIOS ---

  const fetchSocios = async () => {
    setLoadingSocios(true)
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('socio')
      
      if (error) throw error

      if (data) {
        // Filtra únicos e remove vazios
        const uniqueSocios = Array.from(new Set(data.map(item => item.socio).filter(Boolean)))
        setSocios(uniqueSocios.sort())
      }
    } catch (error) {
      console.error('Erro ao buscar sócios:', error)
    } finally {
      setLoadingSocios(false)
    }
  }

  useEffect(() => {
    fetchSocios()
  }, [])

  const handleUpdateSocio = async (oldName: string) => {
    if (!newSocioName.trim() || newSocioName === oldName) {
      setEditingSocio(null)
      return
    }

    if (confirm(`Deseja renomear "${oldName}" para "${newSocioName}" em todos os clientes?`)) {
      setLoadingSocios(true)
      try {
        const { error } = await supabase
          .from('clientes')
          .update({ socio: newSocioName })
          .eq('socio', oldName)

        if (error) throw error

        setStatus({ type: 'success', message: 'Nome do sócio atualizado com sucesso!' })
        fetchSocios()
      } catch (error: any) {
        setStatus({ type: 'error', message: `Erro ao atualizar: ${error.message}` })
      } finally {
        setEditingSocio(null)
        setLoadingSocios(false)
      }
    }
  }

  const handleDeleteSocio = async (name: string) => {
    if (confirm(`ATENÇÃO: Isso removerá o sócio "${name}" de TODOS os clientes vinculados a ele.\n\nOs clientes ficarão "Sem Sócio". Deseja continuar?`)) {
      setLoadingSocios(true)
      try {
        // Define como NULL onde o sócio é igual ao nome selecionado
        const { error } = await supabase
          .from('clientes')
          .update({ socio: null })
          .eq('socio', name)

        if (error) throw error

        setStatus({ type: 'success', message: `Sócio "${name}" removido dos registros.` })
        fetchSocios()
      } catch (error: any) {
        setStatus({ type: 'error', message: `Erro ao excluir: ${error.message}` })
      } finally {
        setLoadingSocios(false)
      }
    }
  }

  // --- IMPORTAÇÃO E EXPORTAÇÃO ---

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "Nome Completo": "Exemplo Silva",
        "Empresa": "Empresa Teste S.A.",
        "Cargo": "Diretor",
        "Telefone": "(11) 99999-9999",
        "Tipo de Brinde": "Brinde Médio",
        "Outro Brinde": "",
        "Quantidade": 1,
        "CEP": "01001-000",
        "Endereço": "Praça da Sé",
        "Número": "100",
        "Complemento": "Sala 1",
        "Bairro": "Centro",
        "Cidade": "São Paulo",
        "Estado": "SP",
        "Email": "exemplo@email.com",
        "Sócio Responsável": "Marcio Gama",
        "Observações": "Cliente importante"
      }
    ]

    const ws = utils.json_to_sheet(templateData)
    const wscols = [{ wch: 25 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 12 }, { wch: 30 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 5 }, { wch: 25 }, { wch: 20 }, { wch: 30 }]
    ws['!cols'] = wscols
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, "Modelo Importação")
    writeFile(wb, "Modelo_Importacao_Clientes_Salomao.xlsx")
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setStatus({ type: null, message: '' })

    try {
      const data = await file.arrayBuffer()
      const workbook = read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData: any[] = utils.sheet_to_json(worksheet)

      if (jsonData.length === 0) throw new Error("A planilha está vazia.")

      const clientsToInsert = jsonData.map((row) => ({
        nome: row["Nome Completo"],
        empresa: row["Empresa"],
        cargo: row["Cargo"],
        telefone: row["Telefone"],
        tipo_brinde: row["Tipo de Brinde"] || "Brinde Médio",
        outro_brinde: row["Outro Brinde"],
        quantidade: row["Quantidade"] || 1,
        cep: row["CEP"],
        endereco: row["Endereço"],
        numero: row["Número"] ? String(row["Número"]) : null,
        complemento: row["Complemento"],
        bairro: row["Bairro"],
        cidade: row["Cidade"],
        estado: row["Estado"],
        email: row["Email"],
        socio: row["Sócio Responsável"],
        observacoes: row["Observações"]
      }))

      const { error } = await supabase.from('clientes').insert(clientsToInsert)
      if (error) throw error

      setStatus({ type: 'success', message: `${clientsToInsert.length} clientes importados com sucesso!` })
      if (fileInputRef.current) fileInputRef.current.value = ''
      
      // Atualiza a lista de sócios após importar novos dados
      fetchSocios()

    } catch (error: any) {
      console.error(error)
      setStatus({ type: 'error', message: `Erro na importação: ${error.message}` })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <h2 className="text-2xl font-bold text-[#112240] mb-6">Configurações do Sistema</h2>

      {/* CARD 1: GESTÃO DE SÓCIOS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-purple-50 rounded-lg text-purple-700">
            <Users className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900">Gerenciar Sócios</h3>
                <button onClick={fetchSocios} className="p-2 text-gray-400 hover:text-[#112240] transition-colors" title="Atualizar Lista">
                    <RefreshCw className={`h-4 w-4 ${loadingSocios ? 'animate-spin' : ''}`} />
                </button>
            </div>
            <p className="text-gray-500 mt-1 text-sm">
              Edite nomes incorretos ou remova sócios antigos. As alterações refletem em <strong>todos</strong> os clientes vinculados.
            </p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg border border-gray-100 overflow-hidden">
            {loadingSocios && socios.length === 0 ? (
                <div className="p-8 text-center text-gray-500">Carregando lista de sócios...</div>
            ) : socios.length === 0 ? (
                <div className="p-8 text-center text-gray-500">Nenhum sócio encontrado na base de dados.</div>
            ) : (
                <ul className="divide-y divide-gray-200">
                    {socios.map((socio, index) => (
                        <li key={index} className="flex items-center justify-between p-4 hover:bg-white transition-colors">
                            {editingSocio === socio ? (
                                <div className="flex items-center gap-2 flex-1 animate-fadeIn">
                                    <input 
                                        type="text" 
                                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:border-[#112240] outline-none"
                                        value={newSocioName}
                                        onChange={(e) => setNewSocioName(e.target.value)}
                                        autoFocus
                                    />
                                    <button 
                                        onClick={() => handleUpdateSocio(socio)}
                                        className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200"
                                        title="Salvar"
                                    >
                                        <Save className="h-4 w-4" />
                                    </button>
                                    <button 
                                        onClick={() => setEditingSocio(null)}
                                        className="p-1.5 bg-gray-200 text-gray-600 rounded hover:bg-gray-300"
                                        title="Cancelar"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <span className="text-gray-700 font-medium">{socio}</span>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => { setEditingSocio(socio); setNewSocioName(socio); }}
                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                            title="Renomear"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteSocio(socio)}
                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                            title="Remover vinculos"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
      </div>

      {/* CARD 2: IMPORTAÇÃO */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-blue-50 rounded-lg text-[#112240]">
            <FileSpreadsheet className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Importação em Lote</h3>
            <p className="text-gray-500 mt-1 text-sm">
              Adicione múltiplos clientes de uma vez utilizando uma planilha Excel (.xlsx).
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
            <div>
              <h4 className="font-medium text-gray-800">1. Baixe a planilha modelo</h4>
              <p className="text-xs text-gray-500">Utilize este arquivo para preencher os dados corretamente.</p>
            </div>
            <button 
              onClick={handleDownloadTemplate}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors shadow-sm font-medium text-sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar Modelo
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
            <div>
              <h4 className="font-medium text-gray-800">2. Envie o arquivo preenchido</h4>
              <p className="text-xs text-gray-500">Selecione o arquivo .xlsx do seu computador.</p>
            </div>
            <div className="relative">
              <input 
                type="file" 
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                ref={fileInputRef}
                className="hidden"
                id="file-upload"
                disabled={loading}
              />
              <label 
                htmlFor="file-upload"
                className={`flex items-center px-4 py-2 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#112240] hover:bg-[#1a3a6c] cursor-pointer'} text-white rounded-lg transition-colors shadow-sm font-medium text-sm`}
              >
                {loading ? (
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {loading ? 'Processando...' : 'Selecionar Arquivo'}
              </label>
            </div>
          </div>
        </div>

        {status.message && (
          <div className={`mt-6 p-4 rounded-lg flex items-center gap-3 animate-fadeIn ${
            status.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {status.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            <span className="font-medium text-sm">{status.message}</span>
          </div>
        )}
      </div>

      <div className="mt-6 bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-xs text-yellow-800">
        <strong>Atenção:</strong> Certifique-se de que os nomes das colunas na planilha enviada sejam 
        exatamente iguais aos da planilha modelo.
      </div>
    </div>
  )
}
