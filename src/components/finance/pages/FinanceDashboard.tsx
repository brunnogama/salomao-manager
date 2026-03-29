import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  LayoutDashboard,
  Download,
  Loader2,
  TrendingUp,
  TrendingDown,
  Plane,
  GraduationCap,
  DollarSign,
  Wallet,
  Clock,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Building2,
  ArrowUpCircle,
  ArrowDownCircle,
  Hash
} from 'lucide-react';

export function FinanceDashboard() {
  const [loading, setLoading] = useState(true);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Estados de dados
  const [reembolsos, setReembolsos] = useState<any[]>([]);
  const [installments, setInstallments] = useState<any[]>([]);
  const [aeronave, setAeronave] = useState<any[]>([]);
  const [oabProcessados, setOabProcessados] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reemRes, instRes, aeroRes, colabRes, oabFinRes] = await Promise.all([
        supabase.from('reembolsos').select('*'),
        supabase.from('financial_installments').select(`*, contract:contracts (status)`),
        supabase.from('aeronave_lancamentos').select('*'),
        supabase.from('collaborators').select('*').eq('status', 'active'),
        supabase.from('financeiro_oab').select('*')
      ]);

      if (reemRes.data) setReembolsos(reemRes.data);
      if (instRes.data) setInstallments(instRes.data);
      if (aeroRes.data) setAeronave(aeroRes.data);

      // Processamento OAB semelhante à ListaVencimentosOAB
      if (colabRes.data && oabFinRes.data) {
        const hojeObj = new Date();
        hojeObj.setHours(0, 0, 0, 0);

        const proc = colabRes.data
          .filter((v: any) => {
            if (!v.hire_date) return false;
            const cargo = (v.role || '').toLowerCase();
            const eq = (v.equipe || '').toLowerCase();
            const ehJuridico = cargo.includes('advogad') || cargo.includes('socio') || cargo.includes('socia') || cargo.includes('estagiario') || cargo.includes('juridico') || cargo.includes('legal') || eq.includes('juridico');
            return ehJuridico;
          })
          .map((v: any) => {
            try {
              const dataAdmissaoSoData = String(v.hire_date).split('T')[0];
              let dia, mes, ano;
              if (dataAdmissaoSoData.includes('/')) {
                [dia, mes, ano] = dataAdmissaoSoData.split('/').map(Number);
              } else {
                [ano, mes, dia] = dataAdmissaoSoData.split('-').map(Number);
              }
              if (!ano || !mes || !dia) return null;

              const dataVenc = new Date(ano, (mes - 1) + 6, dia);
              dataVenc.setDate(dataVenc.getDate() - 1);

              const dataVencUTC = Date.UTC(dataVenc.getFullYear(), dataVenc.getMonth(), dataVenc.getDate());
              const hojeUTC = Date.UTC(hojeObj.getFullYear(), hojeObj.getMonth(), hojeObj.getDate());
              const diff = Math.ceil((dataVencUTC - hojeUTC) / (1000 * 60 * 60 * 24));

              const fin = oabFinRes.data.find(
                (f) =>
                  f.colaborador_id === v.id &&
                  f.mes_referencia === dataVenc.getMonth() &&
                  f.ano_referencia === dataVenc.getFullYear()
              );

              return {
                ...v,
                dias_ate_pagamento: diff,
                status_pagamento_real: fin?.status_pagamento
              };
            } catch (error) {
              return null;
            }
          })
          .filter(Boolean);

        setOabProcessados(proc);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
      toast.error('Erro ao carregar dados financeiros.');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // CALCULOS DOS KPIS
  // ==========================================

  // 1. Controle Financeiro (Contas a Receber)
  const { kpiReceber } = useMemo(() => {
    const validStates = ['proposal', 'active'];
    const validInst = installments.filter((i: any) => i.contract?.status && validStates.includes(i.contract.status));

    const pending = validInst.filter((i: any) => i.status === 'pending');
    const paid = validInst.filter((i: any) => i.status === 'paid');
    
    const todayStr = new Date().toISOString().split('T')[0];
    const overdue = pending.filter((i: any) => i.due_date && i.due_date.split('T')[0] < todayStr);

    const totalPendingAmt = pending.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const totalPaidAmt = paid.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    return {
      kpiReceber: {
        pendenteQty: pending.length,
        pendenteAmt: totalPendingAmt,
        faturadoAmt: totalPaidAmt,
        vencidoQty: overdue.length
      }
    };
  }, [installments]);

  // 2. Contas a Pagar (Reembolsos)
  const { kpiPagar } = useMemo(() => {
    const pendentes = reembolsos.filter((r) => r.status === 'pendente');
    const pagos = reembolsos.filter((r) => r.status === 'pago');

    const totalPendente = pendentes.reduce((acc, c) => acc + (c.valor || 0), 0);
    const totalPago = pagos.reduce((acc, c) => acc + (c.valor || 0), 0);

    return {
      kpiPagar: {
        pendenteQty: pendentes.length,
        pendenteAmt: totalPendente,
        pagoAmt: totalPago
      }
    };
  }, [reembolsos]);

  // 3. OAB
  const { kpiOAB } = useMemo(() => {
    const pendentes = oabProcessados.filter(
      (o) => !o.status_pagamento_real || (o.status_pagamento_real !== 'pago' && o.status_pagamento_real !== 'desconsiderado')
    );

    const urgentes = pendentes.filter((o) => o.dias_ate_pagamento <= 7 && o.dias_ate_pagamento >= 0);
    const vencidos = pendentes.filter((o) => o.dias_ate_pagamento < 0);
    const pagos = oabProcessados.filter((o) => o.status_pagamento_real === 'pago');

    return {
      kpiOAB: {
        ativosAvaliados: oabProcessados.length,
        vencidosQty: vencidos.length,
        urgentesQty: urgentes.length,
        pagosQty: pagos.length
      }
    };
  }, [oabProcessados]);

  // 4. Gestão Aeronave
  const { kpiAeronave } = useMemo(() => {
    const comercial = aeronave.filter((item) => {
      const aero = (item.aeronave || '').toLowerCase().trim();
      return aero.includes('comercial') && item.data_pagamento && item.valor_pago;
    });

    const particular = aeronave.filter((item) => {
      const aero = (item.aeronave || '').toLowerCase().trim();
      return !aero.includes('comercial') && aero !== '' && item.data_pagamento && item.valor_pago;
    });

    const getAvg = (list: any[]) => {
      const meses = new Set(
        list.map((item) => {
          const d = new Date(item.data_pagamento);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        })
      );
      const total = list.reduce((acc, curr) => acc + (curr.valor_pago || 0), 0);
      return meses.size > 0 ? total / meses.size : 0;
    };

    const mediaComercial = getAvg(comercial);
    const mediaParticular = getAvg(particular);
    const diff = mediaComercial - mediaParticular;

    return {
      kpiAeronave: {
        mediaComercial,
        mediaParticular,
        diff,
        isEconomia: diff > 0
      }
    };
  }, [aeronave]);

  // ==========================================
  // FUNÇÕES DE EXPORTAÇÃO
  // ==========================================

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    const loadingToast = toast.loading('Gerando PDF multipáginas... Isso pode levar alguns segundos.');

    // Salvar scroll position
    const originalScrollY = window.scrollY;
    
    // Rolar para o topo. Resolve bug crítico do html2canvas cortar os childs
    window.scrollTo({ top: 0, behavior: 'instant' });

    try {
      const sections = ['pdf-financeiro-summary'];
      let pdf: jsPDF | null = null;
      
      // Delay pro navegador repintar no topo
      await new Promise(resolve => setTimeout(resolve, 300));

      for (let i = 0; i < sections.length; i++) {
        const targetElement = document.getElementById(sections[i]);
        if (!targetElement) continue;

        const canvas = await html2canvas(targetElement, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#F8FAFC',
          scrollY: 0, 
        });

        const imgData = canvas.toDataURL('image/png');
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        
        if (!pdf) {
          pdf = new jsPDF({
            orientation: canvasWidth > canvasHeight ? 'l' : 'p',
            unit: 'px',
            format: [canvasWidth, canvasHeight]
          });
          pdf.addImage(imgData, 'PNG', 0, 0, canvasWidth, canvasHeight);
        } else {
          pdf.addPage([canvasWidth, canvasHeight], canvasWidth > canvasHeight ? 'l' : 'p');
          pdf.setPage(i + 1);
          pdf.addImage(imgData, 'PNG', 0, 0, canvasWidth, canvasHeight);
        }
      }
      
      if (pdf) {
        pdf.save('Dashboard_Financeiro.pdf');
        toast.success('PDF do Dashboard gerado com sucesso!', { id: loadingToast });
      } else {
        toast.error('Conteúdo do dashboard não encontrado para exportação.', { id: loadingToast });
      }
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error('Ocorreu um erro ao gerar o PDF.', { id: loadingToast });
    } finally {
      setIsExportingPDF(false);
      window.scrollTo({ top: originalScrollY, behavior: 'instant' });
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[500px] bg-transparent gap-4 h-full">
        <Loader2 className="w-10 h-10 text-[#1e3a8a] animate-spin" />
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Carregando indicadores...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[800px] bg-gradient-to-br from-gray-50 to-gray-100 space-y-4 sm:space-y-6 relative p-4 sm:p-6 w-full">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 print:hidden">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg shrink-0">
            <LayoutDashboard className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
              Dashboard Financeiro
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-1 sm:mt-0.5">
              Visão geral integrada e indicadores de performance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            title="Exportar Dashboard em PDF (Alta Resolução)"
            className="flex items-center justify-center h-10 px-4 rounded-xl transition-all active:scale-95 bg-red-600 text-white hover:bg-red-700 border-none disabled:opacity-50 disabled:cursor-not-allowed gap-2"
            style={{ boxShadow: '0 4px 14px rgba(220, 38, 38, 0.4)' }}
          >
            {isExportingPDF ? (
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            <span className="text-sm font-bold hidden sm:block">PDF</span>
          </button>
        </div>
      </div>

      {/* ÁREA EXPORTÁVEL */}
      <div id="pdf-financeiro-summary" className="space-y-6 w-full pb-10">
        
        {/* BLOCO 1: CONTAS A RECEBER E PAGAR */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          
          {/* Controle Financeiro */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50/50 to-transparent flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ArrowDownCircle className="h-6 w-6 text-blue-600" />
                <h3 className="font-black text-[#0a192f] text-lg">Controle Financeiro</h3>
              </div>
              <span className="text-[10px] uppercase font-bold text-gray-400">Receitas</span>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1 h-full bg-amber-500" />
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> A Receber
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-amber-900">{formatCurrency(kpiReceber.pendenteAmt)}</span>
                </div>
                <div className="mt-1 text-xs font-semibold text-gray-500">
                  {kpiReceber.pendenteQty} parcelas pendentes
                </div>
                {kpiReceber.vencidoQty > 0 && (
                  <div className="mt-3">
                    <span className="text-[10px] font-black text-white bg-red-600 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg uppercase tracking-widest shadow-sm">
                      <AlertCircle className="w-3 h-3" />
                      {kpiReceber.vencidoQty} parcelas vencidas
                    </span>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500" />
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Faturado
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-emerald-900">{formatCurrency(kpiReceber.faturadoAmt)}</span>
                </div>
                <div className="mt-1 text-xs font-semibold text-gray-500">
                  Total já recebido (Contratos Ativos)
                </div>
              </div>
            </div>
          </div>

          {/* Contas a Pagar */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-red-50/30 to-transparent flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ArrowUpCircle className="h-6 w-6 text-red-500" />
                <h3 className="font-black text-[#0a192f] text-lg">Contas a Pagar</h3>
              </div>
              <span className="text-[10px] uppercase font-bold text-gray-400">Reembolsos & Custos</span>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-red-100 bg-red-50/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1 h-full bg-red-500" />
                <div className="text-[10px] font-black text-red-400 uppercase tracking-widest flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500" /> Pendentes
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-red-900">{formatCurrency(kpiPagar.pendenteAmt)}</span>
                </div>
                <div className="mt-1 text-xs font-semibold text-red-700">
                  {kpiPagar.pendenteQty} solicitações travadas
                </div>
              </div>

              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1 h-full bg-blue-500" />
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-blue-500" /> Pagos
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-[#0a192f]">{formatCurrency(kpiPagar.pagoAmt)}</span>
                </div>
                <div className="mt-1 text-xs font-semibold text-gray-500">
                  Total de saídas realizadas
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BLOCO 2: OAB E AERONAVE */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full mt-6">
          
          {/* Gestão Aeronave */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50/50 to-transparent flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Plane className="h-6 w-6 text-emerald-600" />
                <h3 className="font-black text-[#0a192f] text-lg">Gestão da Aeronave</h3>
              </div>
              <span className="text-[10px] uppercase font-bold text-gray-400">Comparativo</span>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                    <Building2 className="w-3.5 h-3.5" /> Comercial (mês)
                  </div>
                  <span className="text-lg font-black text-[#0a192f]">{formatCurrency(kpiAeronave.mediaComercial)}</span>
                </div>
                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                    <Plane className="w-3.5 h-3.5" /> Particular (mês)
                  </div>
                  <span className="text-lg font-black text-[#0a192f]">{formatCurrency(kpiAeronave.mediaParticular)}</span>
                </div>
              </div>

              <div className={`p-4 rounded-xl border ${kpiAeronave.isEconomia ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'} flex items-center justify-between`}>
                <div>
                  <div className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${kpiAeronave.isEconomia ? 'text-green-600' : 'text-amber-600'}`}>
                    {kpiAeronave.isEconomia ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                    {kpiAeronave.isEconomia ? 'Economia Mensal' : 'Custo Adicional Mensal'}
                  </div>
                  <div className={`text-2xl font-black mt-1 ${kpiAeronave.isEconomia ? 'text-green-900' : 'text-amber-900'}`}>
                    {formatCurrency(Math.abs(kpiAeronave.diff))}
                  </div>
                </div>
                <div className={`p-3 rounded-full ${kpiAeronave.isEconomia ? 'bg-green-100' : 'bg-amber-100'}`}>
                  {kpiAeronave.isEconomia ? <TrendingDown className="w-6 h-6 text-green-600" /> : <TrendingUp className="w-6 h-6 text-amber-600" />}
                </div>
              </div>
            </div>
          </div>

          {/* OAB */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <GraduationCap className="h-6 w-6 text-indigo-600" />
                <h3 className="font-black text-[#0a192f] text-lg">Vencimentos OAB</h3>
              </div>
              <span className="text-[10px] uppercase font-bold text-gray-400">Jurídico</span>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4 flex-1">
              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 relative overflow-hidden flex flex-col justify-center items-center text-center">
                <span className="text-3xl font-black text-indigo-900">{kpiOAB.ativosAvaliados}</span>
                <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest mt-1">Colab. Ativos</span>
              </div>
              
              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 relative overflow-hidden flex flex-col justify-center items-center text-center">
                <span className="text-3xl font-black text-emerald-600">{kpiOAB.pagosQty}</span>
                <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest mt-1">OAB's Pagas</span>
              </div>

              <div className={`p-4 rounded-xl border ${kpiOAB.urgentesQty > 0 ? 'border-orange-200 bg-orange-50' : 'border-gray-100 bg-gray-50'} relative overflow-hidden flex flex-col justify-center items-center text-center`}>
                <span className={`text-3xl font-black ${kpiOAB.urgentesQty > 0 ? 'text-orange-600' : 'text-gray-400'}`}>{kpiOAB.urgentesQty}</span>
                <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest mt-1">Urgente (Até 7 dias)</span>
              </div>

              <div className={`p-4 rounded-xl border ${kpiOAB.vencidosQty > 0 ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-gray-50'} relative overflow-hidden flex flex-col justify-center items-center text-center`}>
                <span className={`text-3xl font-black ${kpiOAB.vencidosQty > 0 ? 'text-red-600' : 'text-gray-400'}`}>{kpiOAB.vencidosQty}</span>
                <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest mt-1">Vencimentos Atrás</span>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}