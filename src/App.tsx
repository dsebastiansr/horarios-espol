import { SchedulerProvider, useScheduler } from './features/schedule/context/SchedulerContext'
import { SearchPanel } from './features/schedule/components/SearchPanel/SearchPanel'
import { SchedulePanel } from './features/schedule/components/SchedulePanel/SchedulePanel'

function AppContent() {
  useScheduler()

  return (
    <div className="h-svh bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      <main className="flex flex-1 overflow-hidden p-4 gap-4">
        <aside className="w-85 xl:w-110 shrink-0 bg-zinc-900 rounded-xl p-4 border border-zinc-800 overflow-hidden flex flex-col">
          <SearchPanel />
        </aside>

        <section className="flex-1 bg-zinc-900 rounded-xl p-0 border border-zinc-800 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-0 scrollbar-hide">
            <SchedulePanel />
          </div>
        </section>
      </main>
    </div>
  )
}

function App() {
  return (
    <SchedulerProvider>
      <AppContent />
    </SchedulerProvider>
  )
}

export default App
