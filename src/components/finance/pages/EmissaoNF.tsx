import { useState } from 'react';
import {
  FileText,
  Upload,
  ShieldCheck,
  Globe,
  AlertCircle,
  Send,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

const EmissaoNF = () => {
  const [selectedCity, setSelectedCity] = useState('Rio de Janeiro');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const cities = [
    'Belém', 'Brasília', 'Florianópolis', 'Rio de Janeiro', 'São Paulo', 'Vitória'
  ];

  // Função para processar a emissão (chamada ao serviço Python)
  const handleEmitirNota = async () => {
    if (!file && selectedCity === 'Rio de Janeiro') {
      toast.warning("Certificado Obrigatório", { 
        description: "Por favor, selecione o certificado .pfx para o Rio de Janeiro." 
      });
      return;
    }

    setIsUploading(true);
    const loadingToast = toast.loading("Transmitindo nota...");

    try {
      const response = await fetch('http://localhost:5000/assinar-nota', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cidade: selectedCity,
          // Exemplo de dados que viriam do seu sistema de faturamento
          prestador: { cnpj: "00.000.000/0001-00", im: "123456" },
          servico: { valor: 1500.00, discriminacao: "Honorários Advocatícios" }
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.dismiss(loadingToast);
        toast.success("Sucesso", {
          description: "Nota assinada e enviada com sucesso!"
        });
        console.log("XML de Retorno:", data.xml);
      } else {
        toast.dismiss(loadingToast);
        toast.error("Erro na emissão", {
          description: data.erro
        });
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("Erro ao conectar com o serviço de assinatura:", error);
      toast.error("Serviço Indisponível", {
        description: "O serviço de assinatura está offline. Certifique-se que o script Python está a correr."
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 space-y-4 sm:space-y-6 relative p-4 sm:p-6 min-h-screen">
      {/* PAGE HEADER - Padrão Salomão Design System */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg shrink-0">
            <FileText className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
              Emissão de NF
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-1 sm:mt-0.5">
              Gestão centralizada de faturação para múltiplas capitais
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 w-full md:w-auto mt-2 md:mt-0 justify-end flex-wrap">
          <button
            onClick={handleEmitirNota}
            disabled={isUploading}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 ${isUploading ? 'bg-gray-400 text-white cursor-not-allowed hidden' : 'bg-gradient-to-r from-[#1e3a8a] to-[#112240] text-white hover:shadow-xl'
              }`}
          >
            {isUploading ? <Clock className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {isUploading ? 'PROCESSANDO' : 'TRANSMITIR NOTA'}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 w-full">
        {/* Painel de Configuração */}
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-xl border border-gray-100 space-y-4">
            <h2 className="font-black text-lg flex items-center gap-2 text-[#0a192f] uppercase tracking-wide text-sm">
              <Globe className="w-5 h-5 text-[#1e3a8a]" /> Configuração Regional
            </h2>
            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Cidade de Emissão</label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] outline-none transition-all font-medium text-sm text-[#0a192f]"
              >
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl flex gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-800 leading-relaxed font-medium">
                Conexão direta com a prefeitura de <strong className="font-bold text-[#1e3a8a]">{selectedCity}</strong> via Web Service.
                <span className="block mt-1 font-black uppercase text-[10px] tracking-wider">VPN Não Necessária</span>
              </p>
            </div>
          </div>
        </div>

        {/* Painel do Certificado */}
        <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-2xl shadow-xl border border-gray-100 space-y-4">
          <h2 className="font-black text-lg flex items-center gap-2 text-[#0a192f] uppercase tracking-wide text-sm">
            <ShieldCheck className="w-5 h-5 text-emerald-600" /> Certificado Digital (A1)
          </h2>

          <div className="relative border-2 border-dashed border-gray-200 rounded-xl p-8 sm:p-10 text-center hover:border-[#1e3a8a] hover:bg-gray-50/50 transition-all group overflow-hidden">
            <input
              type="file"
              accept=".pfx,.p12"
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <div className="space-y-3 relative z-0">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto group-hover:bg-blue-50 transition-colors shadow-sm">
                <Upload className="w-8 h-8 text-gray-400 group-hover:text-[#1e3a8a]" />
              </div>
              <div>
                <p className="text-sm font-black text-[#0a192f]">
                  {file ? file.name : "Selecione o certificado da unidade"}
                </p>
                <p className="text-xs text-gray-500 font-medium mt-1">
                  {file ? `${(file.size / 1024).toFixed(2)} KB` : "Arraste o arquivo .pfx ou clique para procurar"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-amber-50/50 border border-amber-200 rounded-xl">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-xs font-black text-amber-900 uppercase tracking-widest">Segurança da Chave Privada</p>
              <p className="text-xs text-amber-800 leading-relaxed font-medium">
                O arquivo de certificado é processado localmente e assinado no servidor do Ecossistema Salomão.
                Certifique-se de que a senha está configurada corretamente no seu <code>.env</code>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Histórico Simulado */}
      <div className="max-w-7xl mx-auto w-full">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100 bg-white flex justify-between items-center">
            <h3 className="font-black text-[13px] uppercase tracking-widest text-[#0a192f]">Monitor de Transmissão</h3>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">Webservice Online</span>
          </div>
          <div className="p-12 text-center bg-gray-50/30">
            <div className="max-w-xs mx-auto space-y-4">
              <div className="p-4 rounded-full bg-gray-50 w-fit mx-auto shadow-sm border border-gray-100">
                <FileText className="w-10 h-10 text-gray-300" />
              </div>
              <p className="text-gray-500 text-sm font-medium">
                Aguardando primeira transmissão para a prefeitura de <span className="font-bold text-[#1e3a8a]">{selectedCity}</span>...
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmissaoNF;