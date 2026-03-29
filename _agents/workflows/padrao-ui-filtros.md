---
description: Como padronizar a UI e UX de barras de pesquisa, filtros e KPIs nos módulos principais do sistema
---

Este workflow define as regras de arquitetura visual e técnica para a refatoração ou construção de novos módulos (tabelas e listas) no gerenciador.

### 1. Layout Principal (Top Section)
O cabeçalho do módulo (acima da tabela principal) deve ser um container flexível horizontal.
- **Estrutura**: `<div className="flex flex-col lg:flex-row items-stretch gap-4">`
- **Lado Esquerdo**: Componentes de contagem/KPI encapsulados em `<div className="shrink-0">`. Exemplo: badge com número de usuários ativos.
- **Lado Direito**: Componente `FilterBar` ocupando o restante do espaço com `<div className="flex-1">`.

### 2. Componente `FilterBar`
O componente `FilterBar` deve unificar a pesquisa em texto, as *tags* (filtros ativos) e os botões de seleção de filtros em uma única "fita" responsiva.

#### Regras Visuais e Comportamentais:
1. **Container do Input + Tags**: 
   - A barra escura de busca de texto funciona lado-a-lado com as *tags* visuais.
   - Devem ficar alinhados à esquerda, ocupando o espaço `flex-1`.
2. **Botões Individuais de Filtro**:
   - NÃO utilize o botão genérico antigo "Filtros".
   - Extraia as categorias principais pertinentes do módulo (ex: Líder, Sócio, Cargo, Local, Status) e renderize um botão individual para cada ao lado da barra de busca.
   - Utilize a classe `flex items-center gap-2 flex-wrap` para abraçá-los à direita do input.
3. **Dropdown Seguro (Prevenção de Scroll Horizontal)**:
   - **MUITO IMPORTANTE**: Quando um botão de filtro abre um menu popover/dropdown, certifique-se de que o CSS do popover NÃO extravase o limite da tela.
   - Para botões alinhados à direita do viewport, o contêiner do dropdown **DEVE REGRAS CLARAMENTE** possuir a diretriz `right-0` e NÃO `left-0`.
   - Exemplo da estrutura de popover correta (flutuante): 
     ```tsx
     <div className="absolute top-full right-0 mt-2 w-72 bg-white border border-gray-100 rounded-xl shadow-2xl z-[9999] animate-in fade-in slide-in-from-top-2 overflow-hidden">
     ```
   - O uso de `right-0` ancora o lado direito do dropdown no lado direito do botão, garantindo que o dropdown se expanda "para a esquerda", no sentido em que há espaço, evitando barras de rolagem não intencionais na página.

### 3. Gerenciamento de Estado de Filtros (Contexto/Controller)
- **Multi-select como Regra**: Independentemente da API sugerir tipo string única, a interface para filtros granulares (Categorias e Botões Isolados) deve operar através de seleções múltiplas (`Array<string>`).
- Todas as lógicas base de busca, filtragem cruzada `Array.includes` e renderização condicional devem ocorrer no `Controller` da página (não no `FilterBar`). O `FilterBar` deve atuar *somente* como um manipulador visual cego.

### 4. Componente de Tabela e Exibição de Strings Extensas
- **Sintetização Visual**: Nunca renderize listas infinitas separadas por vírgula no meio de tabelas (ex: "Ambiental, Contencioso, Cível..."). 
- Se o número de classificações de um registro (`tags.length`) for maior do que 1, você deve exibi-las sumarizadas dentro de um badge.
  - Exemplo de UI de Badge: 
    ```tsx
    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 border border-gray-200 rounded text-[9px] font-bold uppercase tracking-widest">
      {tags.length} tags
    </span>
    ```

### 5. Filtros Baseados em Tempo (Período/Data)
Todos os filtros relacionados a recortes de tempo (ex: "Período", "Criado em", "Data de Vencimento") devem, obrigatoriamente, abandonar o esquema antigo de select único estático (`mes_atual`, `todos`) e adotar a categoria `type: 'date_range'` integrada diretamente ao `FilterBar`.

#### Regras:
1. **Tipagem do Estado**:
   Deve-se usar um objeto `{ start: string, end: string }` e não strings ou arrays.
   ```tsx
   const [filterPeriodo, setFilterPeriodo] = useState<{start: string, end: string}>({ start: '', end: '' });
   ```
2. **Definição da Categoria na `FilterBar`**:
   ```tsx
   {
     key: 'periodo',
     label: 'Período',
     icon: Calendar,
     type: 'date_range',
     value: filterPeriodo,
     onChange: setFilterPeriodo,
   }
   ```
3. **Pílulas (Chips) Ativos**:
   Ao renderizar a tag ativa do período acima da barra de busca, use utilitários de formatação de datas (reverter de `YYYY-MM-DD` para `DD/MM/YYYY`) e formule labels descritivas: `"A partir de DD/MM/YYYY"`, `"Até DD/MM/YYYY"` ou o range completo `"DD/MM/YYYY - DD/MM/YYYY"`.
4. **Resolução do Array Pai (Filtragem)**:
   A validação de `start` e `end` em dados serializados do Supabase pode ser feita por simple string comparison, extraindo apenas os primeiros 10 caracteres do timestamp:
   ```tsx
   if ((filterPeriodo.start || filterPeriodo.end) && row.created_at) {
      const dateStr = row.created_at.split('T')[0];
      if (filterPeriodo.start && dateStr < filterPeriodo.start) return false;
      if (filterPeriodo.end && dateStr > filterPeriodo.end) return false;
   }
   ```
