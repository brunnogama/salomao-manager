import { Settings as SettingsIcon, Shield, Bell, Database, Save, RefreshCcw } from 'lucide-react';

export function Settings() {
  return (
    <div className="h-full space-y-8 pb-10 max-w-5xl mx-auto animate-fadeIn">
      <div className="bg-white/70 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex items-center gap-6">
        <div className="p-4 bg-[#112240] rounded-[1.5rem] text-white shadow-xl shadow-blue-900/20">
          <SettingsIcon className="h-8 w-8" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-[#112240] tracking-tight">Configurações</h2>
          <p className="text-sm text-gray-500">Ajuste as preferências globais do sistema e segurança.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white/80 backdrop-blur-lg p-8 rounded-[2.5rem] border border-white/60 shadow-[0_10px_40px_rgba(0,0,0,0.03)] space-y-6">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-blue-600" />
            <h3 className="font-bold text-[#112240]">Segurança & Acesso</h3>
          </div>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Senha Atual</label>
              <input type="password" placeholder="••••••••" className="bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/10 transition-all" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nova Senha</label>
              <input type="password" placeholder="Mínimo 8 caracteres" className="bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/10 transition-all" />
            </div>
            <button className="w-full flex items-center justify-center gap-2 bg-[#112240] text-white py-3.5 rounded-xl font-bold text-xs shadow-lg shadow-blue-900/20 hover:bg-black transition-all">
              <Save className="h-4 w-4" /> ATUALIZAR SENHA
            </button>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-lg p-8 rounded-[2.5rem] border border-white/60 shadow-[0_10px_40px_rgba(0,0,0,0.03)] space-y-6">
          <div className="flex items-center gap-3">
            <Database className="h-5 w-5 text-blue-600" />
            <h3 className="font-bold text-[#112240]">Dados & Sistema</h3>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50/40 rounded-2xl border border-blue-100/50 flex items-center justify-between">
              <div className="flex items-center gap-3 text-blue-800">
                <Bell className="h-5 w-5" />
                <span className="text-xs font-bold">Notificações por Email</span>
              </div>
              <div className="w-10 h-5 bg-blue-600 rounded-full relative cursor-pointer"><div className="w-3.5 h-3.5 bg-white rounded-full absolute right-0.5 top-0.5" /></div>
            </div>
            <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3 text-gray-600">
                <RefreshCcw className="h-5 w-5" />
                <span className="text-xs font-bold">Backup Semanal</span>
              </div>
              <div className="w-10 h-5 bg-gray-200 rounded-full relative cursor-pointer"><div className="w-3.5 h-3.5 bg-white rounded-full absolute left-0.5 top-0.5" /></div>
            </div>
            <div className="pt-2">
              <p className="text-[10px] text-gray-400 leading-relaxed font-medium">Última sincronização com Supabase:</p>
              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-tight">05/01/2026 às 01:54</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
