import { useState, useCallback } from 'react'
import { useScheduler } from '../../context/SchedulerContext'
import { api } from '../../../../services/api'

export function SearchBar() {
  const { state, dispatch } = useScheduler()
  const [matricula, setMatricula] = useState('')

  const handleLoadAvailable = useCallback(async () => {
    if (state.studentInfo) {
      setMatricula('')
      dispatch({ type: 'RESET_FOR_NEW_STUDENT' })
      return
    }

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
  }, [matricula, dispatch, state.studentInfo])

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider ml-1">Consultar Materias Disponibles</label>
      <div className="flex gap-1.5">
        <input
          type="text"
          placeholder="Ingresar matricula"
          value={matricula}
          onChange={e => setMatricula(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLoadAvailable()}
          className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-xl px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500  transition-all disabled:bg-zinc-800/80 disabled:text-zinc-500 disabled:cursor-not-allowed placeholder:text-xs"
          disabled={state.studentInfo !== null}
        />
        <button
          onClick={handleLoadAvailable}
          disabled={state.loadingAvailable}
          className="py-3 bg-blue-600 text-white text-xs font-bold uppercase tracking-[6%] rounded-xl disabled:opacity-30 cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2 aspect-square h-full"
        >
          {state.loadingAvailable ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : state.studentInfo ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21H8a2 2 0 0 1-1.42-.587l-3.994-3.999a2 2 0 0 1 0-2.828l10-10a2 2 0 0 1 2.829 0l5.999 6a2 2 0 0 1 0 2.828L12.834 21" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m5.082 11.09 8.828 8.828" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="m21 21-4.35-4.35m1.35-5.15a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
