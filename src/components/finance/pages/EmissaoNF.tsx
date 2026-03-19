import React, { useState } from 'react';
import { FileText, Upload, ShieldCheck, Globe, AlertCircle } from 'lucide-react';

const EmissaoNF = () => {
  const [selectedCity, setSelectedCity] = useState('Rio de Janeiro');
  const [file, setFile] = useState<File | null>(null);

  const cities = [
    'Belém', 'Brasília', 'Florianópolis', 'Rio de Janeiro', 'São Paulo', 'Vitória'
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <FileText className="text-blue-600" /> Emissão de Notas Fiscais (NFS-e)
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card de Configuração */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Globe className="w-5 h-5 text-slate-500" /> Localidade
          </h2>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
          <p className="text-xs text-slate-500">
            O sistema utilizará o provedor específico para {selectedCity} sem necessidade de VPN.
          </p>
        </div>

        {/* Card de Certificado */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4 md:col-span-2">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-green-600" /> Certificado Digital (A1)
          </h2>

          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
            <input
              type="file"
              accept=".pfx,.p12"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-600">
              {file ? `Arquivo selecionado: ${file.name}` : "Clique ou arraste o arquivo .pfx da unidade para fazer o upload"}
            </p>
          </div>

          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <p className="text-xs text-amber-800">
              A senha do certificado deve ser configurada no arquivo de ambiente (.env) do servidor para maior segurança.
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Notas Recentes (Placeholder) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-semibold">Últimas Notas Emitidas</h3>
        </div>
        <div className="p-8 text-center text-slate-500 italic">
          Nenhuma nota emitida recentemente para {selectedCity}.
        </div>
      </div>
    </div>
  );
};

export default EmissaoNF;