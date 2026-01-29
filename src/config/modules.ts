import { 
  LayoutDashboard, Users, Gavel, FileWarning, Truck, KanbanSquare, History, BookOpen,
  Calendar, MapPin, TrendingUp, Clock, BarChart3, RefreshCw, Briefcase, Banknote, Megaphone,
  FolderSearch, ArrowUpCircle, ArrowDownCircle, Plane
} from 'lucide-react';

export const MODULE_CONFIG = {
  crm: {
    icons: {
      dashboard: LayoutDashboard,
      clientes: Users,
      magistrados: Gavel,
      incompletos: FileWarning,
      logistica: Truck,
      kanban: KanbanSquare,
      historico: History,
      manual: BookOpen
    },
    titles: {
      dashboard: 'Dashboard',
      clientes: 'Clientes',
      magistrados: 'Autoridades',
      incompletos: 'Cadastros Incompletos',
      logistica: 'Logística',
      kanban: 'Kanban',
      historico: 'Histórico de Atividades',
      manual: 'Manual do Sistema'
    },
    descriptions: {
      dashboard: 'Visão geral de performance e indicadores chave.',
      clientes: 'Gerencie a base de prospects e clientes ativos.',
      magistrados: 'Área restrita para relacionamento com Autoridades.',
      incompletos: 'Atenção: Cadastros que necessitam de preenchimento.',
      logistica: 'Gestão de entregas e controle logístico.',
      kanban: 'Gerencie suas tarefas de forma visual.',
      historico: 'Audit Log: Rastreabilidade de ações no sistema.',
      manual: 'Documentação completa e guias de uso.'
    }
  },
  collaborators: {
    icons: {
      dashboard: LayoutDashboard,
      calendario: Calendar,
      presencial: MapPin,
      colaboradores: Users,
      evolucao: TrendingUp,
      'tempo-casa': Clock,
      headcount: BarChart3,
      turnover: RefreshCw,
      vagas: Briefcase,
      remuneracao: Banknote,
      acoes: Megaphone,
      kanban: KanbanSquare,
      ged: FolderSearch
    },
    titles: {
      dashboard: 'Dashboard RH',
      calendario: 'Calendário',
      presencial: 'Controle Presencial',
      colaboradores: 'Colaboradores',
      evolucao: 'Evolução de Pessoal',
      'tempo-casa': 'Tempo de Casa',
      headcount: 'Headcount',
      turnover: 'Turnover',
      vagas: 'Vagas',
      remuneracao: 'Remuneração',
      acoes: 'Ações Internas & Marketing',
      kanban: 'Kanban RH',
      ged: 'GED - Gestão Eletrônica de Documentos'
    },
    descriptions: {
      dashboard: 'Visão geral de colaboradores e métricas de RH.',
      calendario: 'Calendário de eventos, aniversários e marcos importantes.',
      presencial: 'Gestão de presença e alocação física.',
      colaboradores: 'Gestão da base de colaboradores ativos.',
      evolucao: 'Análise de crescimento e desenvolvimento.',
      'tempo-casa': 'Métricas de retenção e senioridade.',
      headcount: 'Indicadores quantitativos da equipe.',
      turnover: 'Índices de rotatividade de pessoal.',
      vagas: 'Gestão de processos seletivos abertos.',
      remuneracao: 'Gestão salarial e benefícios.',
      acoes: 'Gestão de endomarketing, eventos e campanhas.',
      kanban: 'Fluxo de contratações e tarefas de RH.',
      ged: 'Arquivo digital e organização de documentos.'
    }
  },
  financial: {
    icons: {
      dashboard: LayoutDashboard,
      'contas-pagar': ArrowUpCircle,
      'contas-receber': ArrowDownCircle,
      'gestao-aeronave': Plane,
      ged: FolderSearch,
      historico: History
    },
    titles: {
      dashboard: 'Dashboard Financeiro',
      'contas-pagar': 'Contas a Pagar',
      'contas-receber': 'Contas a Receber',
      'gestao-aeronave': 'Gestão da Aeronave',
      ged: 'Gestão Eletrônica de Documentos',
      historico: 'Histórico'
    },
    descriptions: {
      dashboard: 'Visão geral do fluxo de caixa e indicadores.',
      'contas-pagar': 'Gestão de despesas e obrigações.',
      'contas-receber': 'Controle de receitas e faturamentos.',
      'gestao-aeronave': 'Controle de custos e manutenção da aeronave.',
      ged: 'Arquivo digital e organização de documentos.',
      historico: 'Log de transações e atividades financeiras.'
    }
  }
};