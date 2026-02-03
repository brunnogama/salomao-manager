import { LucideIcon } from 'lucide-react'

export function StatCard({ title, value, icon: Icon, color }: any) {
  const themes: any = { 
    blue: 'text-blue-600 bg-blue-50 border-blue-100', 
    green: 'text-green-600 bg-green-50 border-green-100', 
    red: 'text-red-600 bg-red-50 border-red-100', 
    gray: 'text-gray-600 bg-gray-50 border-gray-100' 
  }
  return (
    <div className={`bg-white p-6 rounded-2xl shadow-sm border flex items-center justify-between transition-all hover:shadow-md ${themes[color].split(' ')[2]}`}>
      <div>
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">{title}</p>
        <p className="text-[30px] font-black mt-1 text-[#0a192f] tracking-tight">{value}</p>
      </div>
      <div className={`p-3 rounded-xl ${themes[color].split(' ')[0]} ${themes[color].split(' ')[1]}`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
  )
}

export function Avatar({ src, name, size = 'sm' }: any) {
  const sz = size === 'lg' ? 'w-20 h-20 text-xl' : 'w-10 h-10 text-sm'
  if (src) return <img src={src} className={`${sz} rounded-full object-cover border-2 border-white shadow-sm`} alt={name} />
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-[#1e3a8a] to-[#112240] flex items-center justify-center font-black text-white shadow-md`}>
      {name?.charAt(0).toUpperCase()}
    </div>
  )
}

export function DetailRow({ label, value, icon: Icon }: any) {
  return (
    <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 transition-all hover:bg-white hover:shadow-sm">
      <p className="text-[9px] font-black text-gray-400 uppercase flex items-center gap-1 mb-1 tracking-widest">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </p>
      <p className="text-sm font-bold text-[#0a192f]">{value || '-'}</p>
    </div>
  )
}
