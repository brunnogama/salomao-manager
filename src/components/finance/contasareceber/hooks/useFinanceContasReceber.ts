// src/components/finance/contasareceber/hooks/useFinanceContasReceber.ts
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export type FaturaStatus = 'enviado' | 'aguardando_resposta' | 'radar' | 'contato_direto' | 'pago';

interface Fatura {
  id: string;
  cliente_nome: string;
  valor: number;
  data_envio: string;
  status: FaturaStatus;
}

export function useFinanceContasReceber() {
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [loading, setLoading] = useState(true);

  const addBusinessDays = (startDate: Date, days: number) => {
    let date = new Date(startDate);
    let count = 0;
    while (count < days) {
      date.setDate(date.getDate() + 1);
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        count++;
      }
    }
    return date;
  };

  const getAutomatedStatus = useCallback((dataEnvioStr: string, statusAtual: FaturaStatus): FaturaStatus => {
    if (statusAtual === 'pago') return 'pago';

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataEnvio = new Date(dataEnvioStr);
    dataEnvio.setHours(0, 0, 0, 0);

    const limiteAguardando = addBusinessDays(dataEnvio, 2);
    const limiteRadar = addBusinessDays(dataEnvio, 4);

    if (hoje > limiteRadar) return 'contato_direto';
    if (hoje > limiteAguardando) return 'radar';
    
    return 'aguardando_resposta';
  }, []);

  const fetchFaturas = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('finance_faturas')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const processadas = data.map(f => ({
        ...f,
        status: getAutomatedStatus(f.data_envio, f.status)
      }));
      setFaturas(processadas);
    }
    setLoading(false);
  };

  const enviarFatura = async (dados: any) => {
    const { error } = await supabase
      .from('finance_faturas')
      .insert([{
        cliente_nome: dados.cliente,
        valor: dados.valor || 0,
        email_remetente: dados.remetente,
        assunto: dados.assunto,
        corpo: dados.corpo,
        status: 'aguardando_resposta'
      }]);

    if (error) throw error;
    await fetchFaturas();
  };

  const confirmarPagamento = async (id: string) => {
    const { error } = await supabase
      .from('finance_faturas')
      .update({ status: 'pago' })
      .eq('id', id);

    if (error) throw error;
    await fetchFaturas();
  };

  useEffect(() => {
    fetchFaturas();
  }, [getAutomatedStatus]);

  return {
    faturas,
    loading,
    enviarFatura,
    confirmarPagamento,
    refresh: fetchFaturas
  };
}