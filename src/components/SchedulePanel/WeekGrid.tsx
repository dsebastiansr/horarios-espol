import { useMemo } from 'react'
import { useSelectedParallels } from '../../context/SchedulerContext'
import { DAYS, DAY_MAP, GRID_START, GRID_END, SLOT_SECONDS, secondsToTime } from '../../utils/conflicts'
import type { SelectedParallel } from '../../types'

interface GridBlock {
  parallel: SelectedParallel
  day: number
  startSlot: number
  endSlot: number
  aula: string
  bloque: string
}

export function WeekGrid() {
  const selected = useSelectedParallels()
  const DAY_EN = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

  const totalSlots = Math.ceil((GRID_END - GRID_START) / SLOT_SECONDS)
  const hours: number[] = []
  for (let s = GRID_START; s <= GRID_END; s += SLOT_SECONDS) hours.push(s)

  const blocks = useMemo<GridBlock[]>(() => {
    const result: GridBlock[] = []
    for (const p of selected) {
      for (const slot of p.schedule) {
        const dayIndex = DAY_MAP[slot.nombredia.toUpperCase()]
        if (dayIndex === undefined) continue
        const startSlot = Math.max(0, Math.floor((slot.horainicio - GRID_START) / SLOT_SECONDS))
        const endSlot = Math.min(totalSlots, Math.ceil((slot.horafin - GRID_START) / SLOT_SECONDS))
        result.push({
          parallel: p,
          day: dayIndex,
          startSlot,
          endSlot,
          aula: slot.aula,
          bloque: slot.bloque
        })
      }
    }
    return result
  }, [selected, totalSlots])

  if (selected.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-800">
        <div className="w-12 h-12 bg-zinc-700 rounded-full flex items-center justify-center mb-3">
          <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        </div>
        <p className="text-zinc-500 font-medium">Tu horario está vacío</p>
        <p className="text-zinc-400 text-xs mt-1">Busca y agrega materias para comenzar</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
      <div
        className="grid text-xs min-w-[800px]"
        style={{ gridTemplateColumns: `60px repeat(${DAYS.length}, 1fr)` }}
      >
        {/* Header */}
        <div className="border-b-0" />
        {DAYS.map((day, i) => (
          <div key={day} className="flex flex-col items-center py-4 bg-zinc-800/50 rounded-t-2xl mx-1 mb-2">
            <span className="text-zinc-100 font-bold text-sm tracking-tight">{day.charAt(0) + day.slice(1).toLowerCase()}</span>
            <span className="text-blue-500 font-bold text-[9px] tracking-widest mt-0.5 opacity-80 uppercase">{DAY_EN[i]}</span>
          </div>
        ))}

        {/* Time rows */}
        {hours.map((hourSec) => {
          const slotIndex = Math.floor((hourSec - GRID_START) / SLOT_SECONDS)
          const rowStart = slotIndex + 2
          const isHalfHour = hourSec % 3600 !== 0

          return (
            <div key={hourSec} className="contents">
              {/* Hour label */}
              <div
                className={`text-right pr-4 pt-1 border-zinc-800 font-medium ${isHalfHour ? 'text-zinc-700 text-[9px]' : 'text-zinc-500 text-[10px]'}`}
                style={{ gridRow: `${rowStart} / span 1`, gridColumn: 1 }}
              >
                {!isHalfHour && secondsToTime(hourSec)}
              </div>

              {/* Day cells borders */}
              {DAYS.map((_, dIdx) => (
                <div
                  key={dIdx}
                  className={`border-l border-zinc-800/30 border-t ${isHalfHour ? 'border-zinc-800/20' : 'border-zinc-800/50'}`}
                  style={{ gridRow: `${rowStart} / span 1`, gridColumn: dIdx + 2 }}
                />
              ))}
            </div>
          )
        })}

        {/* Overlaid blocks */}
        {blocks.map((b, i) => {
          const rowStart = b.startSlot + 2
          const rowSpan = b.endSlot - b.startSlot
          if (rowSpan <= 0) return null

          const color = b.parallel.color
          const isPractico = b.parallel.tipoparalelo === 'PRACTICO'

          return (
            <div
              key={i}
              className="rounded-xl text-zinc-100 border-l-4 z-10 flex flex-col p-3 transition-opacity duration-200"
              style={{
                gridColumn: b.day + 2,
                gridRow: `${rowStart} / span ${rowSpan}`,
                backgroundColor: `${color}25`, // Slightly higher opacity for dark mode readability
                borderColor: color,
                margin: '3px 6px',
              }}
            >
              {/* Top Row: Name + Badge */}
              <div className="flex justify-between items-start gap-2 mb-1">
                <span className="font-bold text-white leading-tight line-clamp-2 flex-1 text-[11px]">
                  {b.parallel.subjectName}
                </span>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-[3%] shrink-0"
                  style={{ backgroundColor: `${color}30`, color: color }}
                >
                  {isPractico ? 'PRÁCTICO' : 'TEÓRICO'}
                </span>
              </div>

              {/* Parallel Info */}
              <div className="text-[10px] text-zinc-400 font-medium mb-auto">
                Paralelo {b.parallel.paralelo}
              </div>

              {/* Location Footer */}
              {(b.aula || b.bloque) && (
                <div
                  className="flex items-center mt-2 pt-2 border-t border-white/5 text-[12px] font-medium"
                  style={{ color: color }}
                >
                  <svg className="w-2.5 h-2.5 mr-1 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" />
                  </svg>
                  <span className="truncate opacity-90 leading-none">
                    {b.bloque}{b.aula ? ` • ${b.aula}` : ''}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
