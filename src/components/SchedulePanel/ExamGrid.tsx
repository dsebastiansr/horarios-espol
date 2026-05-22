import { useMemo } from 'react'
import { useSelectedParallels } from '../../context/SchedulerContext'
import { GRID_START, GRID_END, SLOT_SECONDS, secondsToTime } from '../../utils/conflicts'

export function ExamGrid() {
  const selected = useSelectedParallels()

  // Extraemos todos los exámenes con fecha y horas válidas
  const exams = useMemo(() => {
    return selected.flatMap(p =>
      p.exams.map(e => ({ ...e, parallel: p }))
    ).filter(e => e.fecha && e.horainicio !== undefined && e.horafin !== undefined)
      // Agrupamos exámenes que ocurren en el mismo día de la semana para graficarlos
      .map(e => {
        const dateObj = new Date(e.fecha as string)
        // getDay() devuelve 0(Dom) a 6(Sab), pero Lunes es nuestro índice 0
        // Así que: getDay() == 1 es Lunes(0). getDay() == 6 es Sabado(5).
        const dayOfWeek = (dateObj.getDay() + 6) % 7
        const startSlot = Math.max(0, Math.floor(((e.horainicio as number) - GRID_START) / SLOT_SECONDS))
        const endSlot = Math.min(
          Math.ceil((GRID_END - GRID_START) / SLOT_SECONDS),
          Math.ceil(((e.horafin as number) - GRID_START) / SLOT_SECONDS)
        )
        return { ...e, dayOfWeek, startSlot, endSlot }
      })
  }, [selected])

  // Días a mostrar (solo Lunes a Sábado)
  const EXAM_DAYS = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB']

  const hours: number[] = []
  for (let s = GRID_START; s <= GRID_END; s += 3600) hours.push(s)

  if (selected.length === 0 || exams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-800">
        <p className="text-zinc-500 font-medium">No hay exámenes registrados</p>
        <p className="text-zinc-600 text-[10px] mt-1 uppercase tracking-widest font-bold">Planificación Semestral</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
      <div
        className="grid text-xs min-w-[600px]"
        style={{ gridTemplateColumns: `60px repeat(${EXAM_DAYS.length}, 1fr)` }}
      >
        {/* Header */}
        <div className="border-b-0" />
        {EXAM_DAYS.map((day) => (
          <div key={day} className="flex flex-col items-center py-3 bg-zinc-800/50 rounded-t-xl mx-0.5 mb-2">
            <span className="text-zinc-400 font-black text-[10px] tracking-widest uppercase">{day}</span>
          </div>
        ))}

        {/* Time rows */}
        {hours.map((hourSec) => {
          const slotIndex = Math.floor((hourSec - GRID_START) / SLOT_SECONDS)
          const rowStart = slotIndex + 2
          
          return (
            <div key={hourSec} className="contents">
              <div 
                className="text-right pr-4 pt-1 border-zinc-800 font-bold text-zinc-600 text-[9px]" 
                style={{ gridRow: `${rowStart} / span 2`, gridColumn: 1 }}
              >
                {secondsToTime(hourSec)}
              </div>
              
              {EXAM_DAYS.map((_, dIdx) => (
                <div
                  key={dIdx}
                  className="border-l border-zinc-800/30 border-t"
                  style={{ gridRow: `${rowStart} / span 2`, gridColumn: dIdx + 2 }}
                />
              ))}
            </div>
          )
        })}

        {/* Overlaid Exam Blocks */}
        {exams.map((b, i) => {
          if (b.dayOfWeek > 5 || b.dayOfWeek < 0) return null
          const rowStart = b.startSlot + 2
          const rowSpan = b.endSlot - b.startSlot
          if (rowSpan <= 0) return null

          const fechaStr = (b.fecha as string).split('T')[0]
          const color = b.parallel.color

          return (
            <div
              key={i}
              className="rounded-xl text-zinc-100 border-l-4 z-10 flex flex-col p-3 transition-opacity duration-200"
              style={{
                gridColumn: b.dayOfWeek + 2,
                gridRow: `${rowStart} / span ${rowSpan}`,
                backgroundColor: `${color}25`,
                borderColor: color,
                margin: '4px',
              }}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-extrabold text-white leading-tight text-[10px]">{b.parallel.subjectName}</span>
                <span className="bg-white/10 px-1.5 py-0.5 rounded text-[8px] font-black text-zinc-400 border border-white/5 uppercase">Exm</span>
              </div>
              <span className="text-[9px] font-bold text-zinc-500 mt-0.5 italic">P{b.parallel.paralelo}</span>
              
              <div className="mt-auto pt-2 border-t border-white/5 flex items-center justify-between text-[9px] font-black uppercase tracking-tighter" style={{ color: color }}>
                <span className="opacity-90">{fechaStr.split('-').slice(1).reverse().join('/')}</span>
                <span className="bg-zinc-800 px-1.5 rounded-full shadow-sm">{b.aula}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
