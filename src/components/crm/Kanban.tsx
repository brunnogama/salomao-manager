// src/components/crm/Kanban.tsx
import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, Clock, CheckCircle2, Circle, X, Pencil, Trash2, Calendar, Save, KanbanSquare } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { logAction } from '../../lib/logger';
import { Task } from '../../types/kanban';

const COLUMNS = [
  { id: 'todo', title: 'A Fazer', color: 'orange', icon: <Clock className="h-5 w-5" /> },
  { id: 'in_progress', title: 'Em Progresso', color: 'blue', icon: <Circle className="h-5 w-5" /> },
  { id: 'done', title: 'Concluídos', color: 'green', icon: <CheckCircle2 className="h-5 w-5" /> },
];

export function Kanban() {
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
    <div className="flex flex-col h-full space-y-6">
      
      {/* PAGE HEADER */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] shadow-lg">
            <KanbanSquare className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">
              Kanban
            </h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">
              Organize suas tarefas visualmente
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-2.5 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100 border border-orange-200">
              <Clock className="h-4 w-4 text-orange-600" />
            </div>
            <div className="border-l border-gray-200 pl-3">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">A Fazer</p>
              <p className="text-[20px] font-black text-[#0a192f] tracking-tight leading-none">
                {tasks.filter(t => t.status === 'todo').length}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-2.5 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 border border-blue-200">
              <Circle className="h-4 w-4 text-blue-600" />
            </div>
            <div className="border-l border-gray-200 pl-3">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Em Progresso</p>
              <p className="text-[20px] font-black text-[#0a192f] tracking-tight leading-none">
                {tasks.filter(t => t.status === 'in_progress').length}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-2.5 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 border border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
            <div className="border-l border-gray-200 pl-3">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Concluídos</p>
              <p className="text-[20px] font-black text-[#0a192f] tracking-tight leading-none">
                {tasks.filter(t => t.status === 'done').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KANBAN BOARD */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 flex justify-center overflow-x-auto pb-2 h-full custom-scrollbar">
          <div className="flex gap-4">
            {COLUMNS.map((column) => (
            <div key={column.id} className={`flex-shrink-0 w-80 lg:w-96 flex flex-col rounded-2xl border-2 h-full shadow-sm transition-all ${
              column.color === 'orange' ? 'bg-gradient-to-b from-orange-50 to-white border-orange-200' : 
              column.color === 'blue' ? 'bg-gradient-to-b from-blue-50 to-white border-blue-200' : 
              'bg-gradient-to-b from-green-50 to-white border-green-200'
            }`}>
              
              <div className="p-5 flex items-center justify-between border-b border-gray-100">
                <div className={`flex items-center gap-2.5 font-black text-sm uppercase tracking-wide ${
                  column.color === 'orange' ? 'text-orange-700' : 
                  column.color === 'blue' ? 'text-blue-700' : 'text-green-700'
                }`}>
                  {column.icon} {column.title}
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black border shadow-sm ${
                  column.color === 'orange' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                  column.color === 'blue' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                  'bg-green-100 text-green-700 border-green-200'
                }`}>
                  {tasks.filter(t => t.status === column.id).length}
                </span>
              </div>

              <div className="px-4 py-3">
                <button 
                  onClick={() => { setNewTask({ ...newTask, status: column.id as any }); setIsAddModalOpen(true); }}
                  className={`w-full py-2.5 rounded-xl text-white text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 ${
                    column.color === 'orange' ? 'bg-gradient-to-r from-orange-600 to-orange-700' : 
                    column.color === 'blue' ? 'bg-gradient-to-r from-blue-600 to-blue-700' : 
                    'bg-gradient-to-r from-green-600 to-green-700'
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
                    className={`flex-1 p-3 overflow-y-auto custom-scrollbar transition-colors ${
                      snapshot.isDraggingOver ? 'bg-blue-50/50 rounded-b-2xl' : ''
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
                            className={`bg-white p-4 rounded-xl shadow-sm border-2 mb-3 hover:border-[#1e3a8a]/30 hover:shadow-md transition-all cursor-pointer ${
                              snap.isDragging ? 'shadow-2xl rotate-2 border-[#1e3a8a] scale-105' : 'border-gray-200'
                            }`}
                          >
                            <h4 className="font-black text-[#0a192f] text-sm mb-1 leading-tight">{task.title}</h4>
                            <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed font-medium">{task.description}</p>
                            <div className="flex items-center justify-between">
                              <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm ${
                                task.priority === 'ALTA' ? 'bg-red-50 text-red-700 border-red-200' :
                                task.priority === 'MEDIA' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                'bg-gray-50 text-gray-700 border-gray-200'
                              }`}>
                                {task.priority}
                              </span>
                              <div className="flex items-center gap-1 text-[9px] text-gray-400 font-semibold">
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

      {/* Modal Adicionar */}
      {isAddModalOpen && (
        <TaskModal 
          title="Nova Tarefa" 
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddTask}
        >
          <div>
            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Título</label>
            <input 
              required 
              placeholder="Digite o título da tarefa" 
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 outline-none text-sm font-medium focus:border-[#1e3a8a] focus:ring-2 focus:ring-[#1e3a8a]/20 transition-all" 
              value={newTask.title} 
              onChange={e => setNewTask({...newTask, title: e.target.value})} 
            />
          </div>
          <div>
            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Descrição</label>
            <textarea 
              rows={3} 
              placeholder="Descreva a tarefa..." 
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 outline-none resize-none text-sm font-medium focus:border-[#1e3a8a] focus:ring-2 focus:ring-[#1e3a8a]/20 transition-all" 
              value={newTask.description} 
              onChange={e => setNewTask({...newTask, description: e.target.value})} 
            />
          </div>
          <div>
            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Prioridade</label>
            <select 
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:border-[#1e3a8a] focus:ring-2 focus:ring-[#1e3a8a]/20 transition-all" 
              value={newTask.priority} 
              onChange={e => setNewTask({...newTask, priority: e.target.value})}
            >
              <option value="BAIXA">Baixa</option>
              <option value="MEDIA">Média</option>
              <option value="ALTA">Alta</option>
            </select>
          </div>
          <button 
            type="submit" 
            className="w-full bg-gradient-to-r from-[#1e3a8a] to-[#112240] text-white py-3 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg hover:shadow-xl transition-all active:scale-95"
          >
            Criar Tarefa
          </button>
        </TaskModal>
      )}

      {/* Modal Detalhes / Edição */}
      {isDetailsModalOpen && selectedTask && (
        <div className="fixed inset-0 bg-[#0a192f]/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl border border-gray-200/50">
            <div className="bg-gradient-to-r from-[#1e3a8a] to-[#112240] px-8 py-5 text-white flex items-center justify-between">
              <h2 className="text-[20px] font-black tracking-tight">{isEditMode ? 'Editar Tarefa' : 'Detalhes da Tarefa'}</h2>
              <div className="flex items-center gap-2">
                {!isEditMode && (
                  <button 
                    onClick={() => setIsEditMode(true)} 
                    className="p-2 hover:bg-white/10 rounded-lg transition-all"
                  >
                    <Pencil className="h-5 w-5" />
                  </button>
                )}
                <button 
                  onClick={() => deleteTask(selectedTask.id)} 
                  className="p-2 hover:bg-red-500/20 rounded-lg text-red-300 transition-all"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
                <button 
                  onClick={() => setIsDetailsModalOpen(false)} 
                  className="p-2 hover:bg-white/10 rounded-lg transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-8">
              {isEditMode ? (
                <form onSubmit={handleUpdateTask} className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Título</label>
                    <input 
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-[#1e3a8a] focus:ring-2 focus:ring-[#1e3a8a]/20 transition-all" 
                      value={editFormData.title} 
                      onChange={e => setEditFormData({...editFormData, title: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Descrição</label>
                    <textarea 
                      rows={4} 
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium resize-none focus:border-[#1e3a8a] focus:ring-2 focus:ring-[#1e3a8a]/20 transition-all" 
                      value={editFormData.description} 
                      onChange={e => setEditFormData({...editFormData, description: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Prioridade</label>
                    <select 
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:border-[#1e3a8a] focus:ring-2 focus:ring-[#1e3a8a]/20 transition-all" 
                      value={editFormData.priority} 
                      onChange={e => setEditFormData({...editFormData, priority: e.target.value})}
                    >
                      <option value="BAIXA">Baixa</option>
                      <option value="MEDIA">Média</option>
                      <option value="ALTA">Alta</option>
                    </select>
                  </div>
                  <button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95"
                  >
                    <Save className="h-4 w-4" /> Salvar Alterações
                  </button>
                </form>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Título</label>
                    <h3 className="text-lg font-black text-[#0a192f]">{selectedTask.title}</h3>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Descrição</label>
                    <p className="text-gray-600 leading-relaxed text-sm font-medium">{selectedTask.description || 'Sem descrição.'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Prioridade</label>
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm ${
                        selectedTask.priority === 'ALTA' ? 'bg-red-50 text-red-700 border-red-200' :
                        selectedTask.priority === 'MEDIA' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-gray-50 text-gray-700 border-gray-200'
                      }`}>
                        {selectedTask.priority}
                      </span>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Status</label>
                      <span className="text-sm font-black text-[#0a192f]">
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

// Sub-componente de Modal para reuso interno
function TaskModal({ title, onClose, onSubmit, children }: any) {
  return (
    <div className="fixed inset-0 bg-[#0a192f]/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl border border-gray-200/50">
        <div className="bg-gradient-to-r from-[#1e3a8a] to-[#112240] px-8 py-5 text-white flex items-center justify-between">
          <h2 className="text-[20px] font-black tracking-tight">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-all">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {children}
        </form>
      </div>
    </div>
  );
}
