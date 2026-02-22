import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('/home/brunogama/Projetos/salomao-manager/.env', 'utf8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const supabase = createClient(urlMatch[1], keyMatch[1]);

async function run() {
    console.log("Fetching...");
    const { data: colaboradores, error } = await supabase.from('colaboradores').select('*');
    if (error) {
        console.error("Error fetching", error);
        return;
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const processados = colaboradores.filter((v) => {
        if (!v.data_admissao) return false

        // Filtro de Status Ativo
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

        // Use UTC dates to avoid timezone differences incorrectly counting days when time is near midnight
        const dataVencUTC = Date.UTC(dataVenc.getFullYear(), dataVenc.getMonth(), dataVenc.getDate());
        const hojeUTC = Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

        const diff = Math.ceil((dataVencUTC - hojeUTC) / (1000 * 60 * 60 * 24));

        // Add padStart to ensure valid YYYY-MM-DD format without local timezone shift vulnerabilities
        const dataPagamentoFmt = `${dataVenc.getFullYear()}-${String(dataVenc.getMonth() + 1).padStart(2, '0')}-${String(dataVenc.getDate()).padStart(2, '0')}`;

        return {
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

    console.log("Total Ativos & Cargo Valido:", processados.length);
    console.log("Mes Atual:", mesAtual.length);
    if (mesAtual.length > 0) {
        console.log("Exemplos mes atual:", mesAtual.slice(0, 3));
    } else {
        // Let's see some nearest dates
        processados.sort((a, b) => Math.abs(a.dias_ate_pagamento) - Math.abs(b.dias_ate_pagamento));
        console.log("Nearest 5:", processados.slice(0, 5));
    }
    process.exit(0);
}
run();
