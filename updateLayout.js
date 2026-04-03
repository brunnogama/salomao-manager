const fs = require('fs');
const filepath = './src/components/finance/pages/EmissaoNF.tsx';
let content = fs.readFileSync(filepath, 'utf-8');

const returnRegex = /  return \([\s\S]*\}\;/;
const newReturn = `  const honorariosSorted = honorarios.filter(h => h.contract?.id === selectedContract?.id).sort((a, b) => {
    const order = ['pro_labore', 'intermediate_fee', 'fixed_monthly_fee', 'success_fee', 'final_success_fee', 'other_fees'];
    let iA = order.indexOf(a.type);
    let iB = order.indexOf(b.type);
    if (iA === -1) iA = 99;
    if (iB === -1) iB = 99;
    return iA - iB;
  });

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 space-y-4 sm:space-y-6 relative p-4 sm:p-6 min-h-[calc(100vh-60px)]">
      {/* PAGE HEADER */}
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

        <div className="flex items-center gap-4 shrink-0 w-full md:w-auto mt-2 md:mt-0 justify-end flex-wrap">
          <div className="flex flex-col">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 text-right">Cidade de Emissão</label>
            <div className="relative group">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1e3a8a]/50" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-56 appearance-none bg-gray-50 border border-gray-200 text-[#1e3a8a] text-sm font-bold rounded-lg pl-9 pr-8 py-2.5 outline-none focus:border-[#1e3a8a] focus:ring-2 focus:ring-blue-50 transition-all cursor-pointer shadow-sm hover:border-[#1e3a8a]/50"
              >
                <option value="" disabled>Selecione a cidade</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1e3a8a]/50 pointer-events-none group-hover:text-[#1e3a8a]" />
            </div>
          </div>

          <button
            onClick={handleEmitirNota}
            disabled={isUploading}
            title="Transmitir Nota"
            className={\`w-12 h-12 shrink-0 flex items-center justify-center rounded-full shadow-lg transition-all duration-300 active:scale-95 \${
              isUploading || !selectedClient || !selectedHonorario 
                ? 'bg-gray-300 text-white cursor-not-allowed hidden' 
                : 'bg-gradient-to-br from-[#1e3a8a] to-[#0a192f] text-white hover:shadow-xl hover:-translate-y-0.5 ring-4 ring-white'
            }\`}
          >
            {isUploading ? <Clock className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 -ml-0.5" />}
          </button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 w-full flex-1">
        
        {/* PAINEL ESQUERDO: CLIENTE E HONORÁRIOS */}
        <div className="lg:col-span-1 flex flex-col gap-4 sm:gap-6 h-full min-h-[600px]">
          {/* CLIENT SELECT */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-xl border border-gray-100 shrink-0 relative z-30">
            <h2 className="font-black text-lg flex items-center gap-2 text-[#0a192f] uppercase tracking-wide text-sm mb-4">
              <Building2 className="w-5 h-5 text-[#1e3a8a]" /> Tomador (Cliente)
            </h2>

            <div className="relative" ref={clientDropdownRef}>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block">Selecione o Cliente</label>
              <div
                onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                className={\`w-full bg-gray-50 border \${isClientDropdownOpen ? 'border-[#1e3a8a] ring-2 ring-blue-100' : 'border-gray-200'} rounded-xl p-3 flex flex-col justify-center cursor-pointer hover:border-[#1e3a8a] transition-all\`}
              >
                <div className="flex justify-between items-center w-full">
                  <div className="flex flex-col truncate">
                    <span className={\`text-sm font-bold truncate \${selectedClient ? 'text-gray-900' : 'text-gray-400'}\`}>
                      {selectedClient ? selectedClient.name : 'Buscar cliente...'}
                    </span>
                    {selectedClient && selectedClient.cnpj && (
                      <span className="text-[11px] font-semibold text-gray-500 mt-0.5">CNPJ: {maskCNPJ(selectedClient.cnpj)}</span>
                    )}
                  </div>
                  <ChevronDown className={\`w-4 h-4 text-gray-400 transition-transform \${isClientDropdownOpen ? 'rotate-180' : ''}\`} />
                </div>
              </div>

              {isClientDropdownOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                  <div className="p-2 bg-gray-50 border-b border-gray-100 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Nome ou CNPJ..."
                      className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm font-medium outline-none focus:border-[#1e3a8a]"
                      value={clientSearch}
                      onChange={e => setClientSearch(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="max-h-[250px] overflow-y-auto p-2">
                    {filteredClients.length > 0 ? (
                      filteredClients.map(c => (
                        <div
                          key={c.id}
                          onClick={() => handleSelectClient(c)}
                          className="w-full text-left p-2.5 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors flex flex-col"
                        >
                          <span className="text-sm font-bold text-gray-800">{c.name}</span>
                          {c.cnpj ? (
                            <span className="text-[11px] font-semibold text-gray-500 mt-0.5">{maskCNPJ(c.cnpj)}</span>
                          ) : (
                            <span className="text-[11px] font-medium text-gray-400 mt-0.5 italic">Sem CNPJ vinculado</span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center space-y-3">
                        <p className="text-xs text-gray-500 font-medium">Nenhum cliente encontrado.</p>
                        {clientSearch.trim().length > 1 && (
                          <button
                            onClick={handleAddClient}
                            className="w-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 py-2 rounded-lg text-xs font-bold transition-colors"
                          >
                            + Confirmar e Adicionar Novo
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* VÍNCULO FINANCEIRO PENDENTE */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-xl border border-gray-100 flex-1 flex flex-col overflow-hidden relative z-20">
            <h2 className="font-black text-lg flex items-center gap-2 text-[#0a192f] uppercase tracking-wide text-sm shrink-0 mb-4">
              <Coins className="w-5 h-5 text-amber-500" /> Vínculo Financeiro Pendente
            </h2>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 mb-2">
              {!selectedClient ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                  <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                    <Search className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-sm font-semibold text-gray-500">
                    Selecione um cliente para exibir os honorários pendentes.
                  </p>
                </div>
              ) : availableContracts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                    <CheckCircle className="w-8 h-8 text-emerald-500" />
                  </div>
                  <p className="text-sm font-semibold text-emerald-700">
                    Nenhum honorário pendente encontrado para este cliente.
                  </p>
                </div>
              ) : availableContracts.length > 1 && !selectedContract ? (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                     <p className="text-sm font-semibold text-amber-800">
                        Este cliente possui honorários em múltiplos contratos. Selecione:
                     </p>
                  </div>
                  <div className="flex flex-col gap-3">
                    {availableContracts.map(contract => (
                      <div
                        key={contract.id}
                        onClick={() => setSelectedContract(contract)}
                        className="p-4 rounded-xl cursor-pointer transition-all border bg-white border-gray-200 hover:border-[#1e3a8a] hover:shadow-md flex flex-col gap-2"
                      >
                        <span className="text-sm font-black text-[#1e3a8a] break-words">
                          {contract.reference || 'Sem referência'}
                        </span>
                        <span className="text-xs text-gray-500 font-semibold">
                          HON: {contract.hon_number || 'S/N'}
                        </span>
                        <span className="text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-100 self-start px-2 py-1 rounded-md">
                          {honorarios.filter(h => h.contract?.id === contract.id).length} Honorários pendentes
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-300 flex flex-col h-full">
                  <div className="flex flex-col p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 shadow-sm shrink-0 gap-3">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Contrato Selecionado</span>
                      <span className="text-sm font-black text-[#1e3a8a]">{selectedContract?.reference || 'Sem referência'}</span>
                      <span className="text-xs font-semibold text-gray-500 mt-0.5">HON: {selectedContract?.hon_number || 'S/N'}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                       {getPdfUrl(selectedContract?.documents) && (
                         <button
                           onClick={() => window.open(getPdfUrl(selectedContract?.documents) || undefined, '_blank')}
                           className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:from-blue-700 hover:to-indigo-800 shadow-sm rounded-lg text-[10px] uppercase font-black tracking-widest transition-all"
                         >
                           <FileText className="w-3 h-3" /> Ver Contrato
                         </button>
                       )}
                       {availableContracts.length > 1 && (
                         <button
                           onClick={() => { setSelectedContract(null); setSelectedHonorario(null); setValorNF(0); }}
                           className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 shadow-sm rounded-lg text-[10px] uppercase font-black tracking-widest transition-all"
                         >
                           Trocar
                         </button>
                       )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    {honorariosSorted.map(hon => {
                      const isSelected = selectedHonorario?.id === hon.id;
                      return (
                        <div
                          key={hon.id}
                          onClick={() => handleSelectHonorario(hon)}
                          className={\`p-4 rounded-xl cursor-pointer transition-all border group relative overflow-hidden flex flex-col \${
                            isSelected ? 'bg-blue-50/80 border-[#1e3a8a] ring-1 ring-[#1e3a8a]' : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
                          }\`}
                        >
                          {isSelected && <div className="absolute top-0 left-0 w-1 h-full bg-[#1e3a8a]" />}
                          <div className="flex justify-between items-center mb-3 gap-2">
                            <span className={\`text-[10px] uppercase tracking-widest font-black px-2 py-1 rounded-md \${isSelected ? 'bg-[#1e3a8a] text-white' : 'bg-gray-100 text-gray-600'}\`}>
                              {formatTypeText(hon.type)}
                            </span>
                            <span className={\`text-base font-black truncate \${isSelected ? 'text-[#1e3a8a]' : 'text-gray-900'}\`}>
                              {maskMoney(Number(hon.amount || 0).toFixed(2))}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[11px] font-semibold text-gray-600 flex items-center justify-between">
                              <span className="text-gray-400">Parcela:</span>
                              <span>{hon.installment_number} de {hon.total_installments}</span>
                            </p>
                            {hon.due_date && (
                              <p className="text-[11px] font-semibold text-gray-600 flex items-center justify-between">
                                <span className="text-gray-400">Vencimento:</span>
                                <span>{new Date(hon.due_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PAINEL DIREITO: SIMULADOR DE NOTA FISCAL */}
        <div className="lg:col-span-2 relative min-h-[700px] bg-white border-[3px] border-gray-800 flex flex-col shadow-xl font-sans text-gray-900 overflow-hidden shrink-0 mt-4 lg:mt-0 xl:mr-6 lg:ml-2">
            
            {/* Watermark */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.02] rotate-[-45deg] z-0">
              <span className="text-[120px] font-black tracking-[0.3em] uppercase">SIMULAÇÃO</span>
            </div>

            {/* HEADER NF */}
            <div className="flex border-b-[3px] border-gray-800 relative z-10 shrink-0 bg-white">
              <div className="w-24 sm:w-32 flex items-center justify-center border-r-[3px] border-gray-800 p-2 sm:p-4 shrink-0">
                <Globe className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300" strokeWidth={1.5} />
              </div>
              <div className="flex-1 flex flex-col items-center justify-center text-center p-2 hidden sm:flex">
                <h2 className="font-black text-[11px] sm:text-[13px] uppercase tracking-wide">Prefeitura da Cidade do {selectedCity}</h2>
                <h3 className="font-bold text-[9px] sm:text-[11px] uppercase mb-1">Secretaria Municipal de Fazenda</h3>
                <h1 className="font-black text-sm sm:text-lg uppercase tracking-wide mt-1">Nota Fiscal de Serviços Eletrônica</h1>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center text-center p-2 sm:hidden">
                <h1 className="font-black text-sm uppercase tracking-wide leading-tight">NFS-e<br/>{selectedCity}</h1>
              </div>
              <div className="w-32 sm:w-44 border-l-[3px] border-gray-800 flex flex-col text-[9px] sm:text-[10px] shrink-0">
                <div className="border-b-[3px] border-gray-800 p-1 flex flex-col flex-1 justify-center bg-gray-50">
                  <span className="font-semibold px-1">Número da Nota</span>
                  <span className="font-black text-sm sm:text-base text-center">00000000</span>
                </div>
                <div className="border-b-[3px] border-gray-800 p-1 flex flex-col flex-1 justify-center">
                  <span className="font-semibold px-1">Data e Hora</span>
                  <span className="font-black text-center">{new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>
                <div className="p-1 flex flex-col flex-1 justify-center bg-gray-50">
                  <span className="font-semibold px-1">Código Verificação</span>
                  <span className="font-black text-center text-xs tracking-widest text-[#1e3a8a]">ABCD-1234</span>
                </div>
              </div>
            </div>

            {/* PRESTADOR */}
            <div className="border-b-[3px] border-gray-800 flex flex-col relative z-10 shrink-0 bg-white">
              <div className="bg-gray-200 text-center font-black uppercase text-[10px] sm:text-[11px] py-1 border-b border-gray-400">
                Prestador de Serviços
              </div>
              <div className="flex flex-col p-2 sm:p-3 text-[9px] sm:text-[11px] space-y-1.5 leading-tight">
                <div className="flex justify-between flex-wrap gap-2">
                  <div><strong>CPF/CNPJ:</strong> 00.000.000/0001-00</div>
                  <div><strong>Inscrição Municipal:</strong> 123456</div>
                  <div><strong>Inscrição Estadual:</strong> ISENTO</div>
                </div>
                <div><strong>Nome/Razão Social:</strong> SALOMÃO ADVOGADOS ASSOCIADOS</div>
                <div className="flex justify-between flex-wrap gap-2">
                  <div className="truncate pr-2"><strong>Endereço:</strong> Rua Exemplo, 123 - Centro - CEP: 00000-000</div>
                  <div><strong>Município:</strong> {selectedCity} - {selectedCity === 'Rio de Janeiro' ? 'RJ' : 'UF'}</div>
                </div>
              </div>
            </div>

            {/* TOMADOR */}
            <div className="border-b-[3px] border-gray-800 flex flex-col relative z-10 shrink-0 bg-white">
              <div className="bg-gray-200 text-center font-black uppercase text-[10px] sm:text-[11px] py-1 border-b border-gray-400">
                Tomador de Serviços
              </div>
              <div className="flex flex-col p-2 sm:p-3 text-[9px] sm:text-[11px] space-y-1.5 leading-tight min-h-[70px]">
                {selectedClient ? (
                  <>
                    <div className="flex justify-between flex-wrap gap-2">
                      <div><strong>CPF/CNPJ:</strong> {maskCNPJ(selectedClient.cnpj || '') || 'Não Informado'}</div>
                      <div><strong>Inscrição Municipal:</strong> ----</div>
                      <div><strong>Inscrição Estadual:</strong> ----</div>
                    </div>
                    <div><strong>Nome/Razão Social:</strong> <span className="font-bold">{selectedClient.name}</span></div>
                    <div className="flex justify-between flex-wrap gap-2 text-gray-600">
                      <div><strong>Endereço:</strong> Conforme Cadastro Vínculado</div>
                      <div><strong>Município:</strong> Brasil</div>
                    </div>
                  </>
                ) : (
                  <div className="text-gray-400 italic text-center mt-3 font-medium flex items-center justify-center gap-2">
                    <Search className="w-3 h-3" /> Selecione um cliente à esquerda para auto-preencher os dados do tomador.
                  </div>
                )}
              </div>
            </div>

            {/* DISCRIMINAÇÃO */}
            <div className="border-b-[3px] border-gray-800 flex flex-col flex-1 relative z-10 bg-white">
               <div className="bg-gray-200 text-center font-black uppercase text-[10px] sm:text-[11px] py-1 border-b border-gray-400 shrink-0 flex items-center justify-center gap-2">
                  Discriminação dos Serviços
                  {selectedHonorario && <span className="text-[8px] bg-green-200 text-green-800 font-bold px-1.5 py-0.5 rounded-sm">AUTOMÁTICO</span>}
               </div>
               <div className="flex-1 flex p-1 relative">
                 <textarea
                    value={discriminacao}
                    onChange={(e) => setDiscriminacao(e.target.value)}
                    disabled={!selectedClient}
                    spellCheck={false}
                    className="w-full h-full resize-none outline-none bg-transparent text-[11px] sm:text-[13px] font-mono leading-relaxed p-2 sm:p-3 focus:ring-inset focus:ring-2 focus:ring-[#1e3a8a]/20 disabled:text-gray-500 custom-scrollbar"
                 />
                 {!selectedClient && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                       <span className="text-xs text-gray-300 font-bold uppercase tracking-widest rotate-[-10deg]">AGUARDANDO CLIENTE</span>
                    </div>
                 )}
               </div>
            </div>

            {/* VALOR DA NOTA E IMPOSTOS */}
            <div className="flex flex-col shrink-0 relative z-10 bg-white">
               {/* MAIN VALOR */}
               <div className="border-b-[3px] border-gray-800 flex items-stretch h-14 sm:h-16">
                 <div className="bg-gray-200 flex items-center justify-center font-black uppercase text-[11px] sm:text-[13px] px-4 sm:px-8 border-r border-gray-400 shrink-0">
                    Valor da Nota
                 </div>
                 <div className="flex-1 flex items-center px-4 sm:px-6 relative group bg-[#f8fbff]">
                    <span className="font-bold text-gray-500 mr-2 text-sm sm:text-base">R$</span>
                    <input
                      type="text"
                      className="w-full bg-transparent text-xl sm:text-2xl font-black outline-none text-[#1e3a8a]"
                      value={valorNF || valorNF === 0 ? maskMoney((valorNF * 100).toFixed(0)) : ''}
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/\D/g, '');
                        setValorNF(Number(rawValue) / 100);
                      }}
                      placeholder="0,00"
                    />
                 </div>
               </div>

               {/* MULTIPLE IMPOSTOS */}
               <div className="flex divide-x divide-gray-400 bg-gray-50 text-[10px] sm:text-[11px] h-14">
                  <div className="flex-1 flex flex-col hover:bg-gray-100 transition-colors">
                     <span className="font-semibold px-2 py-0.5 border-b border-gray-300 text-center">IRPJ (R$)</span>
                     <input type="text" className="w-full h-full px-2 bg-transparent font-black outline-none text-center text-gray-800" 
                        value={irpj || irpj === 0 ? maskMoney((irpj * 100).toFixed(0)) : ''}
                        onChange={(e) => { const raw = e.target.value.replace(/\D/g,''); setIrpj(Number(raw)/100); }} 
                        placeholder="0,00" />
                  </div>
                  <div className="flex-1 flex flex-col hover:bg-gray-100 transition-colors">
                     <span className="font-semibold px-2 py-0.5 border-b border-gray-300 text-center">PIS (R$)</span>
                     <input type="text" className="w-full h-full px-2 bg-transparent font-black outline-none text-center text-gray-800" 
                        value={pis || pis === 0 ? maskMoney((pis * 100).toFixed(0)) : ''}
                        onChange={(e) => { const raw = e.target.value.replace(/\D/g,''); setPis(Number(raw)/100); }} 
                        placeholder="0,00" />
                  </div>
                  <div className="flex-1 flex flex-col hover:bg-gray-100 transition-colors">
                     <span className="font-semibold px-2 py-0.5 border-b border-gray-300 text-center">COFINS (R$)</span>
                     <input type="text" className="w-full h-full px-2 bg-transparent font-black outline-none text-center text-gray-800" 
                        value={cofins || cofins === 0 ? maskMoney((cofins * 100).toFixed(0)) : ''}
                        onChange={(e) => { const raw = e.target.value.replace(/\D/g,''); setCofins(Number(raw)/100); }} 
                        placeholder="0,00" />
                  </div>
                  <div className="flex-1 flex flex-col hover:bg-gray-100 transition-colors">
                     <span className="font-semibold px-2 py-0.5 border-b border-gray-300 text-center">CSLL (R$)</span>
                     <input type="text" className="w-full h-full px-2 bg-transparent font-black outline-none text-center text-gray-800" 
                        value={csll || csll === 0 ? maskMoney((csll * 100).toFixed(0)) : ''}
                        onChange={(e) => { const raw = e.target.value.replace(/\D/g,''); setCsll(Number(raw)/100); }} 
                        placeholder="0,00" />
                  </div>
               </div>
               
               <div className="border-t-[3px] border-gray-800 flex flex-col text-[9px] sm:text-[10px] p-2 sm:p-3 bg-white space-y-0.5">
                  <strong className="text-black mb-1">OUTRAS INFORMAÇÕES / DEDUÇÕES</strong>
                  <span className="text-gray-700">- Documento referencial gerado eletronicamente via Integração Salomão Manager.</span>
                  <span className="text-gray-700">- Tributação conforme legislação vigente do município emissor na data atual.</span>
               </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default EmissaoNF;
`

content = content.replace(returnRegex, newReturn);
fs.writeFileSync(filepath, content);
console.log('Layout Updated!');
