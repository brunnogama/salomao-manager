import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Upload, ChevronRight, CheckCircle2, AlertCircle, FileText, Loader2, ArrowLeft } from 'lucide-react';

interface Collaborator {
  id: string;
  name: string;
}

interface ExtractedData {
  numero_recibo: string;
  fornecedor_nome: string;
  fornecedor_cnpj: string;
  data_despesa: string;
  valor: number;
  descricao: string;
}

export default function PublicReembolso() {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [selectedColab, setSelectedColab] = useState('');
  const [reembolsavelCliente, setReembolsavelCliente] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publicFileUrl, setPublicFileUrl] = useState('');
  
  const [extractedData, setExtractedData] = useState<ExtractedData>({
    numero_recibo: '',
    fornecedor_nome: '',
    fornecedor_cnpj: '',
    data_despesa: '',
    valor: 0,
    descricao: ''
  });

  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchCollaborators();
  }, []);

  const fetchCollaborators = async () => {
    try {
      const { data, error } = await supabase
        .from('collaborators')
        .select('id, name')
        .eq('status', 'Ativo')
        .order('name');
        
      if (error) throw error;
      if (data) setCollaborators(data);
    } catch (err) {
      console.error('Erro ao buscar colaboradores', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadAndExtract = async () => {
    if (!selectedColab) {
      setFormError('Por favor, selecione seu nome.');
      return;
    }
    if (!file) {
      setFormError('Por favor, anexe o recibo.');
      return;
    }

    setFormError('');
    setIsUploading(true);

    try {
      // 1. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `recibos/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('gastos_reembolsos')
        .upload(filePath, file);

      if (uploadError) {
        // Fallback in case bucket doesn't exist yet for testing without breaking flow
        console.error('Upload falhou. Verifique se o bucket gastos_reembolsos existe e tem políticas públicas.', uploadError);
        alert('Erro no upload. Para testar sem o bucket, mockaremos os dados.');
      }

      // We get public URL (or construct it if upload failed for UI mock)
      const { data: publicUrlData } = supabase.storage.from('gastos_reembolsos').getPublicUrl(filePath);
      const fileUrl = publicUrlData.publicUrl;
      setPublicFileUrl(fileUrl);
      
      setIsUploading(false);
      setIsExtracting(true);

      // 2. Call Make.com Webhook if configured
      const webhookUrl = import.meta.env.VITE_MAKE_WEBHOOK_REEMBOLSO_EXTRACT || 'https://hook.us2.make.com/8e7s11ns13rgpffbtyduy5kt93zzrf53';
      
      if (webhookUrl && webhookUrl !== 'SUA_URL_DO_MAKE_AQUI') {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file_url: fileUrl, colaborador_id: selectedColab })
        });
        
        if (response.ok) {
          const makeData = await response.json();
          // Assume the make webhook returns these fields
          setExtractedData({
            numero_recibo: makeData.numero_recibo || '',
            fornecedor_nome: makeData.fornecedor_nome || '',
            fornecedor_cnpj: makeData.fornecedor_cnpj || '',
            data_despesa: makeData.data_despesa || '',
            valor: parseFloat(makeData.valor) || 0,
            descricao: makeData.descricao || ''
          });
        } else {
          throw new Error('Erro na extração da IA (Webhook retornou erro)');
        }
      } else {
        // Mocking extraction delay for demonstration
        await new Promise(resolve => setTimeout(resolve, 2000));
        setExtractedData({
          numero_recibo: 'MOCK-12345',
          fornecedor_nome: 'Fornecedor Exemplo Ltda',
          fornecedor_cnpj: '00.000.000/0001-00',
          data_despesa: new Date().toISOString().split('T')[0],
          valor: 150.00,
          descricao: 'Despesa mockada para teste porque o Webhook não está configurado.'
        });
      }

      setIsExtracting(false);
      setStep(2);
      
    } catch (err: any) {
      console.error(err);
      setFormError('Erro ao processar o recibo. ' + (err.message || ''));
      setIsUploading(false);
      setIsExtracting(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('reembolsos').insert({
        colaborador_id: selectedColab,
        reembolsavel_cliente: reembolsavelCliente,
        recibo_url: publicFileUrl,
        ...extractedData
      });

      if (error) {
        throw error;
      }

      setStep(3);
    } catch (err: any) {
      console.error('Erro ao enviar reembolso', err);
      alert('Houve um erro ao enviar seu reembolso: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl mx-auto">
        
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#112240] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <span className="text-2xl font-black text-[#d4af37]">S</span>
          </div>
          <h1 className="text-2xl font-black text-[#112240]">Solicitação de Reembolso</h1>
          <p className="text-gray-500 mt-2">Envie seu comprovante e nossa IA preencherá os dados.</p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 md:p-8 relative overflow-hidden">
          
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gray-100">
            <div 
              className="h-full bg-gradient-to-r from-[#1e3a8a] to-[#d4af37] transition-all duration-500"
              style={{ width: step === 1 ? '33%' : step === 2 ? '66%' : '100%' }}
            />
          </div>

          {formError && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-2 text-sm border border-red-100">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {formError}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Quem é você?</label>
                <select
                  value={selectedColab}
                  onChange={(e) => setSelectedColab(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e3a8a] outline-none"
                >
                  <option value="">Selecione seu nome...</option>
                  {collaborators.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Recibo (PDF ou Imagem)</label>
                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 hover:bg-gray-50 transition-colors text-center cursor-pointer group relative">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-blue-50 text-[#1e3a8a] rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      {file ? <FileText className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
                    </div>
                    {file ? (
                      <span className="font-medium text-[#112240]">{file.name}</span>
                    ) : (
                      <>
                        <span className="font-medium text-[#112240]">Clique ou arraste um arquivo</span>
                        <span className="text-xs text-gray-500 mt-1">Imagens (JPG, PNG) ou PDF</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <input
                  type="checkbox"
                  id="reembolsavel"
                  checked={reembolsavelCliente}
                  onChange={(e) => setReembolsavelCliente(e.target.checked)}
                  className="w-5 h-5 rounded text-[#1e3a8a] focus:ring-[#1e3a8a]"
                />
                <label htmlFor="reembolsavel" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                  Despesa é reembolsável para o cliente?
                </label>
              </div>

              <button
                onClick={handleUploadAndExtract}
                disabled={isUploading || isExtracting}
                className="w-full py-4 bg-[#112240] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#1e3a8a] transition-all disabled:opacity-70"
              >
                {isExtracting ? (
                   <><Loader2 className="w-5 h-5 animate-spin" /> A IA está analisando seu recibo...</>
                ) : isUploading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Enviando arquivo...</>
                ) : (
                  <>Continuar <ChevronRight className="w-5 h-5" /></>
                )}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              
              <div className="flex items-center gap-3 mb-2">
                <button onClick={() => setStep(1)} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors">
                   <ArrowLeft className="w-4 h-4 text-gray-600" />
                </button>
                <h2 className="text-lg font-bold text-[#112240]">Confira os dados extraídos</h2>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-xl text-sm text-[#1e3a8a] flex gap-3 items-start border border-blue-100">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <p>Nossa inteligência artificial leu seu recibo. Por favor, <strong>confirme e edite</strong> os campos se houver alguma divergência antes de enviar.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Número do Recibo</label>
                  <input
                    type="text"
                    value={extractedData.numero_recibo}
                    onChange={(e) => setExtractedData({...extractedData, numero_recibo: e.target.value})}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Data</label>
                  <input
                    type="date"
                    value={extractedData.data_despesa}
                    onChange={(e) => setExtractedData({...extractedData, data_despesa: e.target.value})}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Fornecedor (Nome)</label>
                  <input
                    type="text"
                    value={extractedData.fornecedor_nome}
                    onChange={(e) => setExtractedData({...extractedData, fornecedor_nome: e.target.value})}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium"
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">CNPJ</label>
                  <input
                    type="text"
                    value={extractedData.fornecedor_cnpj}
                    onChange={(e) => setExtractedData({...extractedData, fornecedor_cnpj: e.target.value})}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Descrição</label>
                  <textarea
                    value={extractedData.descricao}
                    onChange={(e) => setExtractedData({...extractedData, descricao: e.target.value})}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium resize-none h-20"
                  />
                </div>
                <div className="col-span-2 bg-[#112240] p-4 rounded-xl flex items-center justify-between mt-2">
                  <span className="text-gray-300 font-medium">Valor Total</span>
                  <div className="flex items-center">
                    <span className="text-gray-400 font-bold mr-2">R$</span>
                    <input
                      type="number"
                      value={extractedData.valor}
                      onChange={(e) => setExtractedData({...extractedData, valor: parseFloat(e.target.value)})}
                      className="bg-transparent text-white text-xl font-black text-right outline-none w-32"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full py-4 bg-[#1e3a8a] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 hover:bg-[#152e72] transition-all disabled:opacity-70"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Salvando...</>
                ) : (
                  <>Confirmar e Enviar para o Financeiro <ChevronRight className="w-5 h-5" /></>
                )}
              </button>

            </div>
          )}

          {step === 3 && (
            <div className="py-10 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-black text-[#112240] mb-2">Reembolso Solicitado!</h2>
              <p className="text-gray-500 max-w-sm mb-8">
                Sua solicitação foi enviada para o departamento financeiro. Você receberá uma notificação quando for processada.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="py-3 px-8 bg-gray-100 text-[#112240] hover:bg-gray-200 rounded-xl font-bold text-sm transition-colors"
              >
                Enviar nova solicitação
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
