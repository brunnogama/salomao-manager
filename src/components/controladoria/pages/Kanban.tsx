import React, { useState, useEffect } from 'react';
import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  DropResult, 
  DroppableProvided, 
  DraggableProvided, 
  DraggableStateSnapshot 
} from '@hello-pangea/dnd';
import { Plus, MoreHorizontal, Calendar, User, Search, Filter, Loader2, AlertCircle, Trash2, Edit2, KanbanSquare, Shield } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { KanbanTask, Contract } from '../../../types/controladoria';
import { KanbanTaskModal } from '../kanban/KanbanTaskModal';
import { toast } from 'sonner';

// Configuração de Colunas com Cores do Design System Manager
const columns: Record<string, { id: string; title: string; color: string; dot: string }> = {
  todo: { id: 'todo', title: 'A Fazer', color: 'bg-slate-100', dot: 'bg-slate-400' },
  doing: { id: 'doing', title: 'Em Andamento', color: 'bg-blue-50', dot: 'bg-blue-500' },
  signature: { id: 'signature', title: 'Assinatura', color: 'bg-amber-50', dot: 'bg-amber-500' },
  done: { id: 'done', title: 'Concluído', color: 'bg-emerald-50', dot: 'bg-emerald-500' }
};

export function Kanban() {
  // --- ROLE STATE ---
  const [userRole, setUserRole] = useState<'admin' | 'editor' | 'viewer' | null>(null);

  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<KanbanTask | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);

  useEffect(() => {
    checkUserRole();
    fetchTasks();
    fetchContracts();
  }, []);

  // --- ROLE CHECK ---
  const checkUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
        if (profile) {
            setUserRole(profile.role as 'admin' | 'editor' | 'viewer');
        }
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('kanban_tasks')
      .select('*, contract:contracts(client_name)')
      .order('position');
    
    if (data) setTasks(data);
    setLoading(false);
  };

  const fetchContracts = async () => {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('status', 'active')
      .order('client_name');
    
    if (error) {
      console.error('Erro ao buscar contratos:', error);
    }
    if (data) {
      setContracts(data);
    }
  };

  const onDragEnd = async (result: DropResult) => {
    // Bloqueia drag & drop para viewers
    if (userRole === 'viewer') return;

    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const newTasks = Array.from(tasks);
    const movedTaskIndex = newTasks.findIndex(t => t.id === draggableId);
    const [movedTask] = newTasks.splice(movedTaskIndex, 1);
    
    const newStatus = destination.droppableId as KanbanTask['status'];
    movedTask.status = newStatus;

    const destinationTasks = newTasks.filter(t => t.status === newStatus);
    destinationTasks.splice(destination.index, 0, movedTask);

    const otherTasks = newTasks.filter(t => t.status !== newStatus);
    const finalTasks = [...otherTasks, ...destinationTasks];
    
    setTasks(finalTasks);

    await supabase.from('kanban_tasks').update({ 
      status: newStatus, 
      position: destination.index 
    }).eq('id', draggableId);
  };

  const handleAddTask = () => {
    if (userRole === 'viewer') return toast.error("Sem permissão para criar.");
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: KanbanTask) => {
    if (userRole === 'viewer') return; 
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleDeleteTask = async (id: string, e?: React.MouseEvent) => {
    if (userRole === 'viewer') return;
    
    if (e) e.stopPropagation();
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;
    
    await supabase.from('kanban_tasks').delete().eq('id', id);
    setTasks(tasks.filter(t => t.id !== id));
    setIsModalOpen(false);
  };

  const handleSaveTask = async (taskData: Partial<KanbanTask>) => {
    if (userRole === 'viewer') return;

    const cleanData = { ...taskData };
    
    if (!cleanData.contract_id || cleanData.contract_id === '') {
      delete cleanData.contract_id;
    }

    if (!cleanData.due_date || cleanData.due_date === '') {
      cleanData.due_date = null as any; 
    }
    
    if (editingTask) {
      const { error } = await supabase
        .from('kanban_tasks')
        .update(cleanData)
        .eq('id', editingTask.id);
        
      if (!error) {
        fetchTasks();
      } else {
        console.error('Erro ao atualizar:', error);
        alert('Erro ao salvar tarefa: ' + error.message);
      }
    } else {
      const { error } = await supabase
        .from('kanban_tasks')
        .insert([cleanData]); 
        
      if (!error) {
        fetchTasks();
      } else {
        console.error('Erro ao criar:', error);
        alert('Erro ao criar tarefa: ' + error.message);
      }
    }
    setIsModalOpen(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Alta': return 'bg-red-50 text-red-600 border-red-100';
      case 'Média': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Baixa': return 'bg-blue-50 text-blue-600 border-blue-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.contract?.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 h-full flex flex-col animate-in fade-in duration-500 bg-gray-50/50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-sm font-black text-[#0a192f] uppercase tracking-[0.3em] flex items-center gap-3">
            <KanbanSquare className="w-6 h-6 text-amber-500" /> Fluxo Operacional
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Gestão tática de prazos e diligências.</p>
            {userRole && (
                <span className={`text-[9px] px-2 py-0.5 rounded-lg font-black uppercase border flex items-center gap-1.5 ${
                    userRole === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-gray-50 text-gray-500'
                }`}>
                    <Shield className="w-3 h-3" />
                    {userRole === 'admin' ? 'Administrador' : userRole === 'editor' ? 'Editor' : 'Visualizador'}
                </span>
            )}
          </div>
        </div>
        
        {userRole !== 'viewer' && (
            <button onClick={handleAddTask} className="bg-[#0a192f] hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl shadow-lg transition-all flex items-center text-[10px] font-black uppercase tracking-widest active:scale-95">
              <Plus className="w-4 h-4 mr-2 text-amber-500" /> Nova Tarefa
            </button>
        )}
      </div>

      <div className="flex items-center mb-8 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm w-full max-w-md focus-within:border-[#0a192f] transition-all">
        <Search className="w-5 h-5 text-gray-300 ml-3" />
        <input 
          type="text" 
          placeholder="BUSCAR TAREFA OU CLIENTE..." 
          className="flex-1 p-2.5 outline-none text-[10px] font-bold uppercase tracking-widest text-[#0a192f] placeholder:text-gray-300 bg-transparent"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col justify-center items-center gap-4">
          <Loader2 className="w-10 h-10 text-[#0a192f] animate-spin" />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sincronizando Workflow...</p>
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex-1 overflow-x-auto overflow-y-hidden pb-6 custom-scrollbar">
            <div className="flex gap-6 h-full min-w-max">
              {Object.entries(columns).map(([columnId, column]) => {
                const columnTasks = filteredTasks.filter(t => t.status === columnId);
                
                return (
                  <div key={columnId} className="w-80 flex flex-col bg-gray-100/30 rounded-[2rem] border border-gray-200/50 max-h-full overflow-hidden">
                    <div className={`p-5 border-b border-gray-100 flex justify-between items-center ${column.color}`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${column.dot}`}></div>
                        <h3 className="text-[11px] font-black text-[#0a192f] uppercase tracking-[0.15em]">{column.title}</h3>
                      </div>
                      <span className="bg-white/60 text-[#0a192f] px-2.5 py-0.5 rounded-lg text-[10px] font-black border border-white">{columnTasks.length}</span>
                    </div>
                    
                    <Droppable droppableId={columnId} isDropDisabled={userRole === 'viewer'}>
                      {(provided: DroppableProvided, snapshot: any) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className={`flex-1 p-4 overflow-y-auto min-h-[200px] transition-colors custom-scrollbar ${snapshot.isDraggingOver ? 'bg-amber-50/30' : ''}`}
                        >
                          {columnTasks.map((task, index) => (
                            <Draggable key={task.id} draggableId={task.id} index={index} isDragDisabled={userRole === 'viewer'}>
                              {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={() => handleEditTask(task)}
                                  className={`bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-4 group hover:border-amber-200 hover:shadow-xl transition-all relative overflow-hidden
                                    ${snapshot.isDragging ? 'rotate-2 shadow-2xl ring-2 ring-amber-400 z-50' : ''}
                                    ${userRole === 'viewer' ? 'cursor-default' : 'cursor-pointer'}
                                  `}
                                >
                                  {userRole !== 'viewer' && (
                                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all flex gap-1 transform translate-x-2 group-hover:translate-x-0">
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); handleEditTask(task); }} 
                                          className="p-1.5 hover:bg-gray-50 rounded-lg text-blue-500 transition-colors" 
                                          title="Editar"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button 
                                          onClick={(e) => handleDeleteTask(task.id, e)} 
                                          className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 transition-colors" 
                                          title="Excluir"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                  )}

                                  <div className="flex flex-col gap-3 mb-3">
                                    <div className="flex justify-between items-start pr-6">
                                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getPriorityColor(task.priority)}`}>
                                        {task.priority}
                                      </span>
                                    </div>
                                    <h4 className="text-xs font-black text-[#0a192f] uppercase tracking-tight leading-snug">{task.title}</h4>
                                  </div>

                                  <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-gray-50">
                                    {task.contract?.client_name && (
                                      <div className="flex items-center text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                                        <User className="w-3 h-3 mr-1.5 text-amber-500" />
                                        <span className="truncate">{task.contract.client_name}</span>
                                      </div>
                                    )}
                                    <div className="flex items-center text-[9px] font-black text-gray-300 uppercase tracking-widest">
                                      <Calendar className="w-3 h-3 mr-1.5 text-slate-300" />
                                      {task.due_date ? new Date(task.due_date).toLocaleDateString('pt-BR') : 'SEM PRAZO'}
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
                  </div>
                );
              })}
            </div>
          </div>
        </DragDropContext>
      )}

      <KanbanTaskModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        task={editingTask}
        onSave={handleSaveTask}
        onDelete={() => { if(editingTask) handleDeleteTask(editingTask.id) }}
        contracts={contracts}
      />
    </div>
  );
}