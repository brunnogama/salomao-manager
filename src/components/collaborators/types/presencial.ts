// src/components/collaborators/types/presencial.ts

export interface PresenceRecord {
  id: string;
  nome_colaborador: string;
  data_hora: string;
}

export interface SocioRule {
  id: string;
  socio_responsavel: string;
  nome_colaborador: string;
  meta_semanal: number;
}

export interface ReportItem {
  nome: string;
  socio: string; 
  diasPresentes: number;
  diasSemana: { [key: string]: number };
  datas: string[];
}