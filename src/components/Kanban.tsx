import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, Clock, CheckCircle2, Circle, X, Pencil, Trash2, Calendar, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: 'todo' | 'in_progress' | 'done';
  created_at: string;
}

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
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (data) setTasks(data as Task[]);
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId as Task['status'];
    const updatedTasks = tasks.map(t => t.id === draggableId ? { ...t, status: newStatus } : t);
    setTasks(updatedTasks);

    await supabase.from('tasks').update({ status: newStatus }).eq('id', draggableId);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.from('tasks').insert([newTask]).select();
    if (!error && data) {
      setTasks([...tasks, data[0] as Task]);
      setIsAddModalOpen(false);
      setNewTask({ title: '', description: '', priority: 'MEDIA', status: 'todo' });
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    const { error } = await supabase
      .from('tasks')
      .update(editFormData)
      .eq('id', selectedTask.id);

    if (!error) {
      setTasks(tasks.map(t => t.id === selectedTask.id ? { ...t, ...editFormData } : t));
      setIsEditMode(false);
      setSelectedTask({ ...selectedTask, ...editFormData });
    }
  };

  const deleteTask = async (id: string) => {
    if (confirm('Deseja realmente excluir esta tarefa?')) {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (!error) {
        setTasks(tasks.filter(t => t.id !== id));
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
    <div className="h-full flex flex-col overflow-hidden">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 flex gap-4 overflow-x-auto pb-2 h-full custom-scrollbar">
          {COLUMNS.map((column) => (
            <div key={column.id} className={`flex-shrink-0 w-80 lg:w-96 flex flex-col rounded-xl border h-full ${
              column.color === 'orange' ? 'bg-orange-50/30 border-orange-100' : 
              column.color === 'blue' ? 'bg-blue-50/30 border-blue-100' : 'bg-green-50/30 border-green-100'
            }`}>
              <div className="p-4 flex items-center justify-between">
                <div className={`flex items-center gap-2 font-bold text-sm ${
                  column.color === 'orange' ? 'text-orange-700' : 
                  column.color === 'blue' ? 'text-blue-700' : 'text-green-700'
                }`}>
                  {column.icon} {column.title}
                </div>
                <span className="bg-white/80 px-2 py-0.5 rounded-full text-[10px] font-bold text-gray-500 border border-black/5">
                  {tasks.filter(t => t.status === column.id).length}
                </span>
              </div>

              <div className="px-4 mb-3">
                <button 
                  onClick={() => { setNewTask({ ...newTask, status: column.id as 'todo' | 'in_progress' | 'done' }); setIsAddModalOpen(true); }}
                  className={`w-full py-2 rounded-lg text-white text-sm font-bold flex items-center justify-center gap-2 shadow-sm ${
                    column.color === 'orange' ? 'bg-orange-600 hover:bg-orange-700' : 
                    column.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
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
                    className={`flex-1 p-3 overflow-y-auto custom-scrollbar ${snapshot.isDraggingOver ? 'bg-black/5 rounded-b-xl' : ''}`}
                  >
                    {tasks.filter(t => t.status === column.id).map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snap) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => openDetails(task)}
                            className={`bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-3 hover:border-blue-300 transition-all cursor-pointer ${
                              snap.isDragging ? 'shadow-xl rotate-2 border-blue-400 z-50' : ''
                            }`}
                          >
                            <h4 className="font-bold text-gray-800 text-sm mb-1 leading-tight">{task.title}</h4>
                            <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">{task.description}</p>
                            <div className="flex items-center justify-between">
                              <span className="bg-blue-50 text-blue-700 text-[9px] px-2 py-0.5 rounded font-bold uppercase">{task.priority}</span>
                              <div className="flex items-center gap-1 text-[9px] text-gray-400">
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
      </DragDropContext>

      {/* Modal Adicionar */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scaleIn">
            <div className="bg-[#112240] p-6 text-white flex items-center justify-between">
              <h2 className="text-xl font-bold">Nova Tarefa</h2>
              <button onClick={() => setIsAddModalOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAddTask} className="p-6 space-y-4">
              <input required placeholder="Título" className="w-full border border-gray-200 rounded-lg px-4 py-2 outline-none text-sm" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} />
              <textarea rows={3} placeholder="Descrição" className="w-full border border-gray-200 rounded-lg px-4 py-2 outline-none resize-none text-sm" value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} />
              <select className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm" value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})}>
                <option value="BAIXA">Baixa</option>
                <option value="MEDIA">Média</option>
                <option value="ALTA">Alta</option>
              </select>
              <button type="submit" className="w-full bg-[#112240] text-white py-3 rounded-xl font-bold">Criar Tarefa</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalhes / Edição */}
      {isDetailsModalOpen && selectedTask && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scaleIn">
            <div className="bg-[#112240] p-6 text-white flex items-center justify-between">
              <h2 className="text-xl font-bold">{isEditMode ? 'Editar Tarefa' : 'Detalhes da Tarefa'}</h2>
              <div className="flex items-center gap-2">
                {!isEditMode && <button onClick={() => setIsEditMode(true)} className="p-2 hover:bg-white/10 rounded-lg"><Pencil className="h-5 w-5" /></button>}
                <button onClick={() => deleteTask(selectedTask.id)} className="p-2 hover:bg-white/10 rounded-lg text-red-400"><Trash2 className="h-5 w-5" /></button>
                <button onClick={() => setIsDetailsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-lg"><X className="h-5 w-5" /></button>
              </div>
            </div>
            
            <div className="p-8">
              {isEditMode ? (
                <form onSubmit={handleUpdateTask} className="space-y-4">
                  <input className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm" value={editFormData.title} onChange={e => setEditFormData({...editFormData, title: e.target.value})} />
                  <textarea rows={4} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm resize-none" value={editFormData.description} onChange={e => setEditFormData({...editFormData, description: e.target.value})} />
                  <select className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm" value={editFormData.priority} onChange={e => setEditFormData({...editFormData, priority: e.target.value})}>
                    <option value="BAIXA">Baixa</option>
                    <option value="MEDIA">Média</option>
                    <option value="ALTA">Alta</option>
                  </select>
                  <button type="submit" className="w-full bg-green-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"><Save className="h-4 w-4" /> Salvar Alterações</button>
                </form>
              ) : (
                <div className="space-y-6">
                  <div><label className="text-[10px] font-bold text-gray-400 uppercase block">Título</label><h3 className="text-lg font-bold text-gray-800">{selectedTask.title}</h3></div>
                  <div><label className="text-[10px] font-bold text-gray-400 uppercase block">Descrição</label><p className="text-gray-600 leading-relaxed text-sm">{selectedTask.description || 'Sem descrição.'}</p></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-[10px] font-bold text-gray-400 uppercase block">Prioridade</label><span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-bold uppercase">{selectedTask.priority}</span></div>
                    <div><label className="text-[10px] font-bold text-gray-400 uppercase block">Status</label><span className="text-sm font-bold text-gray-700 capitalize">{COLUMNS.find(c => c.id === selectedTask.status)?.title}</span></div>
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
