import React from 'react';
import { maskMoney, maskCNPJ } from '../../controladoria/utils/masks';
import { Loader2 } from 'lucide-react';

interface DANFSePreviewProps {
  prestadorDetails: any;
  selectedClient: any;
  discriminacao: string;
  setDiscriminacao: (val: string) => void;
  valorNF: number;
  irpj: number;
  pis: number;
  cofins: number;
  csll: number;
  valorLiquido: number;
  dataEmissao: string;
  isFetchingPrestador: boolean;
  selectedCity: string;
  chaveAcesso?: string;
  numeroNota?: string;
}

export const DANFSePreview: React.FC<DANFSePreviewProps> = ({
  prestadorDetails,
  selectedClient,
  discriminacao,
  setDiscriminacao,
  valorNF,
  irpj,
  pis,
  cofins,
  csll,
  valorLiquido,
  dataEmissao,
  isFetchingPrestador,
  selectedCity,
  chaveAcesso,
  numeroNota
}) => {
  const formatMoney = (val: number) => {
    if (!val && val !== 0) return '0,00';
    return (val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const padraoEnderecoCliente = selectedClient ? 'Conforme Cadastro Vínculado' : '-';
  const padraoMunicipioCliente = selectedClient ? 'Brasil' : '-';

  return (
    <div className="w-full bg-white border border-gray-400 text-[10px] text-gray-800 font-sans leading-tight shadow-sm select-none">
      
      {/* HEADER ROW */}
      <div className="flex border-b border-gray-400 p-2 items-center">
        <div className="w-1/4">
          <div className="flex items-center gap-1">
            <span className="text-3xl font-bold text-emerald-600 tracking-tighter">NFS<span className="text-blue-600">e</span></span>
            <div className="flex flex-col text-[8px] leading-[8px] text-gray-500 font-semibold justify-center">
              <span>Nota Fiscal de</span>
              <span>Serviço eletrônica</span>
            </div>
          </div>
        </div>
        <div className="w-2/4 text-center">
          <div className="font-bold text-sm">DANFSe v1.0</div>
          <div className="font-bold text-sm">Documento Auxiliar da NFS-e</div>
        </div>
        <div className="w-1/4 flex justify-end items-center gap-2">
          <div className="flex flex-col text-[10px] items-start">
            <span className="font-bold">Prefeitura da Cidade do {selectedCity}</span>
            <span>SMF / Receita</span>
          </div>
        </div>
      </div>

      {/* CHAVE DE ACESSO & INFORMAÇÕES BÁSICAS */}
      <div className="flex border-b border-gray-400">
        <div className="w-3/4 flex flex-col">
          <div className="p-1 border-b border-gray-300">
            <div className="font-bold">Chave de Acesso da NFS-e</div>
            {chaveAcesso ? (
              <div className="bg-emerald-200 border border-emerald-400 text-emerald-900 font-bold inline-block font-mono mt-0.5 px-2 py-0.5 text-[12px] shadow-sm animate-pulse rounded-sm">
                 {chaveAcesso}
              </div>
            ) : (
              <div className="bg-yellow-200 inline-block font-mono mt-0.5 px-1 text-[11px]">
                 00000000000000000000000000000000000000000000000000
              </div>
            )}
          </div>
          <div className="flex border-b border-gray-300 h-full">
            <div className="w-1/3 p-1 border-r border-gray-300">
              <div className="font-bold">Número da NFS-e</div>
              {numeroNota ? (
                 <div className="bg-emerald-200 border border-emerald-400 text-emerald-900 font-bold inline-block px-2 py-0.5 mt-0.5 font-mono text-[12px] shadow-sm animate-pulse rounded-sm">{numeroNota}</div>
              ) : (
                 <div className="bg-yellow-200 inline-block px-1 mt-0.5 font-mono">000000</div>
              )}
            </div>
            <div className="w-1/3 p-1 border-r border-gray-300">
              <div className="font-bold">Competência da NFS-e</div>
              <div className="bg-yellow-200 inline-block px-1 mt-0.5">
                 {dataEmissao ? new Date(dataEmissao).toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' }) : 'MM/YYYY'}
              </div>
            </div>
            <div className="w-1/3 p-1">
              <div className="font-bold">Data e Hora da emissão da NFS-e</div>
              <div className="bg-yellow-200 inline-block px-1 mt-0.5">{dataEmissao ? new Date(dataEmissao).toLocaleDateString('pt-BR') : 'DD/MM/YYYY'}</div>
            </div>
          </div>
          <div className="flex h-full">
            <div className="w-1/3 p-1 border-r border-gray-300">
              <div className="font-bold">Número da DPS</div>
              <div>000000</div>
            </div>
            <div className="w-1/3 p-1 border-r border-gray-300">
              <div className="font-bold">Série da DPS</div>
              <div className="bg-yellow-200 inline-block px-1 mt-0.5">0000</div>
            </div>
            <div className="w-1/3 p-1">
              <div className="font-bold">Data e Hora da emissão da DPS</div>
              <div className="bg-yellow-200 inline-block px-1 mt-0.5">{dataEmissao ? new Date(dataEmissao).toLocaleDateString('pt-BR') : 'DD/MM/YYYY'}</div>
            </div>
          </div>
        </div>
        <div className="w-1/4 flex flex-col p-2 items-center justify-center border-l border-gray-300">
          <div className="w-16 h-16 bg-yellow-200 border border-gray-400 flex items-center justify-center text-center text-[8px] font-bold">
             [QR CODE]
          </div>
          <div className="text-[7px] text-center mt-2 leading-tight">
            A autenticidade desta NFS-e pode ser verificada pela leitura deste código QR ou pela consulta da chave de acesso no portal nacional da NFS-e
          </div>
        </div>
      </div>

      {/* EMITENTE DA NFS-e */}
      <div className="border-b border-gray-400 p-1 bg-gray-50 uppercase text-[9px] font-bold flex items-center gap-2">
        Emitente da NFS-e
        {isFetchingPrestador && <Loader2 className="w-3 h-3 animate-spin text-blue-600" />}
      </div>
      <div className="flex border-b border-gray-300">
        <div className="w-1/3 p-1 border-r border-gray-300">
             <div className="font-bold text-[9px]">CNPJ / CPF / NIF</div>
             <div className="mt-0.5">{prestadorDetails?.cnpj || '-'}</div>
        </div>
        <div className="w-1/3 p-1 border-r border-gray-300">
             <div className="font-bold text-[9px]">Inscrição Municipal</div>
             <div className="mt-0.5">{prestadorDetails?.im || '-'}</div>
        </div>
        <div className="w-1/3 p-1">
             <div className="font-bold text-[9px]">Telefone</div>
             <div className="mt-0.5">(21) 3212-6400</div>
        </div>
      </div>
      <div className="flex border-b border-gray-300">
        <div className="w-1/2 p-1 border-r border-gray-300">
             <div className="font-bold text-[9px]">Nome / Nome Empresarial</div>
             <div className="mt-0.5">{prestadorDetails?.razao_social || 'SALOMAO, KAIUCA, ABRAHAO...'}</div>
        </div>
        <div className="w-1/2 p-1">
             <div className="font-bold text-[9px]">E-mail</div>
             <div className="mt-0.5">-</div>
        </div>
      </div>
      <div className="flex border-b border-gray-300">
        <div className="w-1/2 p-1 border-r border-gray-300">
             <div className="font-bold text-[9px]">Endereço</div>
             <div className="mt-0.5 truncate pr-2">{prestadorDetails?.endereco || '-'}</div>
        </div>
        <div className="w-1/4 p-1 border-r border-gray-300">
             <div className="font-bold text-[9px]">Município</div>
             <div className="mt-0.5">{prestadorDetails?.municipio || selectedCity} - {prestadorDetails?.uf || 'RJ'}</div>
        </div>
         <div className="w-1/4 p-1">
             <div className="font-bold text-[9px]">CEP</div>
             <div className="mt-0.5">-</div>
        </div>
      </div>
      <div className="flex border-b border-gray-400">
        <div className="w-1/2 p-1 border-r border-gray-300">
             <div className="font-bold text-[9px]">Simples Nacional na Data de Competência</div>
             <div className="mt-0.5">Não optante</div>
        </div>
        <div className="w-1/2 p-1">
             <div className="font-bold text-[9px]">Regime de Apuração Tributária pelo SN</div>
             <div className="mt-0.5">-</div>
        </div>
      </div>

      {/* TOMADOR DO SERVIÇO - ALL YELLOW */}
      <div className="border-b border-gray-400 p-1 bg-yellow-200 uppercase text-[9px] font-bold">
        Tomador do Serviço
      </div>
      <div className="flex border-b border-gray-300 bg-yellow-100/50">
        <div className="w-1/3 p-1 border-r border-gray-300">
             <div className="font-bold text-[9px]">CNPJ / CPF / NIF</div>
             <div className="mt-0.5 bg-yellow-200 inline-block px-1">
                {selectedClient ? (selectedClient.cnpj ? maskCNPJ(selectedClient.cnpj) : 'Sem CNPJ vinculado') : '-'}
             </div>
        </div>
        <div className="w-1/3 p-1 border-r border-gray-300">
             <div className="font-bold text-[9px]">Inscrição Municipal</div>
             <div className="mt-0.5 bg-yellow-200 inline-block px-1">-</div>
        </div>
        <div className="w-1/3 p-1">
             <div className="font-bold text-[9px]">Telefone</div>
             <div className="mt-0.5 bg-yellow-200 inline-block px-1">-</div>
        </div>
      </div>
      <div className="flex border-b border-gray-300 bg-yellow-100/50">
        <div className="w-1/2 p-1 border-r border-gray-300">
             <div className="font-bold text-[9px]">Nome / Nome Empresarial</div>
             <div className="mt-0.5 bg-yellow-200 inline-block px-1">{selectedClient ? selectedClient.name : 'Aguardando Seleção de Cliente...'}</div>
        </div>
        <div className="w-1/2 p-1 relative group cursor-pointer z-50">
             <div className="font-bold text-[9px]">E-mail</div>
             <div className="mt-0.5 bg-yellow-200 inline-block px-1">{selectedClient && selectedClient.email ? selectedClient.email : 'Preenchido no menu lateral'}</div>
        </div>
      </div>
      <div className="flex border-b border-gray-400 bg-yellow-100/50">
        <div className="w-1/2 p-1 border-r border-gray-300">
             <div className="font-bold text-[9px]">Endereço</div>
             <div className="mt-0.5 bg-yellow-200 inline-block px-1">{padraoEnderecoCliente}</div>
        </div>
        <div className="w-1/4 p-1 border-r border-gray-300">
             <div className="font-bold text-[9px]">Município</div>
             <div className="mt-0.5 bg-yellow-200 inline-block px-1">{padraoMunicipioCliente}</div>
        </div>
         <div className="w-1/4 p-1">
             <div className="font-bold text-[9px]">CEP</div>
             <div className="mt-0.5 bg-yellow-200 inline-block px-1">-</div>
        </div>
      </div>

      {/* INTERMEDIÁRIO DO SERVIÇO */}
      <div className="border-b border-gray-400 p-1 text-center font-bold text-[9px] uppercase bg-gray-50">
        INTERMEDIÁRIO DO SERVIÇO NÃO IDENTIFICADO NA NFS-e
      </div>

      {/* SERVIÇO PRESTADO */}
      <div className="border-b border-gray-400 p-1 font-bold text-[9px] uppercase bg-gray-50">
        Serviço Prestado
      </div>
      <div className="flex border-b border-gray-300">
        <div className="w-1/4 p-1 border-r border-gray-300">
             <div className="font-bold text-[9px]">Código de Tributação Nacional</div>
             <div className="mt-0.5">17.14.01 - Advocacia</div>
        </div>
        <div className="w-1/4 p-1 border-r border-gray-300">
             <div className="font-bold text-[9px]">Código de Tributação Municipal</div>
             <div className="mt-0.5">001 - Advocacia.</div>
        </div>
        <div className="w-1/4 p-1 border-r border-gray-300">
             <div className="font-bold text-[9px]">Local da Prestação</div>
             <div className="mt-0.5">{selectedCity || '-'}</div>
        </div>
         <div className="w-1/4 p-1">
             <div className="font-bold text-[9px]">País da Prestação</div>
             <div className="mt-0.5">-</div>
        </div>
      </div>
      <div className="p-1 border-b border-gray-400 flex flex-col group relative">
         <div className="font-bold text-[9px]">Descrição do Serviço</div>
         {/* TEXTAREA ATRAVESSANDO O VISUAL PARA EDIÇÃO REAIS */}
         <textarea 
            value={discriminacao}
            onChange={(e) => setDiscriminacao(e.target.value)}
            disabled={!selectedClient}
            className={`mt-0.5 bg-yellow-200 w-full min-h-[60px] p-1 font-mono text-[10px] resize-none outline-none focus:ring-1 focus:ring-[#1e3a8a] ${!selectedClient ? 'opacity-50' : ''} custom-scrollbar block z-50 relative`}
            placeholder="Digite a discriminação do serviço após selecionar o cliente..."
         />
         <div className="mt-1 text-[9px] text-gray-600 pointer-events-none">
           Dados bancários:<br/>
           Banco: Itaú (341)<br/>
           Agência: 6157-2<br/>
           Conta: 99384-8<br/>
           Favorecido: Salomão, Kaiuca, Abrahão, Raposo e Cotta Sociedade de Advogados<br/>
           CNPJ 14.493.710/0001-05
         </div>
         {!selectedClient && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 bg-white/40">
               <span className="text-xs text-gray-400 font-bold uppercase tracking-widest rotate-[-5deg]">AGUARDANDO CLIENTE</span>
            </div>
         )}
      </div>

      {/* TRIBUTAÇÃO MUNICIPAL */}
      <div className="border-b border-gray-400 p-1 font-bold text-[9px] uppercase bg-gray-50">
        Tributação Municipal
      </div>
      <div className="flex border-b border-gray-300">
        <div className="w-1/4 p-1 border-r border-gray-300">
             <div className="font-bold text-[9px]">Tributação do ISSQN</div>
             <div className="mt-0.5">Operação Tributável</div>
        </div>
        <div className="w-1/4 p-1 border-r border-gray-300">
             <div className="font-bold text-[9px]">País Resultado da Prestação do Serviço</div>
             <div className="mt-0.5">-</div>
        </div>
        <div className="w-1/4 p-1 border-r border-gray-300">
             <div className="font-bold text-[9px]">Município de Incidência do ISSQN</div>
             <div className="mt-0.5">{selectedCity || '-'}</div>
        </div>
         <div className="w-1/4 p-1">
             <div className="font-bold text-[9px]">Regime Especial de Tributação</div>
             <div className="mt-0.5">Sociedade de Profissionais</div>
        </div>
      </div>
      <div className="flex border-b border-gray-300">
        <div className="w-1/4 p-1 border-r border-gray-300">
             <div className="font-bold text-[9px]">Tipo de Imunidade</div>
             <div className="mt-0.5">-</div>
        </div>
        <div className="w-1/4 p-1 border-r border-gray-300">
             <div className="font-bold text-[9px]">Suspensão da Exigibilidade do ISSQN</div>
             <div className="mt-0.5">Não</div>
        </div>
        <div className="w-1/4 p-1 border-r border-gray-300">
             <div className="font-bold text-[9px]">Número Processo Suspensão</div>
             <div className="mt-0.5">-</div>
        </div>
         <div className="w-1/4 p-1">
             <div className="font-bold text-[9px]">Benefício Municipal</div>
             <div className="mt-0.5">-</div>
        </div>
      </div>
      <div className="flex border-b border-gray-400">
        <div className="w-1/4 p-1 border-r border-gray-300">
             <div className="font-bold text-[9px]">Valor do Serviço</div>
             <div className="mt-0.5 bg-yellow-200 inline-block px-1 font-bold">{formatMoney(valorNF)}</div>
        </div>
        <div className="w-1/4 p-1 border-r border-gray-300">
             <div className="font-bold text-[9px]">Desconto Incondicionado</div>
             <div className="mt-0.5">-</div>
        </div>
        <div className="w-1/4 p-1 border-r border-gray-300">
             <div className="font-bold text-[9px]">Total Deduções/Reduções</div>
             <div className="mt-0.5">-</div>
        </div>
         <div className="w-1/4 p-1">
             <div className="font-bold text-[9px]">Cálculo do BM</div>
             <div className="mt-0.5">-</div>
        </div>
      </div>

      {/* TRIBUTAÇÃO FEDERAL - ALL YELLOW */}
      <div className="border-b border-gray-400 p-1 font-bold text-[9px] uppercase bg-yellow-200">
        Tributação Federal
      </div>
      <div className="flex border-b border-gray-300 bg-yellow-100/50">
        <div className="w-1/4 p-1 border-r border-gray-300">
             <div className="font-bold text-[9px]">IRRF</div>
             <div className="mt-0.5 bg-yellow-200 inline-block px-1">{formatMoney(irpj)}</div>
        </div>
        <div className="w-1/4 p-1 border-r border-gray-300">
             <div className="font-bold text-[9px]">Contribuição Previdenciária - Retida</div>
             <div className="mt-0.5 bg-yellow-200 inline-block px-1">-</div>
        </div>
        <div className="w-1/4 p-1 border-r border-gray-300">
             <div className="font-bold text-[9px]">Contribuições Sociais - Retidas</div>
             <div className="mt-0.5 bg-yellow-200 inline-block px-1">{formatMoney(csll)}</div>
        </div>
         <div className="w-1/4 p-1">
             <div className="font-bold text-[9px]">Descrição Contrib. Sociais - Retidas</div>
             <div className="mt-0.5 bg-yellow-200 inline-block px-1">3 - PIS/COFINS/CSLL Retidos</div>
        </div>
      </div>
      <div className="flex border-b border-gray-400 bg-yellow-100/50">
        <div className="w-1/4 p-1 border-r border-gray-300">
             <div className="font-bold text-[9px]">PIS - Débito Apuração Própria</div>
             <div className="mt-0.5 bg-yellow-200 inline-block px-1">{formatMoney(pis)}</div>
        </div>
        <div className="w-1/4 p-1 border-r border-gray-300">
             <div className="font-bold text-[9px]">COFINS - Débito Apuração Própria</div>
             <div className="mt-0.5 bg-yellow-200 inline-block px-1">{formatMoney(cofins)}</div>
        </div>
        <div className="w-1/4 p-1 border-r border-gray-300">
             
        </div>
         <div className="w-1/4 p-1">
            
        </div>
      </div>

      {/* VALOR TOTAL DA NFS-E - ALL YELLOW */}
      <div className="border-b border-gray-400 p-1 font-bold text-[9px] uppercase bg-yellow-200">
        Valor Total da NFS-e
      </div>
      <div className="flex border-b border-gray-300 bg-yellow-100/50">
        <div className="w-1/4 p-1 border-r border-gray-300">
             <div className="font-bold text-[9px]">Valor do Serviço</div>
             <div className="mt-0.5 bg-yellow-200 inline-block px-1">{formatMoney(valorNF)}</div>
        </div>
        <div className="w-1/4 p-1 border-r border-gray-300">
             <div className="font-bold text-[9px]">Desconto Condicionado</div>
             <div className="mt-0.5 bg-yellow-200 inline-block px-1">-</div>
        </div>
        <div className="w-1/4 p-1 border-r border-gray-300">
             <div className="font-bold text-[9px]">Desconto Incondicionado</div>
             <div className="mt-0.5 bg-yellow-200 inline-block px-1">-</div>
        </div>
         <div className="w-1/4 p-1">
             <div className="font-bold text-[9px]">ISSQN Retido</div>
             <div className="mt-0.5 bg-yellow-200 inline-block px-1">-</div>
        </div>
      </div>
      <div className="flex border-b border-gray-400 bg-yellow-100/50 items-center">
        <div className="w-1/4 p-1 border-r border-gray-300">
             <div className="font-bold text-[9px]">Total das Retenções Federais</div>
             <div className="mt-0.5 bg-yellow-200 inline-block px-1">{formatMoney(irpj + csll)}</div>
        </div>
        <div className="w-1/4 p-1 border-r border-gray-300">
             <div className="font-bold text-[9px]">PIS/COFINS - Débito Apur. Própria</div>
             <div className="mt-0.5 bg-yellow-200 inline-block px-1">{formatMoney(pis + cofins)}</div>
        </div>
        <div className="w-1/4 p-1 border-r border-gray-300 h-full">
             
        </div>
         <div className="w-1/4 p-1 flex flex-col justify-center">
             <div className="font-bold text-[9px]">Valor Líquido da NFS-e</div>
             <div className="mt-0.5 bg-yellow-200 inline-block px-1 font-bold text-sm">{formatMoney(valorLiquido)}</div>
        </div>
      </div>

      {/* TOTAIS APROXIMADOS */}
      <div className="border-b border-gray-300 p-1 font-bold text-[9px] uppercase bg-gray-50">
        Totais Aproximados dos Tributos
      </div>
      <div className="flex border-b border-gray-400">
        <div className="w-1/3 p-1 border-r border-gray-300 text-center">
             <div className="font-bold text-[9px]">Federais</div>
             <div className="mt-0.5">R$ 0,00</div>
        </div>
        <div className="w-1/3 p-1 border-r border-gray-300 text-center">
             <div className="font-bold text-[9px]">Estaduais</div>
             <div className="mt-0.5">R$ 0,00</div>
        </div>
        <div className="w-1/3 p-1 text-center">
             <div className="font-bold text-[9px]">Municipais</div>
             <div className="mt-0.5">R$ 0,00</div>
        </div>
      </div>

      {/* INFORMAÇÕES COMPLEMENTARES */}
      <div className="p-1 font-bold text-[9px] uppercase bg-gray-50">
        Informações Complementares
      </div>
      <div className="p-1 pb-4">
         <div className="mt-0.5">NBS: 113019000</div>
      </div>

    </div>
  );
};
