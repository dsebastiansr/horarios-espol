import { useMemo } from 'react'
import { useSelectedParallels } from '../../context/SchedulerContext'
import { DAYS, DAY_MAP, SLOT_SECONDS, secondsToTime, SUBJECT_COLORS } from '../../../../domain/scheduler/conflicts'
import type { SelectedParallel } from '../../../../domain/scheduler/types'
import { LinearScheduleGrid } from './LinearScheduleGrid'
import { buildSubjectColorMap, computeDynamicRange } from '../../utils/gridHelpers'

type GridBadge = { label: string; kind: 'block' | 'room' }

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
  const scheduleRange = useMemo(() => {
    const allSlots = selected.flatMap((parallel) => parallel.schedule.map((slot) => ({
      horainicio: slot.horainicio,
      horafin: slot.horafin,
    })))
    return computeDynamicRange(allSlots)
  }, [selected])

  const totalSlots = Math.ceil((scheduleRange.dynamicEnd - scheduleRange.dynamicStart) / SLOT_SECONDS)

  const blocks = useMemo<GridBlock[]>(() => {
    const result: GridBlock[] = []
    for (const p of selected) {
      for (const slot of p.schedule) {
        const dayIndex = DAY_MAP[slot.nombredia.toUpperCase()]
        if (dayIndex === undefined) continue
        const startSlot = Math.max(0, Math.floor((slot.horainicio - scheduleRange.dynamicStart) / SLOT_SECONDS))
        const endSlot = Math.min(totalSlots, Math.ceil((slot.horafin - scheduleRange.dynamicStart) / SLOT_SECONDS))
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
  }, [scheduleRange.dynamicStart, selected, totalSlots])

  if (selected.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-zinc-900 rounded-2xl border border-dashed border-zinc-800">
        <div className="w-12 h-12 bg-zinc-700 rounded-full flex items-center justify-center mb-3">
          <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        </div>
        <p className="text-zinc-500 font-medium">Tu horario está vacío</p>
        <p className="text-zinc-400 text-xs mt-1">Busca y agrega materias para comenzar</p>
      </div>
    )
  }

  const subjectColorMap = buildSubjectColorMap(selected.map((parallel) => parallel.subjectCode))

  const items = blocks.map((b, i) => {
    const isPractico = b.parallel.tipoparalelo === 'PRACTICO'
    return {
      id: `${b.parallel.id}-${b.day}-${i}`,
      day: b.day,
      startSlot: b.startSlot,
      endSlot: b.endSlot,
      color: subjectColorMap.get(b.parallel.subjectCode) ?? SUBJECT_COLORS[0],
      title: b.parallel.subjectName,
      badges: [
        b.bloque ? { label: b.bloque, kind: 'block' as const } : null,
        b.aula ? { label: b.aula, kind: 'room' as const } : null,
      ].filter((badge): badge is GridBadge => badge !== null),
      rightTag: `P${b.parallel.paralelo}`,
      rightTagClassName: isPractico
        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    }
  })

  return (
    <LinearScheduleGrid
      days={DAYS.map((day) => ({ key: day, label: day.slice(0, 3) }))}
      totalSlots={totalSlots}
      slotSeconds={SLOT_SECONDS}
      gridStart={scheduleRange.dynamicStart}
      items={items}
      minWidthClassName="min-w-[780px]"
      emptyTitle="No hay clases en el horario"
      emptySubtitle={`Rango visible ${secondsToTime(scheduleRange.dynamicStart)} - ${secondsToTime(scheduleRange.dynamicEnd)}`}
    />
  )
}
