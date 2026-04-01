import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { exportToStandardXLSX } from '../../../utils/exportUtils';
import {
  LayoutDashboard,
  Download,
  Loader2,
  TrendingUp,
  TrendingDown,
  Plane,
  GraduationCap,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  ArrowUpCircle,
  ArrowDownCircle,
  FileDown
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

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
  const { kpiPagar, chartReembolsos } = useMemo(() => {
    const pendentes = reembolsos.filter((r) => r.status === 'pendente');
    const aguardando = reembolsos.filter((r) => r.status === 'pendente_autorizacao');
    const pagos = reembolsos.filter((r) => r.status === 'pago');
    const rejeitados = reembolsos.filter((r) => r.status === 'rejeitado');

    const chartDataMap: Record<string, { monthDate: string, monthLabel: string, Solicitado: number, Reembolsado: number }> = {};
    
    reembolsos.forEach(r => {
      const dateStr = r.data_despesa || r.created_at;
      if (!dateStr) return;
      const d = new Date(dateStr);
      const monthPrefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const shortM = d.toLocaleString('pt-BR', { month: 'short' }).toUpperCase();
      const monthLabel = `${shortM}/${String(d.getFullYear()).slice(2)}`;
      
      if (!chartDataMap[monthPrefix]) {
        chartDataMap[monthPrefix] = { monthDate: monthPrefix, monthLabel, Solicitado: 0, Reembolsado: 0 };
      }
      
      const v = Number(r.valor) || 0;
      if (r.status !== 'rejeitado') {
        chartDataMap[monthPrefix].Solicitado += v;
      }
      if (r.status === 'pago') {
        chartDataMap[monthPrefix].Reembolsado += v;
      }
    });

    const chartArr = Object.values(chartDataMap).sort((a, b) => a.monthDate.localeCompare(b.monthDate));
    const finalChart = chartArr.slice(-6);

    return {
      kpiPagar: {
        pendenteQty: pendentes.length,
        pendenteAmt: pendentes.reduce((acc, c) => acc + (c.valor || 0), 0),
        aguardandoQty: aguardando.length,
        aguardandoAmt: aguardando.reduce((acc, c) => acc + (c.valor || 0), 0),
        pagoQty: pagos.length,
        pagoAmt: pagos.reduce((acc, c) => acc + (c.valor || 0), 0),
        rejeitadoQty: rejeitados.length,
        rejeitadoAmt: rejeitados.reduce((acc, c) => acc + (c.valor || 0), 0),
      },
      chartReembolsos: finalChart
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

  const handleExportXLSX = () => {
    const exportData = [
      {
        "Módulo": "Controle Financeiro",
        "Métrica": "A Receber (Qtd)",
        "Valor": kpiReceber.pendenteQty
      },
      {
        "Módulo": "Controle Financeiro",
        "Métrica": "A Receber (R$)",
        "Valor": kpiReceber.pendenteAmt
      },
      {
        "Módulo": "Controle Financeiro",
        "Métrica": "Vencido (Qtd)",
        "Valor": kpiReceber.vencidoQty
      },
      {
        "Módulo": "Controle Financeiro",
        "Métrica": "Faturado (R$)",
        "Valor": kpiReceber.faturadoAmt
      },
      {
        "Módulo": "Contas a Pagar",
        "Métrica": "Pendentes (Qtd)",
        "Valor": kpiPagar.pendenteQty
      },
      {
        "Módulo": "Contas a Pagar",
        "Métrica": "Pendentes (R$)",
        "Valor": kpiPagar.pendenteAmt
      },
      {
        "Módulo": "Contas a Pagar",
        "Métrica": "Pagos (R$)",
        "Valor": kpiPagar.pagoAmt
      },
      {
        "Módulo": "Gestão Aeronave",
        "Métrica": "Média Comercial/mês",
        "Valor": kpiAeronave.mediaComercial
      },
      {
        "Módulo": "Gestão Aeronave",
        "Métrica": "Média Particular/mês",
        "Valor": kpiAeronave.mediaParticular
      },
      {
        "Módulo": "Vencimentos OAB",
        "Métrica": "Colab. Avaliados",
        "Valor": kpiOAB.ativosAvaliados
      },
      {
        "Módulo": "Vencimentos OAB",
        "Métrica": "OABs Pagas",
        "Valor": kpiOAB.pagosQty
      },
      {
        "Módulo": "Vencimentos OAB",
        "Métrica": "Urgentes (Qtd)",
        "Valor": kpiOAB.urgentesQty
      },
      {
        "Módulo": "Vencimentos OAB",
        "Métrica": "Vencidos (Qtd)",
        "Valor": kpiOAB.vencidosQty
      }
    ];

    exportToStandardXLSX(
      [{ sheetName: "Indicadores", data: exportData, colWidths: [30, 30, 20] }],
      `Financeiro_Indicadores_${new Date().toISOString().split('T')[0]}.xlsx`
    );
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
            onClick={handleExportXLSX}
            title="Exportar Planilha Excel"
            className="flex items-center justify-center w-10 h-10 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/30 shrink-0"
          >
            <FileDown className="h-5 w-5" />
          </button>
          
          <button
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            title="Exportar Dashboard em PDF"
            className="flex items-center justify-center w-10 h-10 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all shadow-lg shadow-red-500/30 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExportingPDF ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Download className="h-5 w-5" />
            )}
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
        </div>

        {/* BLOCO 2: CONTAS A PAGAR / REEMBOLSOS (Largura Total) */}
        <div className="w-full mt-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row">
            
            {/* Lado Esquerdo: Cards (KPIs) - 40% */}
            <div className="w-full md:w-5/12 border-b md:border-b-0 md:border-r border-gray-100 p-6 flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-lg bg-red-50">
                  <ArrowUpCircle className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <h3 className="font-black text-[#0a192f] text-lg leading-tight">Reembolsos</h3>
                  <p className="text-[10px] uppercase font-bold text-gray-400">Despesas & Custos Ativos</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 flex-1">
                {/* Pendentes */}
                <div className="p-4 rounded-xl border border-red-100 bg-red-50/50 relative overflow-hidden flex flex-col items-center justify-center text-center group">
                  <div className="absolute top-0 right-0 w-1 h-full bg-red-500" />
                  <span className="text-3xl font-black text-red-900 leading-none group-hover:scale-105 transition-transform">{kpiPagar.pendenteQty}</span>
                  <span className="text-[10px] font-black uppercase text-red-600 tracking-widest mt-1.5 flex items-center gap-1">
                    Pendentes
                  </span>
                </div>

                {/* Ag. Autorizacao */}
                <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 relative overflow-hidden flex flex-col items-center justify-center text-center group">
                  <div className="absolute top-0 right-0 w-1 h-full bg-blue-500" />
                  <span className="text-3xl font-black text-[#0a192f] leading-none group-hover:scale-105 transition-transform">{kpiPagar.aguardandoQty}</span>
                  <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest mt-1.5 flex items-center gap-1">
                    Ag. Autorização
                  </span>
                </div>

                {/* Reembolsados */}
                <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/50 relative overflow-hidden flex flex-col items-center justify-center text-center group">
                  <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500" />
                  <span className="text-3xl font-black text-emerald-900 leading-none group-hover:scale-105 transition-transform">{kpiPagar.pagoQty}</span>
                  <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mt-1.5 flex items-center gap-1">
                    Reembolsados
                  </span>
                </div>

                {/* Rejeitados */}
                <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 relative overflow-hidden flex flex-col items-center justify-center text-center group">
                  <div className="absolute top-0 right-0 w-1 h-full bg-gray-400" />
                  <span className="text-3xl font-black text-gray-700 leading-none group-hover:scale-105 transition-transform">{kpiPagar.rejeitadoQty}</span>
                  <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest mt-1.5 flex items-center gap-1">
                    Rejeitados
                  </span>
                </div>
              </div>
            </div>

            {/* Lado Direito: Gráfico (60%) */}
            <div className="w-full md:w-7/12 p-6 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                  Evolução Mensal (Solicitados x Pagos)
                </span>
              </div>
              
              <div className="flex-1 min-h-[240px] w-full">
                {chartReembolsos.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartReembolsos} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="monthLabel" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#6b7280', fontWeight: 'bold' }} 
                        dy={10}
                      />
                      <YAxis 
                        hide={true} 
                        domain={['auto', 'auto']}
                      />
                      <Tooltip 
                        cursor={{ stroke: '#f3f4f6', strokeWidth: 32 }}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '12px' }}
                        formatter={(value: number) => [formatCurrency(value), '']}
                        labelStyle={{ fontWeight: 'black', color: '#112240', marginBottom: '8px' }}
                      />
                      <Legend 
                        iconType="circle" 
                        wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '10px' }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="Solicitado" 
                        name="Solicitado" 
                        stroke="#ef4444" 
                        strokeWidth={4} 
                        dot={{ r: 4, strokeWidth: 2, fill: '#ffffff' }} 
                        activeDot={{ r: 7, strokeWidth: 0 }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="Reembolsado" 
                        name="Reembolsado" 
                        stroke="#10b981" 
                        strokeWidth={4} 
                        dot={{ r: 4, strokeWidth: 2, fill: '#ffffff' }} 
                        activeDot={{ r: 7, strokeWidth: 0 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    Dados insuficientes para o gráfico
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* BLOCO 3: OAB */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full mt-6">
          
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