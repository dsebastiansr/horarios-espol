import { useState, useCallback } from 'react'
import { useScheduler } from '../../context/SchedulerContext'
import { api } from '../../services/api'

export function SearchBar() {
  const { state, dispatch } = useScheduler()
  const [matricula, setMatricula] = useState('')

  const handleLoadAvailable = useCallback(async () => {
    const m = matricula.trim()
    if (!m) {
      dispatch({ type: 'SET_ERROR_SEARCH', payload: 'Ingresa una matrícula válida' })
      return
    }
    dispatch({ type: 'SET_LOADING_AVAILABLE', payload: true })
    dispatch({ type: 'SET_ERROR_SEARCH', payload: null })
    dispatch({ type: 'SET_SEARCH_MODE', payload: 'available' })
    try {
      // 1. Fetch Student Info and Available Subjects
      const [student, subjects] = await Promise.all([
        api.getStudentInfo(m),
        api.getAvailableSubjects(m)
      ])

      dispatch({ type: 'SET_STUDENT_INFO', payload: student })
      dispatch({ type: 'SET_AVAILABLE_SUBJECTS', payload: subjects.map(s => ({ ...s, cod_materia_acad: s.cod_materia_acad.trim().toUpperCase() })) })

      dispatch({ type: 'SET_SEARCH_RESULTS', payload: [] })
      dispatch({ type: 'SET_LOADING_AVAILABLE', payload: false })

    } catch (e) {
      dispatch({ type: 'SET_ERROR_SEARCH', payload: (e as Error).message })
      dispatch({ type: 'SET_LOADING_AVAILABLE', payload: false })
    } finally {
      // We already handled success/loading in the body to allow background fetching
    }
  }, [matricula, dispatch])

  return (
    <div className="flex flex-col gap-4 pb-4">
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Consultar Disponibles</label>
        <div className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Ingresa tu matrícula (E.g. 202414389)"
            value={matricula}
            onChange={e => setMatricula(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLoadAvailable()}
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-zinc-700 transition-all"
          />
          <button
            onClick={handleLoadAvailable}
            disabled={state.loadingAvailable}
            className="w-full py-3 bg-blue-600 text-white text-xs font-bold uppercase tracking-[6%] rounded-xl disabled:opacity-30 cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {state.loadingAvailable ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : 'Consultar Materias'}
          </button>
        </div>
      </div>
    </div>
  )
}
