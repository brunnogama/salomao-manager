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
import { 
  Plus, 
  MoreHorizontal, 
  Calendar, 
  User, 
  Search, 
  Filter, 
  Loader2, 
  AlertCircle, 
  Trash2, 
  Edit2, 
  KanbanSquare, 
  Shield,
  Plane,
  UserCircle,
  LogOut,
  Grid
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { KanbanTask, Contract } from '../../../types/controladoria';
import { KanbanTaskModal } from '../kanban/KanbanTaskModal';
import { toast } from 'sonner';

// REMOVIDOS: billing e review
const columns: Record<string, { id: string; title: string; color: string; accent: string }> = {
  todo: { id: 'todo', title: 'A Fazer', color: 'bg-gray-100', accent: 'bg-gray-400' },
  doing: { id: 'doing', title: 'Em Andamento', color: 'bg-blue-50', accent: 'bg-blue-600' },
  signature: { id: 'signature', title: 'Assinatura', color: 'bg-orange-50', accent: 'bg-amber-600' },
  done: { id: 'done', title: 'Concluído', color: 'bg-green-50', accent: 'bg-emerald-600' }
};

interface KanbanProps {
  userName?: string;
  onModuleHome?: () => void;
  onLogout?: () => void;
}

export function Kanban({ 
  userName = 'Usuário', 
  onModuleHome, 
  onLogout 
}: KanbanProps) {
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
            .from('user_profiles')
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
        toast.error('Erro ao salvar tarefa: ' + error.message);
      }
    } else {
      const { error } = await supabase
        .from('kanban_tasks')
        .insert([cleanData]); 
        
      if (!error) {
        fetchTasks();
      } else {
        toast.error('Erro ao criar tarefa: ' + error.message);
      }
    }
    setIsModalOpen(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Alta': return 'bg-red-50 text-red-600 border-red-100';
      case 'Média': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Baixa': return 'bg-blue-50 text-blue-600 border-blue-100';
      default: return 'bg-gray-50 text-gray-500 border-gray-100';
    }
  };

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.contract?.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-6 space-y-6 overflow-hidden">
      
      {/* 1. Header - Salomão Design System */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] p-3 shadow-lg">
            <KanbanSquare className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">Kanban</h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">Gestão de Fluxo e Pendências</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end mr-2">
            <span className="text-sm font-bold text-[#0a192f]">{userName}</span>
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Online</span>
              {userRole && (
                <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">
                  • {userRole === 'admin' ? 'Administrador' : userRole === 'editor' ? 'Editor' : 'Visualizador'}
                </span>
              )}
            </div>
          </div>
          <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-[#1e3a8a]">
            <UserCircle className="h-5 w-5" />
          </div>
          {onModuleHome && (
            <button onClick={onModuleHome} className="p-2 text-gray-400 hover:text-[#1e3a8a] hover:bg-blue-50 rounded-lg transition-colors">
              <Grid className="h-5 w-5" />
            </button>
          )}
          {onLogout && (
            <button onClick={onLogout} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <LogOut className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Toolbar - Salomão Design System */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Filtrar tarefas ou clientes..." 
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:border-[#1e3a8a] transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {userRole !== 'viewer' && (
          <button
            onClick={handleAddTask}
            className="flex items-center gap-2 px-6 py-2 bg-[#1e3a8a] text-white rounded-lg hover:bg-[#112240] transition-all shadow-md active:scale-95 text-xs font-black uppercase tracking-widest h-[40px]"
          >
            <Plus className="h-4 w-4" /> Nova Tarefa
          </button>
        )}
      </div>

      {/* 3. Área de Conteúdo (Board) */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#1e3a8a]" />
          <p className="text-[10px] font-black uppercase tracking-widest">Sincronizando quadro...</p>
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 custom-scrollbar">
            <div className="flex gap-6 h-full min-w-max">
              {Object.entries(columns).map(([columnId, column]) => {
                const columnTasks = filteredTasks.filter(t => t.status === columnId);
                
                return (
                  <div key={columnId} className="w-80 flex flex-col bg-gray-100/30 rounded-2xl border border-gray-200/60 max-h-full overflow-hidden">
                    <div className={`p-4 border-b border-gray-200/50 flex justify-between items-center relative overflow-hidden ${column.color}`}>
                      <div className={`absolute left-0 top-0 h-full w-1 ${column.accent}`}></div>
                      <h3 className="text-[11px] font-black text-[#0a192f] uppercase tracking-widest">{column.title}</h3>
                      <span className="bg-white/60 px-2 py-0.5 rounded-lg text-[10px] font-black text-gray-500 border border-gray-200/50">{columnTasks.length}</span>
                    </div>
                    
                    <Droppable droppableId={columnId} isDropDisabled={userRole === 'viewer'}>
                      {(provided: DroppableProvided, snapshot: any) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className={`flex-1 p-3 overflow-y-auto min-h-[150px] transition-colors custom-scrollbar ${snapshot.isDraggingOver ? 'bg-blue-50/40' : ''}`}
                        >
                          {columnTasks.map((task, index) => (
                            <Draggable key={task.id} draggableId={task.id} index={index} isDragDisabled={userRole === 'viewer'}>
                              {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={() => handleEditTask(task)}
                                  className={`bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-3 group hover:shadow-md transition-all relative overflow-hidden
                                    ${snapshot.isDragging ? 'rotate-2 shadow-xl ring-2 ring-[#1e3a8a] ring-opacity-20' : ''}
                                    ${userRole === 'viewer' ? 'cursor-default' : 'cursor-pointer'}
                                  `}
                                >
                                  {/* Indicador lateral de prioridade sutil */}
                                  <div className={`absolute left-0 top-0 h-full w-1 ${
                                    task.priority === 'Alta' ? 'bg-red-500' : task.priority === 'Média' ? 'bg-amber-500' : 'bg-blue-500'
                                  }`}></div>

                                  {/* Botões de Ação Rápida */}
                                  {userRole !== 'viewer' && (
                                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/90 backdrop-blur-sm rounded-lg p-1 shadow-sm border border-gray-100">
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); handleEditTask(task); }} 
                                          className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                                        >
                                          <Edit2 className="w-3 h-3" />
                                        </button>
                                        <button 
                                          onClick={(e) => handleDeleteTask(task.id, e)} 
                                          className="p-1.5 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                  )}

                                  <div className="flex justify-between items-start mb-3 gap-2">
                                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getPriorityColor(task.priority)}`}>
                                      {task.priority}
                                    </span>
                                    {task.contract?.client_name && (
                                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest truncate max-w-[120px]" title={task.contract.client_name}>
                                        {task.contract.client_name}
                                      </span>
                                    )}
                                  </div>
                                  
                                  <h4 className="text-xs font-black text-[#0a192f] mb-3 leading-tight uppercase tracking-tight">{task.title}</h4>
                                  
                                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                                    <div className="flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                      <Calendar className="w-3 h-3 mr-1.5 text-[#1e3a8a]" />
                                      {task.due_date ? new Date(task.due_date).toLocaleDateString('pt-BR') : '-'}
                                    </div>
                                    <div className="h-6 w-6 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center">
                                      <User className="w-3 h-3 text-gray-400" />
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