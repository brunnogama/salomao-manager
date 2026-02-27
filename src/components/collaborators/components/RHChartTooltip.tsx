interface TooltipProps {
    active?: boolean
    payload?: any[]
    label?: string
}

export const RHChartTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 border border-gray-200 shadow-xl rounded-xl min-w-[140px] z-[9999]">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{label}</p>
                {payload.map((entry: any, index: number) => {
                    let valueText = entry.value
                    if (typeof entry.value === 'number') {
                        valueText = Number.isInteger(entry.value) ? entry.value : entry.value.toFixed(1)
                    }

                    const isTaxa = entry.dataKey && String(entry.dataKey).toLowerCase().includes('taxa')
                    const isYear = typeof entry.value === 'number' && !isTaxa && !Number.isInteger(entry.value) && entry.name !== 'Taxa de Turnover' && !entry.name?.includes('Taxa')

                    let suffix = ''
                    if (isTaxa) suffix = '%'
                    else if (isYear && entry.unit === 'a') suffix = ' anos' // from RHTempoCasa
                    else if (isYear && !entry.unit) suffix = ' anos'

                    return (
                        <div key={index} className="flex flex-col mb-1 last:mb-0">
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-[10px] font-bold uppercase" style={{ color: entry.color }}>
                                    {entry.name}
                                </span>
                                <span className="text-xs font-black text-gray-700">
                                    {valueText}{suffix}
                                </span>
                            </div>
                            {entry.payload && entry.payload.avgAge !== undefined && (
                                <div className="text-right mt-0.5">
                                    <span className="text-[9px] font-bold text-gray-400">
                                        MÉDIA: {entry.payload.avgAge} ANOS
                                    </span>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        )
    }
    return null
}
