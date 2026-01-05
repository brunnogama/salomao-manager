import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Gift, User, Phone, MoreVertical, Plus } from 'lucide-react';

interface Client {
  id: string;
  nome: string;
  telefone: string;
  socio: string;
  tipo_brinde: string;
  status: string;
}

const COLUMNS = [
  { id: 'prospect', title: 'Prospects', color: 'bg-blue-500' },
  { id: 'contatado', title: 'Em Contato', color: 'bg-amber-500' },
  { id: 'entregue', title: 'Brinde Entregue', color: 'bg-emerald-500' },
  { id: 'cancelado', title: 'Arquivado', color: 'bg-slate-400' }
];

export function Kanban() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('clientes')
      .select('*');
    if (data) setClients(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const onDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;

    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }

    const updatedClients = Array.from(clients);
    const clientIndex = updatedClients.findIndex(c => c.id === draggableId);
    updatedClients[clientIndex].status = destination.droppableId;
    setClients(updatedClients);

    const { error } = await supabase
      .from('clientes')
      .update({ status: destination.droppableId })
      .eq('id', draggableId);

    if (error) {
      console.error('Erro ao atualizar status:', error);
      fetchClients();
    }
  };

  const getBrindeColor = (tipo: string) => {
    if (tipo === 'Brinde VIP') return '#a855f7'; 
    if (tipo === 'Brinde Médio') return '#22c55e'; 
    return '#94a3b8'; 
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center font-bold text-[#112240]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="h-full flex flex-col space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm text-gray-500 font-medium">Arraste e solte os cartões para atualizar o status em tempo real.</p>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
          <Plus className="h-4 w-4" /> NOVO CARD
        </button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-6 h-full overflow-x-auto pb-6 custom-scrollbar">
          {COLUMNS.map((column) => (
            <div key={column.id} className="flex-shrink-0 w-80 flex flex-col">
              {/* Cabeçalho da Coluna com Glassmorphism */}
              <div className="bg-white/60 backdrop-blur-md p-4 rounded-t-[1.5rem] border-x border-t border-white/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${column.color} shadow-[0_0_8px_currentcolor]`} />
                  <h3 className="font-black text-[#112240] text-sm uppercase tracking-wider">{column.title}</h3>
                </div>
                <span className="bg-white/80 px-2 py-0.5 rounded-lg text-[10px] font-black text-gray-400 border border-gray-100">
                  {clients.filter(c => (c.status || 'prospect') === column.id).length}
                </span>
              </div>

              {/* Área de Drop com fundo suave */}
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`flex-1 p-3 space-y-3 bg-white/30 backdrop-blur-sm border-x border-b border-white/40 rounded-b-[1.5rem] transition-colors ${
                      snapshot.isDraggingOver ? 'bg-blue-50/40' : ''
                    } overflow-y-auto custom-scrollbar min-h-[200px]`}
                  >
                    {clients
                      .filter(c => (c.status || 'prospect') === column.id)
                      .map((client, index) => (
                        <Draggable key={client.id} draggableId={client.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white p-4 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.03)] border border-white group transition-all hover:shadow-xl hover:border-blue-100 ${
                                snapshot.isDragging ? 'shadow-2xl rotate-2 scale-105 border-blue-200 ring-4 ring-blue-500/10' : ''
                              }`}
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div 
                                  className="text-[10px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-tight"
                                  style={{ 
                                    backgroundColor: `${getBrindeColor(client.tipo_brinde)}10`, 
                                    color: getBrindeColor(client.tipo_brinde),
                                    borderColor: `${getBrindeColor(client.tipo_brinde)}20`
                                  }}
                                >
                                  {client.tipo_brinde}
                                </div>
                                <button className="text-gray-300 hover:text-gray-600 transition-colors">
                                  <MoreVertical className="h-4 w-4" />
                                </button>
                              </div>

                              <h4 className="font-bold text-[#112240] text-sm mb-3 group-hover:text-blue-700 transition-colors">
                                {client.nome}
                              </h4>

                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-gray-400">
                                  <User className="h-3 w-3" />
                                  <span className="text-[10px] font-bold uppercase">{client.socio || 'Sem Sócio'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-400">
                                  <Phone className="h-3 w-3" />
                                  <span className="text-[10px] font-medium">{client.telefone || 'Sem Telefone'}</span>
                                </div>
                              </div>
                              
                              <div className="mt-4 pt-4 border-t border-gray-50 flex justify-end">
                                <div className="p-1.5 bg-gray-50 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                  <Gift className="h-3.5 w-3.5" />
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
    </div>
  );
}
