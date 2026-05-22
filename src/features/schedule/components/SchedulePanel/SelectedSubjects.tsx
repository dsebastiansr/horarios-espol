import { useMemo } from 'react';
import {
  useScheduler,
  useSelectedParallels,
} from '../../context/SchedulerContext';
import { cn } from '../../../../shared/utils/cn';
import { Card } from '../../../../shared/components/ui/Card';
import { Pill } from '../../../../shared/components/ui/Pill';

export function SelectedSubjects() {
  const selected = useSelectedParallels();
  const { dispatch } = useScheduler();
  const removeSubject = (parallelIds: string[]) => {
    parallelIds.forEach((id) =>
      dispatch({ type: 'REMOVE_PARALLEL', payload: id }),
    );
  };

  // Group by subject code to keep summary compact
  const grouped = useMemo(() => {
    const map = new Map<string, typeof selected>();
    selected.forEach((p) => {
      if (!map.has(p.subjectCode)) map.set(p.subjectCode, []);
      map.get(p.subjectCode)!.push(p);
    });
    return Array.from(map.values());
  }, [selected]);

  if (selected.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-4">
      {grouped.map((parallels) => {
        const first = parallels[0];
        return (
          <Card
            key={first.subjectCode}
            className="flex-1 gap-1.5 p-4 flex flex-col justify-between overflow-hidden group transition-all bg-zinc-900/50"
          >
            <div className="flex gap-2.5">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest leading-none mb-1">
                  {first.subjectCode}
                </span>
                <span className="text-sm font-extrabold text-white leading-tight">
                  {first.subjectName}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap justify-between items-end gap-2">
              <div className="flex gap-2">
                {parallels.map((p) => (
                  <Pill
                    key={p.id}
                    className={cn(
                      'flex text-[11px] font-bold items-center gap-2 h-fit px-2.5 py-1',
                      p.tipoparalelo === 'TEORICO'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    )}
                  >
                    <span>{p.paralelo}</span>
                  </Pill>
                ))}
              </div>
              <button
                onClick={() => removeSubject(parallels.map((item) => item.id))}
                className="bg-red-500 rounded-full px-1 py-1 hover:text-white text-[12px] leading-none cursor-pointer"
                title={`Eliminar ${first.subjectName}`}
                aria-label={`Eliminar ${first.subjectName}`}
              >
                <svg
                  className="w-4 h-4 mx-auto"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M18 6L6 18M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
