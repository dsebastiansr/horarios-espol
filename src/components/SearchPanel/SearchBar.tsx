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

      // 2. Fetch Parallels for ALL subjects
      const allParallelsResults = await Promise.all(
        subjects.map(s => api.searchSubject(s.cod_materia_acad.trim().toUpperCase(), 1))
      )
      const allParallels = allParallelsResults.flat().map(p => ({
        ...p,
        codigomateria: p.codigomateria.trim().toUpperCase()
      }))
      dispatch({ type: 'SET_SEARCH_RESULTS', payload: allParallels })

      // UNLOCK UI: Set loading to false here so the user can see subjects and parallels
      dispatch({ type: 'SET_LOADING_AVAILABLE', payload: false })

      // 3. Fetch details (Info, Schedule, Exams) in BACKGROUND
      // Using a separate async IIFE or just not awaiting the Promise.all for the whole block
      const fetchDetails = async () => {
        // Group parallels by subject to allow early exit
        const grouped = allParallels.reduce((acc, p) => {
          const code = p.codigomateria
          if (!acc[code]) acc[code] = []
          acc[code].push(p)
          return acc
        }, {} as Record<string, typeof allParallels>)

        const subjectCodes = Object.keys(grouped)
        const batchSize = 3 // Number of subjects to process in parallel

        for (let i = 0; i < subjectCodes.length; i += batchSize) {
          const batch = subjectCodes.slice(i, i + batchSize)
          await Promise.all(
            batch.map(async (code) => {
              const parallels = grouped[code].sort((a, b) => {
                const baseA = a.paralelo % 100
                const baseB = b.paralelo % 100
                if (baseA !== baseB) return baseA - baseB
                return a.paralelo - b.paralelo
              })
              for (const p of parallels) {
                const key = `${p.codigomateria}-${p.paralelo}-${p.tipocurso}`
                try {
                  const [infoRes, scheduleRes, examsRes] = await Promise.allSettled([
                    api.getCourseInfo(p.codigomateria, p.paralelo),
                    api.getSubjectSchedule(p.codigomateria, p.paralelo),
                    p.tipoparalelo === 'TEORICO' 
                      ? api.getExamSchedule(p.codigomateria, p.paralelo) 
                      : Promise.resolve([])
                  ])

                  // Detect if this parallel is inactive (404)
                  // Note: infoRes and scheduleRes are required, examsRes might be skipped
                  const isInactive = [infoRes, scheduleRes].some(
                    res => res.status === 'rejected' && (res.reason as Error)?.message?.includes('404')
                  )

                  if (isInactive) {
                    console.log(`Stopping fetch for ${code} at parallel ${p.paralelo} due to 404`)
                    dispatch({ type: 'SET_STOPPED_SUBJECT', payload: { code, paralelo: p.paralelo } })
                    break // Stop fetching more parallels for this subject
                  }

                  const info = infoRes.status === 'fulfilled' ? infoRes.value[0] || null : null
                  const schedule = scheduleRes.status === 'fulfilled' ? scheduleRes.value : []
                  const exams = examsRes.status === 'fulfilled' ? examsRes.value : []

                  dispatch({
                    type: 'SET_PARALLEL_DETAIL',
                    payload: {
                      key,
                      detail: {
                        subjectCode: p.codigomateria,
                        subjectName: p.nombre,
                        paralelo: p.paralelo,
                        tipocurso: p.tipocurso as 'P' | 'G',
                        tipoparalelo: p.tipoparalelo,
                        info,
                        schedule,
                        exams,
                        loading: false,
                        error: null
                      }
                    }
                  })
                } catch (err) {
                  console.error(`Error fetching details for ${key}`, err)
                }
              }
            })
          )
        }
      }

      fetchDetails() // Don't await this, let it run in background

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
