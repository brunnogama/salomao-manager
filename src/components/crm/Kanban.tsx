import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
  Plus,
  Clock,
  CheckCircle2,
  Circle,
  X,
  Pencil,
  Trash2,
  Calendar,
  Save,
  KanbanSquare,
  UserCircle,
  Grid,
  LogOut
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { logAction } from '../../lib/logger';
import { Task } from '../../types/kanban';

const COLUMNS = [
  { id: 'todo', title: 'A Fazer', color: 'orange', icon: <Clock className="h-5 w-5" /> },
  { id: 'in_progress', title: 'Em Progresso', color: 'blue', icon: <Circle className="h-5 w-5" /> },
  { id: 'done', title: 'Concluídos', color: 'green', icon: <CheckCircle2 className="h-5 w-5" /> },
];

interface KanbanProps {
  userName?: string;
  onModuleHome?: () => void;
  onLogout?: () => void;
}

export function Kanban({ userName = 'Usuário', onModuleHome, onLogout }: KanbanProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'MEDIA', status: 'todo' });
  const [editFormData, setEditFormData] = useState({ title: '', description: '', priority: '' });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: true });
    if (data) setTasks(data as Task[]);
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) return;

    const newStatus = destination.droppableId as Task['status'];
    const updatedTasks = tasks.map(t => t.id === draggableId ? { ...t, status: newStatus } : t);
    setTasks(updatedTasks);

    await supabase.from('tasks').update({ status: newStatus }).eq('id', draggableId);
    await logAction('EDITAR', 'KANBAN', `Moveu tarefa para ${newStatus}: ${updatedTasks.find(t => t.id === draggableId)?.title}`);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.from('tasks').insert([newTask]).select();
    if (!error && data) {
      setTasks([...tasks, data[0] as Task]);
      await logAction('CRIAR', 'KANBAN', `Nova tarefa: ${newTask.title}`);
      setIsAddModalOpen(false);
      setNewTask({ title: '', description: '', priority: 'MEDIA', status: 'todo' });
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    const { error } = await supabase.from('tasks').update(editFormData).eq('id', selectedTask.id);
    if (!error) {
      setTasks(tasks.map(t => t.id === selectedTask.id ? { ...t, ...editFormData } : t));
      await logAction('EDITAR', 'KANBAN', `Editou tarefa: ${editFormData.title}`);
      setIsEditMode(false);
      setSelectedTask({ ...selectedTask, ...editFormData });
    }
  };

  const deleteTask = async (id: string) => {
    if (confirm('Deseja realmente excluir esta tarefa?')) {
      const taskToDelete = tasks.find(t => t.id === id);
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (!error) {
        setTasks(tasks.filter(t => t.id !== id));
        await logAction('EXCLUIR', 'KANBAN', `Removeu tarefa: ${taskToDelete?.title}`);
        setIsDetailsModalOpen(false);
      }
    }
  };

  const openDetails = (task: Task) => {
    setSelectedTask(task);
    setEditFormData({ title: task.title, description: task.description, priority: task.priority });
    setIsEditMode(false);
    setIsDetailsModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 p-6 space-y-6 overflow-hidden">

      {/* PAGE HEADER - Identêntico ao padrão CRM */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg shrink-0">
            <KanbanSquare className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
              Kanban
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-1 sm:mt-0.5">
              Organize suas tarefas visualmente
            </p>
          </div>
        </div>

        {/* Right: User Info & Global Actions */}
        <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto mt-2 sm:mt-0">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-bold text-[#0a192f]">{userName}</span>
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Conectado</span>
          </div>
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#1e3a8a] to-[#112240] flex items-center justify-center text-white shadow-md">
            <UserCircle className="h-5 w-5" />
          </div>
          {onModuleHome && (
            <button
              onClick={onModuleHome}
              className="p-2 text-gray-600 hover:bg-gray-100 hover:text-[#1e3a8a] rounded-lg transition-all"
              title="Voltar aos módulos"
            >
              <Grid className="h-5 w-5" />
            </button>
          )}
          {onLogout && (
            <button
              onClick={onLogout}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
              title="Sair"
            >
              <LogOut className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* KANBAN BOARD */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 flex overflow-x-auto pb-4 custom-scrollbar min-h-0">
          <div className="flex gap-4 h-full mx-auto">
            {COLUMNS.map((column) => (
              <div key={column.id} className={`flex-shrink-0 w-80 lg:w-96 flex flex-col rounded-2xl border-2 shadow-sm transition-all overflow-hidden ${column.color === 'orange' ? 'bg-orange-50/30 border-orange-100' :
                column.color === 'blue' ? 'bg-blue-50/30 border-blue-100' :
                  'bg-green-50/30 border-green-100'
                }`}>

                {/* Column Header */}
                <div className="p-5 flex items-center justify-between bg-white border-b border-gray-100">
                  <div className={`flex items-center gap-2.5 font-black text-[11px] uppercase tracking-[0.15em] ${column.color === 'orange' ? 'text-orange-700' :
                    column.color === 'blue' ? 'text-blue-700' : 'text-green-700'
                    }`}>
                    {column.icon} {column.title}
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border shadow-sm ${column.color === 'orange' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                    column.color === 'blue' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                      'bg-green-100 text-green-700 border-green-200'
                    }`}>
                    {tasks.filter(t => t.status === column.id).length}
                  </span>
                </div>

                {/* Add Task Button for Column */}
                <div className="px-4 py-3 bg-white/50">
                  <button
                    onClick={() => { setNewTask({ ...newTask, status: column.id as any }); setIsAddModalOpen(true); }}
                    className={`w-full py-2.5 rounded-xl text-white text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95 ${column.color === 'orange' ? 'bg-[#1e3a8a] hover:bg-[#112240]' :
                      column.color === 'blue' ? 'bg-[#1e3a8a] hover:bg-[#112240]' :
                        'bg-[#1e3a8a] hover:bg-[#112240]'
                      }`}
                  >
                    <Plus className="h-4 w-4" /> Nova Tarefa
                  </button>
                </div>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`flex-1 p-3 overflow-y-auto custom-scrollbar transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50/40' : ''
                        }`}
                    >
                      {tasks.filter(t => t.status === column.id).map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snap) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => openDetails(task)}
                              className={`bg-white p-4 rounded-xl shadow-sm border-2 mb-3 hover:border-[#1e3a8a]/30 hover:shadow-md transition-all cursor-pointer group ${snap.isDragging ? 'shadow-2xl rotate-2 border-[#1e3a8a] scale-105 z-50' : 'border-gray-100'
                                }`}
                            >
                              <h4 className="font-black text-[#0a192f] text-sm mb-1 leading-tight group-hover:text-[#1e3a8a] transition-colors">{task.title}</h4>
                              <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed font-semibold">{task.description}</p>
                              <div className="flex items-center justify-between">
                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm ${task.priority === 'ALTA' ? 'bg-red-50 text-red-700 border-red-200' :
                                  task.priority === 'MEDIA' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                    'bg-gray-50 text-gray-700 border-gray-200'
                                  }`}>
                                  {task.priority}
                                </span>
                                <div className="flex items-center gap-1 text-[9px] text-gray-400 font-black uppercase tracking-wider">
                                  <Calendar className="h-3 w-3" /> {new Date(task.created_at).toLocaleDateString()}
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
            ))}
          </div>
        </div>
      </DragDropContext>

      {/* Modal Adicionar - Utilizando os tokens do DS */}
      {isAddModalOpen && (
        <TaskModal
          title="Nova Tarefa"
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddTask}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Título</label>
              <input
                required
                placeholder="Título da tarefa"
                className="w-full bg-gray-100/50 border border-gray-200 rounded-xl p-2.5 outline-none text-sm font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                value={newTask.title}
                onChange={e => setNewTask({ ...newTask, title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Descrição</label>
              <textarea
                rows={3}
                placeholder="Detalhes..."
                className="w-full bg-gray-100/50 border border-gray-200 rounded-xl p-2.5 outline-none resize-none text-sm font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                value={newTask.description}
                onChange={e => setNewTask({ ...newTask, description: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Prioridade</label>
              <select
                className="w-full bg-gray-100/50 border border-gray-200 rounded-xl p-2.5 text-sm font-black outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                value={newTask.priority}
                onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
              >
                <option value="BAIXA">BAIXA</option>
                <option value="MEDIA">MÉDIA</option>
                <option value="ALTA">ALTA</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full bg-[#1e3a8a] text-white py-3 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-[#112240] transition-all active:scale-95"
            >
              Criar Tarefa
            </button>
          </div>
        </TaskModal>
      )}

      {/* Modal Detalhes / Edição - Padrão Salomão [2rem] radius */}
      {isDetailsModalOpen && selectedTask && (
        <div className="fixed inset-0 bg-[#0a192f]/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl border border-white/20">
            {/* Header Modal */}
            <div className="px-8 py-5 border-b border-gray-50 flex justify-between items-center bg-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <KanbanSquare className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#112240] tracking-tight leading-none">
                    {isEditMode ? 'Editar Tarefa' : 'Detalhes'}
                  </h3>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                    ID: {selectedTask.id.substring(0, 8)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!isEditMode && (
                  <button
                    onClick={() => setIsEditMode(true)}
                    className="p-2 hover:bg-gray-100 rounded-xl text-blue-600 transition-all"
                    title="Editar"
                  >
                    <Pencil className="h-5 w-5" />
                  </button>
                )}
                <button
                  onClick={() => deleteTask(selectedTask.id)}
                  className="p-2 hover:bg-red-50 rounded-xl text-red-500 transition-all"
                  title="Excluir"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 group transition-all"
                >
                  <X className="h-5 w-5 group-hover:rotate-90 transition-transform" />
                </button>
              </div>
            </div>

            <div className="px-8 py-6">
              {isEditMode ? (
                <form onSubmit={handleUpdateTask} className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Título</label>
                    <input
                      className="w-full bg-gray-100/50 border border-gray-200 rounded-xl p-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      value={editFormData.title}
                      onChange={e => setEditFormData({ ...editFormData, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Descrição</label>
                    <textarea
                      rows={4}
                      className="w-full bg-gray-100/50 border border-gray-200 rounded-xl p-2.5 text-sm font-semibold outline-none resize-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      value={editFormData.description}
                      onChange={e => setEditFormData({ ...editFormData, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Prioridade</label>
                    <select
                      className="w-full bg-gray-100/50 border border-gray-200 rounded-xl p-2.5 text-sm font-black outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                      value={editFormData.priority}
                      onChange={e => setEditFormData({ ...editFormData, priority: e.target.value })}
                    >
                      <option value="BAIXA">BAIXA</option>
                      <option value="MEDIA">MÉDIA</option>
                      <option value="ALTA">ALTA</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-emerald-600 text-white py-3 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg hover:bg-emerald-700 transition-all active:scale-95"
                  >
                    <Save className="h-4 w-4" /> Salvar Alterações
                  </button>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Título</label>
                    <h3 className="text-lg font-black text-[#112240]">{selectedTask.title}</h3>
                  </div>
                  <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Descrição</label>
                    <p className="text-gray-600 leading-relaxed text-sm font-semibold">{selectedTask.description || 'Sem descrição.'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                      <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Prioridade</label>
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm ${selectedTask.priority === 'ALTA' ? 'bg-red-50 text-red-700 border-red-200' :
                        selectedTask.priority === 'MEDIA' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-gray-50 text-gray-700 border-gray-200'
                        }`}>
                        {selectedTask.priority}
                      </span>
                    </div>
                    <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                      <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Status</label>
                      <span className="text-sm font-black text-[#112240] uppercase tracking-wider">
                        {COLUMNS.find(c => c.id === selectedTask.status)?.title}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-componente de Modal para reuso interno ajustado ao DS
function TaskModal({ title, onClose, onSubmit, children }: any) {
  return (
    <div className="fixed inset-0 bg-[#0a192f]/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl border border-white/20">
        <div className="px-8 py-5 border-b border-gray-50 flex justify-between items-center bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Plus className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-black text-[#112240] tracking-tight">{title}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 group transition-all">
            <X className="h-5 w-5 group-hover:rotate-90 transition-transform" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-8">
          {children}
        </form>
      </div>
    </div>
  );
}