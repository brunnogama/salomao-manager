import React from 'react';

export const DANFSePreview: React.FC = () => {
  return (
    <div className="max-w-[800px] mx-auto bg-white border-2 border-gray-400 text-[10px] text-gray-800 font-sans leading-tight shadow-lg">
      
      {/* HEADER ROW */}
      <div className="flex border-b-2 border-gray-400 p-2 items-center">
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
          {/* Brasão Rio placeholder */}
          <div className="w-8 h-10 bg-gray-200 border border-gray-300"></div>
          <div className="flex flex-col text-[10px] items-start">
            <span className="font-bold">Prefeitura da Cidade do Rio de Janeiro</span>
            <span>SMF / Receita Rio</span>
          </div>
        </div>
      </div>

      {/* CHAVE DE ACESSO & INFORMAÇÕES BÁSICAS */}
      <div className="flex border-b-2 border-gray-400">
        <div className="w-3/4 flex flex-col">
          <div className="p-1 border-b border-gray-300">
            <div className="font-bold">Chave de Acesso da NFS-e</div>
            <div className="bg-yellow-200 inline-block font-mono mt-0.5 px-1 text-[11px]">
               00000000000000000000000000000000000000000000000000
            </div>
          </div>
          <div className="flex border-b border-gray-300 h-full">
            <div className="w-1/3 p-1 border-r border-gray-300">
              <div className="font-bold">Número da NFS-e</div>
              <div className="bg-yellow-200 inline-block px-1 mt-0.5">000</div>
            </div>
            <div className="w-1/3 p-1 border-r border-gray-300">
              <div className="font-bold">Competência da NFS-e</div>
              <div className="bg-yellow-200 inline-block px-1 mt-0.5">MM/YYYY</div>
            </div>
            <div className="w-1/3 p-1">
              <div className="font-bold">Data e Hora da emissão da NFS-e</div>
              <div className="bg-yellow-200 inline-block px-1 mt-0.5">DD/MM/YYYY HH:MM:SS</div>
            </div>
          </div>
          <div className="flex h-full">
            <div className="w-1/3 p-1 border-r border-gray-300">
              <div className="font-bold">Número da DPS</div>
              <div>00</div>
            </div>
            <div className="w-1/3 p-1 border-r border-gray-300">
              <div className="font-bold">Série da DPS</div>
              <div className="bg-yellow-200 inline-block px-1 mt-0.5">00000</div>
            </div>
            <div className="w-1/3 p-1">
              <div className="font-bold">Data e Hora da emissão da DPS</div>
              <div className="bg-yellow-200 inline-block px-1 mt-0.5">DD/MM/YYYY HH:MM:SS</div>
            </div>
          </div>
        </div>
        <div className="w-1/4 flex flex-col p-2 items-center justify-center border-l border-gray-300">
          <div className="w-20 h-20 bg-yellow-200 border border-gray-400 p-1 flex items-center justify-center text-center">
             [ QR CODE MOCK ]
          </div>
          <div className="text-[7px] text-center mt-2 leading-tight">
            A autenticidade desta NFS-e pode ser verificada pela leitura deste código QR ou pela consulta da chave de acesso no portal nacional da NFS-e
          </div>
        </div>
      </div>

      {/* EMITENTE DA NFS-e */}
      <div className="border-b-2 border-gray-400 p-1 bg-gray-50 uppercase text-[9px] font-bold">
        Emitente da NFS-e
      </div>
      <div className="flex border-b border-gray-300">
        <div className="w-1/3 p-1 border-r border-gray-300">
             <div className="font-bold text-[9px]">CNPJ / CPF / NIF</div>
             <div className="mt-0.5">14.493.710/0001-05</div>
        </div>
        <div className="w-1/3 p-1 border-r border-gray-300">
             <div className="font-bold text-[9px]">Inscrição Municipal</div>
             <div className="mt-0.5">-</div>
        </div>
        <div className="w-1/3 p-1">
             <div className="font-bold text-[9px]">Telefone</div>
             <div className="mt-0.5">(21) 3212-6400</div>
        </div>
      </div>
      <div className="flex border-b border-gray-300">
        <div className="w-1/2 p-1 border-r border-gray-300">
             <div className="font-bold text-[9px]">Nome / Nome Empresarial</div>
             <div className="mt-0.5">SALOMAO, KAIUCA, ABRAHAO, RAPOSO & COTTA SOCIEDADE DE ADVOGADOS</div>
        </div>
        <div className="w-1/2 p-1">
             <div className="font-bold text-[9px]">E-mail</div>
             <div className="mt-0.5">-</div>
        </div>
      </div>
      <div className="flex border-b border-gray-300">
        <div className="w-1/2 p-1 border-r border-gray-300">
             <div className="font-bold text-[9px]">Endereço</div>
             <div className="mt-0.5">AVENIDA ALMIRANTE BARROSO, 52, CENTRO</div>
        </div>
        <div className="w-1/4 p-1 border-r border-gray-300">
             <div className="font-bold text-[9px]">Município</div>
             <div className="mt-0.5">Rio de Janeiro - RJ</div>
        </div>
         <div className="w-1/4 p-1">
             <div className="font-bold text-[9px]">CEP</div>
             <div className="mt-0.5">20031-918</div>
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
      <div className="border-b-2 border-gray-400 p-1 bg-yellow-200 uppercase text-[9px] font-bold border-t border-gray-400">
        Tomador do Serviço
      </div>
      <div className="flex border-b border-gray-300 bg-yellow-100">
        <div className="w-1/3 p-1 border-r border-gray-300">
             <div className="font-bold text-[9px]">CNPJ / CPF / NIF</div>
             <div className="mt-0.5 bg-yellow-200 inline-block px-1">[CNPJ_CLIENTE]</div>
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
      <div className="flex border-b border-gray-300 bg-yellow-100">
        <div className="w-1/2 p-1 border-r border-gray-300">
             <div className="font-bold text-[9px]">Nome / Nome Empresarial</div>
             <div className="mt-0.5 bg-yellow-200 inline-block px-1">[NOME_CLIENTE]</div>
        </div>
        <div className="w-1/2 p-1">
             <div className="font-bold text-[9px]">E-mail</div>
             <div className="mt-0.5 bg-yellow-200 inline-block px-1">[EMAIL_CLIENTE]</div>
        </div>
      </div>
      <div className="flex border-b border-gray-400 bg-yellow-100">
        <div className="w-1/2 p-1 border-r border-gray-300">
             <div className="font-bold text-[9px]">Endereço</div>
             <div className="mt-0.5 bg-yellow-200 inline-block px-1">[ENDERECO_CLIENTE]</div>
        </div>
        <div className="w-1/4 p-1 border-r border-gray-300">
             <div className="font-bold text-[9px]">Município</div>
             <div className="mt-0.5 bg-yellow-200 inline-block px-1">[MUNICIPIO_CLIENTE]</div>
        </div>
         <div className="w-1/4 p-1">
             <div className="font-bold text-[9px]">CEP</div>
             <div className="mt-0.5 bg-yellow-200 inline-block px-1">[CEP_CLIENTE]</div>
        </div>
      </div>

      {/* INTERMEDIÁRIO DO SERVIÇO */}
      <div className="border-b-2 border-gray-400 p-1 text-center font-bold text-[9px] uppercase bg-gray-50">
        INTERMEDIÁRIO DO SERVIÇO NÃO IDENTIFICADO NA NFS-e
      </div>

      {/* SERVIÇO PRESTADO */}
      <div className="border-b-2 border-gray-400 p-1 font-bold text-[9px] uppercase bg-gray-50 border-t border-gray-400">
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
             <div className="mt-0.5">Rio de Janeiro - RJ</div>
        </div>
         <div className="w-1/4 p-1">
             <div className="font-bold text-[9px]">País da Prestação</div>
             <div className="mt-0.5">-</div>
        </div>
      </div>
      <div className="p-1 border-b border-gray-400">
         <div className="font-bold text-[9px]">Descrição do Serviço</div>
         <div className="mt-0.5 bg-yellow-200 inline-block px-1 whitespace-pre-wrap">
            [DESCRICAO_DO_SERVICO_HONORARIOS_CONTRATO_ETC]
         </div>
         <div className="mt-1 text-[9px] text-gray-600">
           Dados bancários:<br/>
           Banco: Itaú (341)<br/>
           Agência: 6157-2<br/>
           Conta: 99384-8<br/>
           Favorecido: Salomão, Kaiuca, Abrahão, Raposo e Cotta Sociedade de Advogados<br/>
           CNPJ 14.493.710/0001-05
         </div>
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
             <div className="mt-0.5">Rio de Janeiro - RJ</div>
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
      <div className="flex border-b border-gray-300">
        <div className="w-1/4 p-1 border-r border-gray-300">
             <div className="font-bold text-[9px]">Valor do Serviço</div>
             <div className="mt-0.5 bg-yellow-200 inline-block px-1 font-bold">R$ [VALOR_SERVICO]</div>
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
      <div className="flex border-b border-gray-400">
        <div className="w-1/4 p-1 border-r border-gray-300">
             <div className="font-bold text-[9px]">BC ISSQN</div>
             <div className="mt-0.5">-</div>
        </div>
        <div className="w-1/4 p-1 border-r border-gray-300">
             <div className="font-bold text-[9px]">Alíquota Aplicada</div>
             <div className="mt-0.5">-</div>
        </div>
        <div className="w-1/4 p-1 border-r border-gray-300">
             <div className="font-bold text-[9px]">Retenção do ISSQN</div>
             <div className="mt-0.5">Não Retido</div>
        </div>
         <div className="w-1/4 p-1">
             <div className="font-bold text-[9px]">ISSQN Apurado</div>
             <div className="mt-0.5">-</div>
        </div>
      </div>

      {/* TRIBUTAÇÃO FEDERAL - ALL YELLOW */}
      <div className="border-b border-gray-400 p-1 font-bold text-[9px] uppercase bg-yellow-200">
        Tributação Federal
      </div>
      <div className="flex border-b border-gray-300 bg-yellow-100">
        <div className="w-1/4 p-1 border-r border-gray-300">
             <div className="font-bold text-[9px]">IRRF</div>
             <div className="mt-0.5 bg-yellow-200 inline-block px-1">R$ [VALOR_IRRF]</div>
        </div>
        <div className="w-1/4 p-1 border-r border-gray-300">
             <div className="font-bold text-[9px]">Contribuição Previdenciária - Retida</div>
             <div className="mt-0.5 bg-yellow-200 inline-block px-1">-</div>
        </div>
        <div className="w-1/4 p-1 border-r border-gray-300">
             <div className="font-bold text-[9px]">Contribuições Sociais - Retidas</div>
             <div className="mt-0.5 bg-yellow-200 inline-block px-1">R$ [VALOR_CSLL]</div>
        </div>
         <div className="w-1/4 p-1">
             <div className="font-bold text-[9px]">Descrição Contrib. Sociais - Retidas</div>
             <div className="mt-0.5 bg-yellow-200 inline-block px-1">3 - PIS/COFINS/CSLL Retidos</div>
        </div>
      </div>
      <div className="flex border-b border-gray-400 bg-yellow-100">
        <div className="w-1/4 p-1 border-r border-gray-300">
             <div className="font-bold text-[9px]">PIS - Débito Apuração Própria</div>
             <div className="mt-0.5 bg-yellow-200 inline-block px-1">R$ [VALOR_PIS]</div>
        </div>
        <div className="w-1/4 p-1 border-r border-gray-300">
             <div className="font-bold text-[9px]">COFINS - Débito Apuração Própria</div>
             <div className="mt-0.5 bg-yellow-200 inline-block px-1">R$ [VALOR_COFINS]</div>
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
      <div className="flex border-b border-gray-300 bg-yellow-100">
        <div className="w-1/4 p-1 border-r border-gray-300">
             <div className="font-bold text-[9px]">Valor do Serviço</div>
             <div className="mt-0.5 bg-yellow-200 inline-block px-1">R$ [VALOR_SERVICO]</div>
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
      <div className="flex border-b border-gray-400 bg-yellow-100 items-center">
        <div className="w-1/4 p-1 border-r border-gray-300">
             <div className="font-bold text-[9px]">Total das Retenções Federais</div>
             <div className="mt-0.5 bg-yellow-200 inline-block px-1">R$ [TOTAL_RETENCOES]</div>
        </div>
        <div className="w-1/4 p-1 border-r border-gray-300">
             <div className="font-bold text-[9px]">PIS/COFINS - Débito Apur. Própria</div>
             <div className="mt-0.5 bg-yellow-200 inline-block px-1">R$ [TOTAL_APURACAO]</div>
        </div>
        <div className="w-1/4 p-1 border-r border-gray-300 h-full">
             
        </div>
         <div className="w-1/4 p-1 flex flex-col justify-center">
             <div className="font-bold text-[9px]">Valor Líquido da NFS-e</div>
             <div className="mt-0.5 bg-yellow-200 inline-block px-1 font-bold text-sm">R$ [VALOR_LIQUIDO]</div>
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
