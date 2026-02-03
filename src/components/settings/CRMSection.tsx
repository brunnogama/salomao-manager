import React from 'react'
import { Trash2 } from 'lucide-react'

interface CRMSectionProps {
  brindes: any[];
  socios: any[];
  onDeleteBrinde: (id: number, nome: string) => void;
  onDeleteSocio: (id: number, nome: string) => void;
}

export function CRMSection({ brindes, socios, onDeleteBrinde, onDeleteSocio }: CRMSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-bold mb-4 text-gray-900">Brindes</h3>
        <div className="space-y-2">
          {brindes.map(b => (
            <div key={b.id} className="flex justify-between items-center text-xs p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors group">
              <span className="font-medium text-gray-700">{b.nome}</span>
              <button onClick={() => onDeleteBrinde(b.id, b.nome)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="h-3.5 w-3.5"/>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-bold mb-4 text-gray-900">Sócios</h3>
        <div className="space-y-2">
          {socios.map(s => (
            <div key={s.id} className="flex justify-between items-center text-xs p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors group">
              <span className="font-medium text-gray-700">{s.nome}</span>
              <button onClick={() => onDeleteSocio(s.id, s.nome)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="h-3.5 w-3.5"/>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}