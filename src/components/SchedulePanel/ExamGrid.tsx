import { useMemo } from 'react'
import { useSelectedParallels } from '../../context/SchedulerContext'
import { GRID_START, GRID_END, SLOT_SECONDS } from '../../utils/conflicts'
import { LinearScheduleGrid } from './LinearScheduleGrid'

export function ExamGrid() {
  const selected = useSelectedParallels()

  const exams = useMemo(() => {
    return selected.flatMap(p =>
      p.exams.map(e => ({ ...e, parallel: p }))
    ).filter(e => e.fecha && e.horainicio !== undefined && e.horafin !== undefined)
      .map(e => {
        const dateObj = new Date(e.fecha as string)
        const dayOfWeek = (dateObj.getDay() + 6) % 7
        const startSlot = Math.max(0, Math.floor(((e.horainicio as number) - GRID_START) / SLOT_SECONDS))
        const endSlot = Math.min(
          Math.ceil((GRID_END - GRID_START) / SLOT_SECONDS),
          Math.ceil(((e.horafin as number) - GRID_START) / SLOT_SECONDS)
        )
        return { ...e, dayOfWeek, startSlot, endSlot }
      })
  }, [selected])

  const EXAM_DAYS = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB']
  const totalSlots = Math.ceil((GRID_END - GRID_START) / SLOT_SECONDS)

  if (selected.length === 0 || exams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-800">
        <p className="text-zinc-500 font-medium">No hay exámenes registrados</p>
        <p className="text-zinc-600 text-[10px] mt-1 uppercase tracking-widest font-bold">Planificación Semestral</p>
      </div>
    )
  }

  const items = exams
    .filter((b) => b.dayOfWeek >= 0 && b.dayOfWeek <= 5)
    .map((b, i) => {
      const fechaStr = (b.fecha as string).split('T')[0]
      return {
        id: `${b.parallel.id}-exam-${i}`,
        day: b.dayOfWeek,
        startSlot: b.startSlot,
        endSlot: b.endSlot,
        color: b.parallel.color,
        title: b.parallel.subjectName,
        subtitle: `Paralelo ${b.parallel.paralelo}`,
        detail: `${fechaStr}${b.aula ? ` • ${b.aula}` : ''}`,
        rightTag: 'Examen',
      }
    })

  return (
    <LinearScheduleGrid
      days={EXAM_DAYS.map((day) => ({ key: day, label: day }))}
      totalSlots={totalSlots}
      slotSeconds={SLOT_SECONDS}
      gridStart={GRID_START}
      items={items}
      minWidthClassName="min-w-[720px]"
      emptyTitle="No hay exámenes en el rango mostrado"
      emptySubtitle="Agrega materias con evaluaciones registradas"
    />
  )
}
