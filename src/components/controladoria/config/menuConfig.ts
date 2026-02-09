import { 
  LayoutDashboard, 
  FileText, 
  FileSignature, 
  DollarSign, 
  BarChart3, 
  ShieldCheck, 
  Users, 
  KanbanSquare, 
  FolderOpen,
  Share2 
} from 'lucide-react';

export const menuItems = [
  { label: 'Dashboard', path: '/controladoria/dashboard', icon: LayoutDashboard },
  { label: 'Contratos', path: '/controladoria/contracts', icon: FileSignature },
  { label: 'Propostas', path: '/controladoria/proposals', icon: FileText },
  { label: 'Financeiro', path: '/controladoria/finance', icon: DollarSign },
  { label: 'Jurimetria', path: '/controladoria/jurimetria', icon: Share2 }, 
  { label: 'Volumetria', path: '/controladoria/volumetry', icon: BarChart3 },
  { label: 'Compliance', path: '/controladoria/compliance', icon: ShieldCheck },
  { label: 'Clientes', path: '/controladoria/clients', icon: Users },
  { label: 'Kanban', path: '/controladoria/kanban', icon: KanbanSquare },
  { label: 'GED', path: '/controladoria/ged', icon: FolderOpen },
];