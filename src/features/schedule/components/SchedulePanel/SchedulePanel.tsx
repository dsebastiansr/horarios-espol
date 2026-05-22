import { WeekGrid } from './WeekGrid';
import { ExamGrid } from './ExamGrid';
import { SelectedSubjects } from './SelectedSubjects';

export function SchedulePanel() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col gap-3 p-5 border-b border-zinc-800 bg-zinc-800/20">
        <h2 className="text-3xl font-bold text-white tracking-tight">
          Materias
        </h2>
        <SelectedSubjects />
      </div>


      <div className="flex flex-col gap-4 p-4  overflow-y-auto">
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
    </div>
  );
}
