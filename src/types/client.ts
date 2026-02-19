export interface ClientData {
  id?: string;
  name: string;
  company: string;
  position?: string; // Cargo
  phone: string;
  gift_type: string;
  gift_other?: string;
  quantity: number;
  email: string;
  partner_id?: string; // UUID do partner
  zip_code: string;
  address: string;
  address_number: string;
  address_complement: string;
  neighborhood: string;
  city: string;
  uf: string;
  notes: string;
  gift_history?: any[];
}

// Mapeamento para compatibilidade com código antigo (português)
export interface ClientDataLegacy {
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

// Função para converter dados do formulário (português) para o schema do banco (inglês)
export const mapClientToDb = (legacy: ClientDataLegacy): Partial<ClientData> => {
  return {
    name: legacy.nome,
    company: legacy.empresa,
    position: legacy.cargo,
    phone: legacy.telefone,
    gift_type: legacy.tipo_brinde,
    gift_other: legacy.outro_brinde,
    quantity: legacy.quantidade,
    email: legacy.email,
    // partner_id será resolvido buscando o ID do partner pelo nome
    zip_code: legacy.cep,
    address: legacy.endereco,
    address_number: legacy.numero,
    address_complement: legacy.complemento,
    neighborhood: legacy.bairro,
    city: legacy.cidade,
    uf: legacy.estado,
    notes: legacy.observacoes,
    gift_history: legacy.historico_brindes
  };
};

// Função para converter dados do banco (inglês) para o formato do formulário (português)
export const mapDbToClient = (db: any): ClientDataLegacy => {
  return {
    id: db.id,
    nome: db.name || '',
    empresa: db.company || '',
    cargo: db.position || '',
    telefone: db.phone || '',
    tipo_brinde: db.gift_type || '',
    outro_brinde: db.gift_other || '',
    quantidade: db.quantity || 1,
    email: db.email || '',
    socio: db.partner?.name || '', // assumindo que vem com join
    cep: db.zip_code || '',
    endereco: db.address || '',
    numero: db.address_number || '',
    complemento: db.address_complement || '',
    bairro: db.neighborhood || '',
    cidade: db.city || '',
    estado: db.uf || '',
    observacoes: db.notes || '',
    historico_brindes: db.gift_history || []
  };
};