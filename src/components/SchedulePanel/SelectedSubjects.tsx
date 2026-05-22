import { useMemo } from 'react'
import { useScheduler, useSelectedParallels } from '../../context/SchedulerContext'

export function SelectedSubjects() {
  const selected = useSelectedParallels()
  const { dispatch } = useScheduler()

  // Group by subject code to keep summary compact
  const grouped = useMemo(() => {
    const map = new Map<string, typeof selected>()
    selected.forEach(p => {
      if (!map.has(p.subjectCode)) map.set(p.subjectCode, [])
      map.get(p.subjectCode)!.push(p)
    })
    return Array.from(map.values())
  }, [selected])

  if (selected.length === 0) return null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Resumen de Carga</h3>
        <button
          onClick={() => dispatch({ type: 'CLEAR_ALL' })}
          className="text-[10px] font-bold text-red-400 hover:text-red-600 transition-colors uppercase tracking-widest cursor-pointer"
        >
          Limpiar Todo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {grouped.map((parallels) => {
          const first = parallels[0]
          return (
            <div
              key={first.subjectCode}
              className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden group transition-all border-l-4"
              style={{ borderLeftColor: first.color }}
            >
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest leading-none mb-1">{first.subjectCode}</span>
                <span className="text-sm font-extrabold text-white leading-tight">{first.subjectName}</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {parallels.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 px-2 py-1 rounded-lg">
                    <span 
                      className="w-1.5 h-1.5 rounded-full" 
                      style={{ backgroundColor: p.color }}
                    />
                    <span className="text-[10px] font-bold text-zinc-300">P{p.paralelo}</span>
                    <span className="text-[9px] font-black text-zinc-500 uppercase">{p.tipoparalelo === 'PRACTICO' ? 'P' : 'T'}</span>
                    <button
                      onClick={() => dispatch({ type: 'REMOVE_PARALLEL', payload: p.id })}
                      className="ml-1 text-zinc-600 hover:text-red-500 transition-colors cursor-pointer text-sm leading-none"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
