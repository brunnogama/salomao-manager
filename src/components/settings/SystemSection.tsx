import React from 'react'
import { History as HistoryIcon, Trash2, Code } from 'lucide-react'

interface SystemSectionProps {
  changelog: any[];
  isAdmin: boolean;
  onSystemReset: () => void;
}

export function SystemSection({ changelog, isAdmin, onSystemReset }: SystemSectionProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <HistoryIcon className="h-5 w-5 text-gray-700" />
          <h3 className="font-bold text-gray-900 text-base">Changelog</h3>
        </div>
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
          {changelog.map(log => (
            <div key={log.version} className="border-l-2 border-gray-200 pl-4 py-1">
              <p className="text-[10px] font-black text-blue-600 uppercase">v{log.version} — {log.date}</p>
              <h4 className="font-bold text-sm text-gray-800">{log.title}</h4>
              <ul className="text-xs text-gray-500 mt-1 space-y-0.5">
                {log.changes.map((c: string, i: number) => <li key={i}>• {c}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border-2 border-red-200 p-6 flex flex-col justify-between">
        <div>
            <div className="flex items-center gap-3 mb-4">
                <Code className="h-5 w-5 text-red-600" />
                <h3 className="font-bold text-red-900 text-base">Configurações Críticas</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
                O reset de sistema apaga magistrados, clientes e tarefas. Esta ação é irreversível.
            </p>
        </div>
        <button 
          onClick={onSystemReset} 
          disabled={!isAdmin} 
          className="w-full bg-red-600 text-white p-4 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-red-700 disabled:opacity-50 transition-all shadow-md"
        >
          <Trash2 className="h-5 w-5" /> Resetar Sistema Completo
        </button>
      </div>
    </div>
  )
}