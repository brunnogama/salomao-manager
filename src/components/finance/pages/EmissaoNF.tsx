import React, { useState } from 'react';
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
      alert("Por favor, selecione o certificado .pfx para o Rio de Janeiro.");
      return;
    }

    setIsUploading(true);
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
        alert("Nota assinada e enviada com sucesso!");
        console.log("XML de Retorno:", data.xml);
      } else {
        alert("Erro na emissão: " + data.erro);
      }
    } catch (error) {
      console.error("Erro ao conectar com o serviço de assinatura:", error);
      alert("Serviço de assinatura offline. Certifique-se que o script Python está a correr.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="text-blue-600" /> Emissão de Notas Fiscais (NFS-e)
          </h1>
          <p className="text-slate-500 text-sm">Gestão centralizada de faturação para múltiplas capitais</p>
        </div>
        <button
          onClick={handleEmitirNota}
          disabled={isUploading}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold text-white transition-all ${isUploading ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200'
            }`}
        >
          {isUploading ? <Clock className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {isUploading ? 'A processar...' : 'Transmitir Nota'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel de Configuração */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
            <h2 className="font-semibold text-lg flex items-center gap-2 text-slate-700">
              <Globe className="w-5 h-5 text-blue-500" /> Configuração Regional
            </h2>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600">Cidade de Emissão</label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white transition-all"
              >
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg flex gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-800 leading-relaxed">
                A conexão com a prefeitura de <strong>{selectedCity}</strong> será realizada via Web Service direto.
                <span className="block mt-1 font-semibold">VPN Não Necessária.</span>
              </p>
            </div>
          </div>
        </div>

        {/* Painel do Certificado */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <h2 className="font-semibold text-lg flex items-center gap-2 text-slate-700">
            <ShieldCheck className="w-5 h-5 text-green-600" /> Certificado Digital (A1)
          </h2>

          <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-10 text-center hover:border-blue-400 hover:bg-slate-50 transition-all group">
            <input
              type="file"
              accept=".pfx,.p12"
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <div className="space-y-3">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto group-hover:bg-blue-100 transition-colors">
                <Upload className="w-8 h-8 text-slate-400 group-hover:text-blue-600" />
              </div>
              <div>
                <p className="text-base font-medium text-slate-700">
                  {file ? file.name : "Selecione o certificado da unidade"}
                </p>
                <p className="text-sm text-slate-500">
                  {file ? `${(file.size / 1024).toFixed(2)} KB` : "Arraste o ficheiro .pfx ou clique para procurar"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-amber-900">Segurança da Chave Privada</p>
              <p className="text-xs text-amber-800 leading-relaxed">
                O ficheiro de certificado é processado localmente e assinado no servidor do Ecossistema Salomão.
                Certifique-se de que a senha está configurada corretamente no ficheiro <code>.env</code>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Histórico Simulado */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="font-semibold text-slate-700">Monitor de Transmissão</h3>
          <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-full">Webservice Online</span>
        </div>
        <div className="p-12 text-center">
          <div className="max-w-xs mx-auto space-y-3">
            <FileText className="w-12 h-12 text-slate-200 mx-auto" />
            <p className="text-slate-500 text-sm italic">
              Aguardando primeira transmissão para a prefeitura de {selectedCity}...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmissaoNF;