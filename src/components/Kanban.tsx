import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, Clock, CheckCircle2, Circle, X, Pencil, Trash2, Calendar } from 'lucide-react';
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
  
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'MEDIA', status: 'todo' });

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

  const deleteTask = async (id: string) => {
    if (confirm('Deseja realmente excluir esta tarefa?')) {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (!error) {
        setTasks(tasks.filter(t => t.id !== id));
        setIsDetailsModalOpen(false);
      }
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Título interno removido para evitar duplicidade com o Header do App.tsx */}

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 flex gap-4 overflow-x-auto pb-2 h-full">
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
                  className={`w-full py-2 rounded-lg text-white text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm ${
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
                    className={`flex-1 p-3 overflow-y-auto min-h-[150px] transition-colors ${snapshot.isDraggingOver ? 'bg-black/5 rounded-b-xl' : ''}`}
                  >
                    {tasks.filter(t => t.status === column.id).map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snap) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => { setSelectedTask(task); setIsDetailsModalOpen(true); }}
                            className={`bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-3 hover:border-blue-300 transition-all group cursor-pointer ${
                              snap.isDragging ? 'shadow-xl rotate-2 border-blue-400 z-50' : ''
                            }`}
                          >
                            <h4 className="font-bold text-gray-800 text-sm mb-1 leading-tight">{task.title}</h4>
                            <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">{task.description}</p>
                            <div className="flex items-center justify-between">
                              <span className="bg-blue-50 text-blue-700 text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">{task.priority}</span>
                              <div className="flex items-center gap-1 text-[9px] text-gray-400 font-medium">
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

      {/* Modais mantidos conforme versão anterior... */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scaleIn">
            <div className="bg-[#112240] p-6 text-white flex items-center justify-between">
              <h2 className="text-xl font-bold">Nova Tarefa</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAddTask} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Título</label>
                <input required type="text" className="w-full border border-gray-200 rounded-lg px-4 py-2 outline-none focus:border-blue-500 text-sm" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Descrição</label>
                <textarea rows={3} className="w-full border border-gray-200 rounded-lg px-4 py-2 outline-none focus:border-blue-500 resize-none text-sm" value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Prioridade</label>
                <select className="w-full border border-gray-200 rounded-lg px-4 py-2 outline-none text-sm" value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})}>
                  <option value="BAIXA">Baixa</option>
                  <option value="MEDIA">Média</option>
                  <option value="ALTA">Alta</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-[#112240] text-white py-3 rounded-xl font-bold hover:bg-[#1a3a6c] transition-colors shadow-lg mt-2">Criar Tarefa</button>
            </form>
          </div>
        </div>
      )}

      {isDetailsModalOpen && selectedTask && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scaleIn">
            <div className="bg-[#112240] p-6 text-white flex items-center justify-between">
              <h2 className="text-xl font-bold">Detalhes da Tarefa</h2>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors"><Pencil className="h-5 w-5" /></button>
                <button onClick={() => deleteTask(selectedTask.id)} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-red-400"><Trash2 className="h-5 w-5" /></button>
                <button onClick={() => setIsDetailsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><X className="h-5 w-5" /></button>
              </div>
            </div>
            <div className="p-8 text-sm">
              <div className="mb-6"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Título</label><h3 className="text-lg font-bold text-gray-800">{selectedTask.title}</h3></div>
              <div className="mb-8"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Descrição</label><p className="text-gray-600 leading-relaxed">{selectedTask.description || 'Sem descrição.'}</p></div>
              <div className="grid grid-cols-2 gap-6 pb-8 border-b border-gray-100">
                <div><label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Prioridade</label><span className="bg-blue-50 text-blue-700 px-3 py-1 rounded text-xs font-bold">{selectedTask.priority}</span></div>
                <div><label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Status</label><span className="text-sm font-bold text-gray-700 capitalize">{COLUMNS.find(c => c.id === selectedTask.status)?.title}</span></div>
              </div>
              <div className="mt-6 text-[10px] text-gray-400 font-medium uppercase tracking-widest">Criado em {new Date(selectedTask.created_at).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
