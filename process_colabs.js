async function run() {
  console.log("Fetching...");
  const url = "https://iewevhdtwlviudetxgax.supabase.co/rest/v1/colaboradores?select=*";
  const apikey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlld2V2aGR0d2x2aXVkZXR4Z2F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NTMxNzEsImV4cCI6MjA4MzEyOTE3MX0.jQr91dNKSrwypja7UoDnv8oiE29L_dpy-mPQ_3vW5Sw";

  const response = await fetch(url, {
    headers: {
      "apikey": apikey,
      "Authorization": `Bearer ${apikey}`
    }
  });

  const data = await response.json();
  console.log("Fetched " + data.length + " rows");

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const processados = data.filter((v) => {
    if (!v.data_admissao) return false

    const statusLimpo = v.status?.trim().toLowerCase() || '';
    if (statusLimpo !== 'ativo') return false;

    const cargoLimpo = v.cargo?.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || '';
    const ehCargoValido = cargoLimpo.includes('advogad') || cargoLimpo.includes('socio') || cargoLimpo.includes('socia') || cargoLimpo.includes('estagiario') || cargoLimpo.includes('estagiaria');

    if (!ehCargoValido) return false;

    return true;
  }).map((v) => {
    let dia, mes, ano;
    if (v.data_admissao.includes('/')) {
      [dia, mes, ano] = v.data_admissao.split('/').map(Number);
    } else {
      [ano, mes, dia] = v.data_admissao.split('-').map(Number);
    }

    const dataVenc = new Date(ano, (mes - 1) + 6, dia);
    dataVenc.setDate(dataVenc.getDate() - 1);

    const dataVencUTC = Date.UTC(dataVenc.getFullYear(), dataVenc.getMonth(), dataVenc.getDate());
    const hojeUTC = Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

    const diff = Math.ceil((dataVencUTC - hojeUTC) / (1000 * 60 * 60 * 24));

    const dataPagamentoFmt = `${dataVenc.getFullYear()}-${String(dataVenc.getMonth() + 1).padStart(2, '0')}-${String(dataVenc.getDate()).padStart(2, '0')}`;

    return {
      id: v.id,
      nome: v.nome,
      admissao: v.data_admissao,
      cargo: v.cargo,
      data_pagamento_oab: dataPagamentoFmt,
      dias_ate_pagamento: diff,
    }
  });

  const mesAtual = processados.filter(v => {
    const [year, month] = v.data_pagamento_oab.split('-');
    return parseInt(month, 10) === hoje.getMonth() + 1 && parseInt(year, 10) === hoje.getFullYear();
  });

  console.log("Total Processados (Ativo + Cargo Valido):", processados.length);
  console.log("Total Mes Atual:", mesAtual.length);

  if (mesAtual.length > 0) {
    console.log("MES ATUAL:");
    console.log(mesAtual);
  } else {
    processados.sort((a, b) => Math.abs(a.dias_ate_pagamento) - Math.abs(b.dias_ate_pagamento));
    console.log("Nearest 15 items:");
    console.log(processados.slice(0, 15));
  }
}
run();
