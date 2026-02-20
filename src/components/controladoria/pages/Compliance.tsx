import React from 'react';
import { ShieldCheck } from 'lucide-react';

export function Compliance() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#112240] p-3 shadow-lg">
            <ShieldCheck className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-[30px] font-black text-[#0a192f] tracking-tight leading-none">Compliance</h1>
            <p className="text-sm font-semibold text-gray-500 mt-0.5">Gestão de Compliance e Conformidade</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden flex-1">
        <div className="absolute right-0 top-0 h-full w-1 bg-[#1e3a8a]"></div>
        <div className="h-full flex items-center justify-center text-gray-500">
          <p>Módulo de Compliance em construção.</p>
        </div>
      </div>
    </div>
  );
}
