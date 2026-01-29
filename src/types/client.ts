export interface ClientData {
  id?: number;
  nome: string;
  empresa: string;
  cargo: string;
  telefone: string;
  tipo_brinde: string;
  outro_brinde?: string;
  quantidade: number;
  email: string;
  socio: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  observacoes: string;
  historico_brindes?: any[];
}

export const getBrindeColors = (tipo: string) => {
  const configs: Record<string, { avatar: string; badge: string }> = {
    'Brinde VIP': {
      avatar: 'bg-gradient-to-br from-purple-500 to-purple-600',
      badge: 'bg-purple-100 text-purple-700 border-purple-200'
    },
    'Brinde Médio': {
      avatar: 'bg-gradient-to-br from-green-500 to-green-600',
      badge: 'bg-green-100 text-green-700 border-green-200'
    },
    'Outro': {
      avatar: 'bg-gradient-to-br from-blue-500 to-blue-600',
      badge: 'bg-blue-100 text-blue-700 border-blue-200'
    }
  };
  return configs[tipo] || {
    avatar: 'bg-gradient-to-br from-gray-400 to-gray-500',
    badge: 'bg-gray-100 text-gray-700 border-gray-200'
  };
};