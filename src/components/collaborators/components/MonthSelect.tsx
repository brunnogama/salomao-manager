// src/components/collaborators/components/MonthSelect.tsx

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, X } from 'lucide-react'

interface MonthSelectProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function MonthSelect({ value, onChange, placeholder = 'Todos os meses', className = '' }: MonthSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Gerar lista de meses dos últimos 24 meses
  const generateMonthOptions = () => {
    const options: { value: string; label: string }[] = []
    const today = new Date()
    
    for (let i = 0; i < 24; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const value = `${year}-${String(month).padStart(2, '0')}`
      const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) })
    }
    
    return options
  }

  const months = generateMonthOptions()
  const selectedMonth = months.find(m => m.value === value)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl hover:border-[#1e3a8a] transition-all text-sm font-medium text-gray-700"
      >
        <span className={selectedMonth ? 'text-gray-800' : 'text-gray-400'}>
          {selectedMonth ? selectedMonth.label : placeholder}
        </span>
        <div className="flex items-center gap-1">
          {value && (
            <X
              className="h-3.5 w-3.5 text-gray-400 hover:text-red-600 transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                onChange('')
              }}
            />
          )}
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
          {months.map((month) => (
            <button
              key={month.value}
              type="button"
              onClick={() => {
                onChange(month.value)
                setIsOpen(false)
              }}
              className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                value === month.value
                  ? 'bg-[#1e3a8a] text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {month.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}