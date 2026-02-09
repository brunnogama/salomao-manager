// src/components/finance/contasareceber/hooks/useFinanceContasReceber.ts
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';

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

  // Função para simular o disparo de notificação (Pode ser conectada a uma Edge Function)
  const dispararNotificacaoRadar = async (fatura: any) => {
    console.log(`[NOTIFICAÇÃO] Fatura de ${fatura.cliente_nome} entrou no RADAR.`);
    // Futuro: supabase.functions.invoke('send-radar-email', { body: { faturaId: fatura.id } })
  };

  const getAutomatedStatus = useCallback((dataEnvioStr: string, statusAtual: FaturaStatus, faturaOriginal: any): FaturaStatus => {
    if (statusAtual === 'pago') return 'pago';

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataEnvio = new Date(dataEnvioStr);
    dataEnvio.setHours(0, 0, 0, 0);

    const limiteAguardando = addBusinessDays(dataEnvio, 2);
    const limiteRadar = addBusinessDays(dataEnvio, 4);

    let novoStatus: FaturaStatus = 'aguardando_resposta';

    if (hoje > limiteRadar) novoStatus = 'contato_direto';
    else if (hoje > limiteAguardando) novoStatus = 'radar';

    // Se o status mudou para radar agora, disparar gatilho
    if (novoStatus === 'radar' && statusAtual !== 'radar') {
      dispararNotificacaoRadar(faturaOriginal);
    }
    
    return novoStatus;
  }, []);

  const fetchFaturas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('finance_faturas')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const processadas = data.map(f => ({
          ...f,
          status: getAutomatedStatus(f.data_envio, f.status, f)
        }));
        setFaturas(processadas);
      }
    } catch (err) {
      console.error('Erro ao buscar faturas:', err);
    } finally {
      setLoading(false);
    }
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
        status: 'aguardando_resposta',
        data_envio: new Date().toISOString()
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