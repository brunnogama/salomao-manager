import { useState, useEffect } from 'react';
import { X, Plus, GripVertical, Calendar, Tag, Pencil } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

// Tipos
export type Priority = 'ALTA' | 'MÉDIA' | 'BAIXA';
export type ColumnId = 'fa-fazer' | 'em-progresso' | 'concluido' | 'cobrar-assinatura';

export interface KanbanItem {
  id: string;
  title: string;
  description: string;
  date: string;
  priority: Priority;
  columnId: ColumnId;
  isContract?: boolean;
}


// Cores
const PRIORITY_COLORS = {
  'ALTA': 'bg-red-500/20 text-red-500 border-red-500/30',
  'MÉDIA': 'bg-amber-500/20 text-amber-500 border-amber-500/30',
  'BAIXA': 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30',
};

const COLUMN_COLORS = {
  'fa-fazer': { border: 'border-amber-500/30', bg: 'bg-amber-500/10', title: 'text-amber-400' },
  'em-progresso': { border: 'border-blue-500/30', bg: 'bg-blue-500/10', title: 'text-blue-400' },
  'concluido': { border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', title: 'text-emerald-400' },
  'cobrar-assinatura': { border: 'border-purple-500/30', bg: 'bg-purple-500/10', title: 'text-purple-400' },
};

const COLUMN_TITLES = {
  'fa-fazer': 'A FAZER',
  'em-progresso': 'EM PROGRESSO',
  'concluido': 'CONCLUÍDOS',
  'cobrar-assinatura': 'COBRAR ASSINATURA',
};

export function KanbanModal() {
  const { user, loading } = useAuth();
  
  const [items, setItems] = useState<KanbanItem[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<Partial<KanbanItem>>({
    title: '',
    description: '',
    columnId: 'fa-fazer',
    priority: 'MÉDIA'
  });

  // Carregar dados via Supabase
  useEffect(() => {
    if (loading) return;

    if (!user?.email) {
      setItems([]);
      setHasLoaded(true);
      return;
    }

    async function loadTasks() {
      try {
        const { data, error } = await supabase
          .from('user_kanban_settings')
          .select('tasks')
          .eq('user_email', user?.email)
          .maybeSingle();

        let personalTasks: KanbanItem[] = [];
        if (!error && data && data.tasks) {
          personalTasks = data.tasks;
        }

        // Buscar contratos que não tem assinatura física
        const { data: unsignedContracts } = await supabase
          .from('contracts')
          .select('id, client_name, created_at')
          .eq('status', 'active')
          .eq('physical_signature', false);

        if (unsignedContracts) {
           const existingContractIds = personalTasks.map(t => t.id);
           unsignedContracts.forEach(c => {
              const cid = `contract_${c.id}`;
              if (!existingContractIds.includes(cid)) {
                 personalTasks.push({
                    id: cid,
                    title: c.client_name,
                    description: 'Contrato ativo aguardando assinatura física',
                    date: c.created_at ? c.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
                    priority: 'ALTA',
                    columnId: 'cobrar-assinatura',
                    isContract: true
                 });
              } else {
                 const existingTask = personalTasks.find(t => t.id === cid);
                 if (existingTask) existingTask.isContract = true;
              }
           });
        }

        setItems(personalTasks);
      } catch (err) {
        console.error('Erro ao carregar kanban:', err);
        setItems([]);
      } finally {
        setHasLoaded(true);
      }
    }

    loadTasks();
    
    // Auto-redimensionar para caber 4 colunas perfeitamente (1450px)
    if (window.outerWidth < 1450) {
      window.resizeTo(1450, window.outerHeight || 900);
    }
  }, [user?.email, loading]);

  // Salvar no Supabase sempre que items mudar (apenas se já carregou a versão do usuário)
  useEffect(() => {
    if (hasLoaded && !loading && user?.email) {
      const timer = setTimeout(async () => {
        try {
          await supabase
            .from('user_kanban_settings')
            .upsert({ user_email: user.email, tasks: items });
        } catch (err) {
          console.error('Erro ao salvar kanban no banco:', err);
        }
      }, 500); // 500ms debounce

      return () => clearTimeout(timer);
    }
  }, [items, hasLoaded, loading, user?.email]);

  // Removido bloqueio do scroll pois não é mais modal

  const PRIORITY_WEIGHT: Record<Priority, number> = {
    'ALTA': 3,
    'MÉDIA': 2,
    'BAIXA': 1,
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const sourceCol = result.source.droppableId as ColumnId;
    const destCol = result.destination.droppableId as ColumnId;
    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;

    // Duplicar os items
    const newItems = Array.from(items);

    // Encontrar os index gerais dos items da lista baseada na coluna de origem reordenada por prioridade
    const sourceItems = newItems
      .filter(item => item.columnId === sourceCol)
      .sort((a, b) => PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority]);
    const draggedItem = sourceItems[sourceIndex];
    
    if (!draggedItem) return;

    // Atualizar
    const realIndex = newItems.findIndex(i => i.id === draggedItem.id);
    
    // Se muda de coluna, só atualizar o columnId
    if (sourceCol !== destCol) {
      newItems[realIndex].columnId = destCol;
      // Re-ordenar (mover ao final ou entre a nova coluna)
      // Extrair
      const [removed] = newItems.splice(realIndex, 1);
      
      // Encontrar a posição na nova lista geral
      const destItems = newItems
        .filter(i => i.columnId === destCol)
        .sort((a, b) => PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority]);
      
      if (destIndex >= destItems.length) {
         newItems.push(removed);
      } else {
         const destItemPivot = destItems[destIndex];
         const pivotIndex = newItems.findIndex(i => i.id === destItemPivot.id);
         newItems.splice(pivotIndex, 0, removed);
      }
      
      // Update global contract status if moved from/to concluido
      if (removed.isContract) {
         const contractId = removed.id.replace('contract_', '');
         if (destCol === 'concluido') {
            supabase.from('contracts').update({ physical_signature: true }).eq('id', contractId).then();
         } else if (sourceCol === 'concluido') {
            supabase.from('contracts').update({ physical_signature: false }).eq('id', contractId).then();
         }
      }
    } else {
      // Re-ordenar na mesma coluna
      const [removed] = newItems.splice(realIndex, 1);
      
      const destItems = newItems
        .filter(i => i.columnId === destCol)
        .sort((a, b) => PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority]);
        
      if (destIndex >= destItems.length) {
         newItems.push(removed);
      } else {
         const destItemPivot = destItems[destIndex];
         const pivotIndex = newItems.findIndex(i => i.id === destItemPivot.id);
         newItems.splice(pivotIndex, 0, removed);
      }
    }

    setItems(newItems);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.title) return;

    if (editingItemId) {
      setItems(items.map(item => item.id === editingItemId ? {
        ...item,
        title: newItem.title!,
        description: newItem.description || '',
        date: newItem.date || '',
        priority: newItem.priority as Priority,
        columnId: newItem.columnId as ColumnId,
      } : item));
    } else {
      const item: KanbanItem = {
        id: crypto.randomUUID(),
        title: newItem.title,
        description: newItem.description || '',
        date: newItem.date || new Date().toISOString().split('T')[0],
        priority: newItem.priority as Priority,
        columnId: newItem.columnId as ColumnId,
      };
      setItems([...items, item]);
    }

    setNewItem({
      title: '',
      description: '',
      columnId: 'fa-fazer',
      priority: 'MÉDIA'
    });
    setIsAdding(false);
    setEditingItemId(null);
  };

  const deleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const columns: ColumnId[] = ['fa-fazer', 'em-progresso', 'concluido', 'cobrar-assinatura'];

  return (
    <div className="h-full w-full flex flex-col bg-[#0a192f] p-4 sm:p-6 overflow-hidden min-h-0">
      {/* Container Principal */}
      <div className="bg-[#112240] w-full h-full rounded-3xl border border-white/10 shadow-2xl flex flex-col relative animate-in fade-in duration-300">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-[#d4af37] to-amber-600 rounded-xl shadow-lg shadow-amber-900/20">
              <Tag className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Kanban</h2>
              <p className="text-sm text-blue-200/50 font-medium">Gerencie suas tarefas pessoais</p>
            </div>
          </div>
        </div>

        {/* Board content */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex flex-col md:flex-row gap-6 h-full min-w-max">
              
              {columns.map((colId) => {
                const columnItems = items
                  .filter(item => item.columnId === colId)
                  .sort((a, b) => PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority]);
                const style = COLUMN_COLORS[colId];

                return (
                  <div key={colId} className={`flex-1 min-w-[320px] max-w-sm rounded-2xl flex flex-col bg-[#0a192f]/50 border ${style.border}`}>
                    {/* Header Coluna */}
                    <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${style.bg} ring-2 ring-white/5`} />
                        <h3 className={`text-sm font-bold tracking-wider ${style.title}`}>
                          {COLUMN_TITLES[colId]}
                        </h3>
                      </div>
                      <div className="px-2 py-0.5 rounded-md bg-white/5 text-xs font-bold text-white/50">
                        {columnItems.length}
                      </div>
                    </div>

                    {/* Cards Container */}
                    <Droppable droppableId={colId}>
                      {(provided, snapshot) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className={`flex-1 p-3 overflow-y-auto space-y-3 transition-colors ${
                            snapshot.isDraggingOver ? style.bg : ''
                          }`}
                        >
                          {columnItems.map((item, index) => (
                            <Draggable key={item.id} draggableId={item.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`
                                    group relative p-4 rounded-xl border transition-all duration-200
                                    ${snapshot.isDragging 
                                      ? 'bg-[#1a2f55] border-[#d4af37] shadow-xl shadow-black/40 scale-[1.02] z-50' 
                                      : 'bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05]'}
                                  `}
                                >
                                  {/* Drag Handle */}
                                  <div
                                    {...provided.dragHandleProps}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-white/20 hover:text-white/50"
                                  >
                                    <GripVertical className="w-4 h-4" />
                                  </div>

                                  <div className="pl-6">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                      <h4 className="text-white font-bold text-sm leading-tight">
                                        {item.title}
                                      </h4>
                                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                          onClick={() => {
                                            setNewItem(item);
                                            setEditingItemId(item.id);
                                            setIsAdding(true);
                                          }}
                                          className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-md transition-colors shrink-0 mr-1"
                                          title="Editar"
                                        >
                                          <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => deleteItem(item.id)}
                                          className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md transition-colors shrink-0"
                                          title="Excluir"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>

                                    {item.description && (
                                      <p className="text-xs text-blue-200/50 line-clamp-2 mb-3">
                                        {item.description}
                                      </p>
                                    )}

                                    <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                                      <div className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${PRIORITY_COLORS[item.priority]}`}>
                                        {item.priority}
                                      </div>
                                      
                                      {item.date && (
                                        <div className="flex items-center gap-1.5 text-blue-200/40 text-[10px] font-medium bg-white/5 px-2 py-0.5 rounded-md">
                                          <Calendar className="w-3 h-3" />
                                          {new Date(item.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>

                    {/* Footer / Add Button */}
                    <div className="p-3 mt-auto shrink-0 border-t border-white/5">
                      <button
                        onClick={() => {
                          setNewItem(prev => ({ ...prev, columnId: colId }));
                          setIsAdding(true);
                        }}
                        className={`
                          w-full py-2.5 rounded-xl border border-dashed flex items-center justify-center gap-2 text-sm font-bold transition-all
                          hover:bg-white/5
                          ${style.title} border-current opacity-50 hover:opacity-100
                        `}
                      >
                        <Plus className="w-4 h-4" />
                        Adicionar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        </div>
      </div>

      {/* Add Task Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#112240] rounded-2xl w-full max-w-md border border-white/10 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-6">
              {editingItemId ? 'Editar Tarefa' : 'Nova Tarefa'}
            </h3>
            
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/50 mb-1.5 uppercase tracking-wider">
                  Título <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newItem.title}
                  onChange={e => setNewItem({ ...newItem, title: e.target.value })}
                  className="w-full bg-[#0a192f] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#d4af37] transition-colors"
                  placeholder="Ex: Revisar petição inicial"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/50 mb-1.5 uppercase tracking-wider">
                  Descrição
                </label>
                <textarea
                  value={newItem.description}
                  onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                  className="w-full bg-[#0a192f] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#d4af37] transition-colors resize-none h-24"
                  placeholder="Opcional..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-white/50 mb-1.5 uppercase tracking-wider">
                    Data
                  </label>
                  <input
                    type="date"
                    value={newItem.date}
                    onChange={e => setNewItem({ ...newItem, date: e.target.value })}
                    className="w-full bg-[#0a192f] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#d4af37] transition-colors [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/50 mb-1.5 uppercase tracking-wider">
                    Prioridade
                  </label>
                  <select
                    value={newItem.priority}
                    onChange={e => setNewItem({ ...newItem, priority: e.target.value as Priority })}
                    className="w-full bg-[#0a192f] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#d4af37] transition-colors appearance-none"
                  >
                    <option value="BAIXA">BAIXA</option>
                    <option value="MÉDIA">MÉDIA</option>
                    <option value="ALTA">ALTA</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 mt-6 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingItemId(null);
                  }}
                  className="px-5 py-2.5 rounded-xl font-bold text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newItem.title}
                  className="px-6 py-2.5 rounded-xl font-bold bg-[#d4af37] text-white hover:bg-amber-500 hover:shadow-lg hover:shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
                >
                  {editingItemId ? null : <Plus className="w-4 h-4" />}
                  {editingItemId ? 'Salvar Alterações' : 'Criar Tarefa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
