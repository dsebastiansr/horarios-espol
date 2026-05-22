import { WeekGrid } from './WeekGrid'
import { ExamGrid } from './ExamGrid'
import { SelectedSubjects } from './SelectedSubjects'

export function SchedulePanel() {
  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto">
      <SelectedSubjects />

      <section>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">
          Horario semanal
        </h2>
        <WeekGrid />
      </section>

      <section>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">
          Exámenes
        </h2>
        <ExamGrid />
      </section>
    </div>
  )
}
