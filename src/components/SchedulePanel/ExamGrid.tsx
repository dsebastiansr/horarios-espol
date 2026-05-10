import { useMemo } from 'react'
import { useSelectedParallels } from '../../context/SchedulerContext'
import { GRID_START, GRID_END, SLOT_SECONDS, secondsToTime, SUBJECT_COLORS } from '../../utils/conflicts'
import { LinearScheduleGrid } from './LinearScheduleGrid'

export function ExamGrid() {
  const selected = useSelectedParallels()
  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }
  const examRange = useMemo(() => {
    const allExams = selected.flatMap((parallel) =>
      parallel.exams.filter((exam) => exam.horainicio !== undefined && exam.horafin !== undefined)
    )

    if (allExams.length === 0) {
      return { dynamicStart: GRID_START, dynamicEnd: GRID_END }
    }

    const minStart = Math.min(...allExams.map((exam) => exam.horainicio as number))
    const maxEnd = Math.max(...allExams.map((exam) => exam.horafin as number))
    const dynamicStart = Math.floor(minStart / SLOT_SECONDS) * SLOT_SECONDS
    const dynamicEnd = Math.ceil(maxEnd / SLOT_SECONDS) * SLOT_SECONDS

    return { dynamicStart, dynamicEnd }
  }, [selected])

  const exams = useMemo(() => {
    return selected.flatMap(p =>
      p.exams.map(e => ({ ...e, parallel: p }))
    ).filter(e => e.fecha && e.horainicio !== undefined && e.horafin !== undefined)
      .map(e => {
        const dateObj = new Date(e.fecha as string)
        const dayOfWeek = (dateObj.getDay() + 6) % 7
        const startSlot = Math.max(0, Math.floor(((e.horainicio as number) - examRange.dynamicStart) / SLOT_SECONDS))
        const endSlot = Math.min(
          Math.ceil((examRange.dynamicEnd - examRange.dynamicStart) / SLOT_SECONDS),
          Math.ceil(((e.horafin as number) - examRange.dynamicStart) / SLOT_SECONDS)
        )
        return { ...e, dayOfWeek, startSlot, endSlot }
      })
  }, [examRange.dynamicEnd, examRange.dynamicStart, selected])

  const EXAM_DAYS = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB']
  const totalSlots = Math.ceil((examRange.dynamicEnd - examRange.dynamicStart) / SLOT_SECONDS)

  if (selected.length === 0 || exams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-800">
        <p className="text-zinc-500 font-medium">No hay exámenes registrados</p>
        <p className="text-zinc-600 text-[10px] mt-1 uppercase tracking-widest font-bold">Planificación Semestral</p>
      </div>
    )
  }

  const subjectColorMap = new Map<string, string>()
  selected.forEach((parallel) => {
    if (!subjectColorMap.has(parallel.subjectCode)) {
      const nextIndex = subjectColorMap.size % SUBJECT_COLORS.length
      subjectColorMap.set(parallel.subjectCode, SUBJECT_COLORS[nextIndex])
    }
  })

  const items = exams
    .filter((b) => b.dayOfWeek >= 0 && b.dayOfWeek <= 5)
    .map((b, i) => {
      const examDateBadges = b.parallel.exams
        .filter((exam) => Boolean(exam.fecha))
        .map((exam) => formatDate(exam.fecha as string))
      const uniqueDateBadges = Array.from(new Set(examDateBadges)).slice(0, 3)
      const locationBadges = [
        b.bloque ? { label: b.bloque as string, kind: 'block' as const } : null,
        b.aula ? { label: b.aula as string, kind: 'room' as const } : null,
      ].filter(Boolean)

      return {
        id: `${b.parallel.id}-exam-${i}`,
        day: b.dayOfWeek,
        startSlot: b.startSlot,
        endSlot: b.endSlot,
        color: subjectColorMap.get(b.parallel.subjectCode) ?? SUBJECT_COLORS[0],
        title: b.parallel.subjectName,
        badges: [
          ...uniqueDateBadges.map((date) => ({ label: date, kind: 'date' as const })),
          ...locationBadges,
        ],
      }
    })

  return (
    <LinearScheduleGrid
      days={EXAM_DAYS.map((day) => ({ key: day, label: day }))}
      totalSlots={totalSlots}
      slotSeconds={SLOT_SECONDS}
      gridStart={examRange.dynamicStart}
      items={items}
      minWidthClassName="min-w-[720px]"
      emptyTitle="No hay exámenes en el rango mostrado"
      emptySubtitle={`Rango visible ${secondsToTime(examRange.dynamicStart)} - ${secondsToTime(examRange.dynamicEnd)}`}
    />
  )
}
