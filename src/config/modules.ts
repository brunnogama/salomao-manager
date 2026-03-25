import {
  LayoutDashboard, Users, Gavel, FileWarning, Truck, KanbanSquare, History, BookOpen,
  Calendar, MapPin, TrendingUp, Clock, BarChart3, RefreshCw, Briefcase, Megaphone,
  FolderSearch, ArrowUpCircle, ArrowDownCircle, Plane, Receipt, Home
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
      acoes: Megaphone,
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
      acoes: 'Ações Internas & Marketing',
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
      acoes: 'Gestão de endomarketing, eventos e campanhas.',
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
  },
  executive: {
    icons: {
      dashboard: LayoutDashboard,
      calendario: Calendar,
      despesas: Receipt,
      'gestao-familia': Home,
      ged: FolderSearch
    },
    titles: {
      dashboard: 'Dashboard Secretaria',
      calendario: 'Calendário Executivo',
      despesas: 'Controle de Despesas',
      'gestao-familia': 'Gestão Família Salomão',
      ged: 'GED Secretaria'
    },
    descriptions: {
      dashboard: 'Visão geral das atividades da secretaria.',
      calendario: 'Agendamentos e compromissos da diretoria.',
      despesas: 'Gestão e prestação de contas de despesas.',
      'gestao-familia': 'Controle e suporte à Família Salomão.',
      ged: 'Documentos e arquivos da secretaria.'
    }
  },
  controladoria: {
    icons: {
      dashboard: LayoutDashboard,
      contratos: BookOpen,
      clientes: Users,
      kanban: KanbanSquare,
      financeiro: Receipt,
      ged: FolderSearch,
      propostas: BookOpen,
      compliance: Gavel,
      sucumbencias: Gavel,
      jurimetria: BarChart3,
      volumetria: TrendingUp,
      historico: History,
      configuracoes: LayoutDashboard
    },
    titles: {
      dashboard: 'Dashboard da Controladoria',
      contratos: 'Contratos',
      clientes: 'Clientes Vínculo',
      kanban: 'Quadro Kanban',
      financeiro: 'Financeiro e Faturas',
      ged: 'GED Controladoria',
      propostas: 'Propostas e Honorários',
      compliance: 'Compliance',
      sucumbencias: 'Sucumbências',
      jurimetria: 'Jurimetria',
      volumetria: 'Volumetria Prática',
      historico: 'Auditoria e Histórico',
      configuracoes: 'Ajustes Controladoria'
    },
    descriptions: {
      dashboard: 'Visão macro da controladoria',
      contratos: 'Gestão de vínculos e minutas',
      clientes: 'Base de clientes vinculados',
      kanban: 'Controle de tarefas e andamento',
      financeiro: 'Gestão de receitas de contencioso',
      ged: 'Documentos da controladoria',
      propostas: 'Controle de honorários e propostas',
      compliance: 'Acompanhamento do setor de integridade',
      sucumbencias: 'Gerenciamento de verbas e honorários',
      jurimetria: 'Análise descritiva e dados judiciais',
      volumetria: 'Estatísticas e contagem processual',
      historico: 'Acesso a logs da controladoria',
      configuracoes: 'Ajuste de flags e configurações'
    }
  },
  operational: {
    icons: {
      dashboard: LayoutDashboard,
      produtos: Truck,
      estoque: FolderSearch,
      imobiliario: Home,
      compras: Receipt
    },
    titles: {
      dashboard: 'Dashboard Operações',
      produtos: 'Produtos e Insumos',
      estoque: 'Controle de Estoque',
      imobiliario: 'Gestão Imobiliária & Frota',
      compras: 'Gestão de Compras'
    },
    descriptions: {
      dashboard: 'Visão de insumos e compras',
      produtos: 'Catálogo e serviços de fornecedores',
      estoque: 'Balanço de estoque e itens gerais',
      imobiliario: 'Gerenciamento predial e carros',
      compras: 'Requisições e controle de suprimentos'
    }
  }
};