/**
 * Mapa de aliases de nomes de responsáveis para unificação.
 * A chave é o nome canônico (correto), os valores são variações conhecidas.
 * A comparação é feita case-insensitive.
 * 
 * Para adicionar novos aliases, basta incluir uma nova entrada no mapa.
 */
export const RESPONSAVEL_ALIASES: Record<string, string[]> = {
  'Luiz Henrique Miguel Pavan': [
    'Luiz Henrique Pavan',
  ],
};

// Monta o mapa reverso (variação -> nome canônico) para lookup rápido
const reverseLookup: Record<string, string> = {};
Object.entries(RESPONSAVEL_ALIASES).forEach(([canonical, aliases]) => {
  aliases.forEach(alias => {
    reverseLookup[alias.trim().toLowerCase()] = canonical;
  });
});

/**
 * Normaliza o nome do responsável aplicando os aliases conhecidos.
 * Retorna o nome canônico se houver um alias, ou o valor original caso contrário.
 */
export function normalizeResponsavel(name: string | null | undefined): string | null {
  if (!name) return null;
  const trimmed = name.trim();
  const key = trimmed.toLowerCase();
  return reverseLookup[key] || trimmed;
}
