import { useMemo, useState } from 'react'
import { useScheduler } from '../../context/SchedulerContext'
import { ParallelCard } from './ParallelCard'
import type { SubjectResult } from '../../types'

export interface ParallelUnit {
  teorico: SubjectResult | null
  practicos: SubjectResult[]
}

interface SubjectGroup {
  code: string
  name: string
  units: ParallelUnit[] // Replaces flat parallels
}

type SubjectTypeTab = 'all' | 'general' | 'professional' | 'complementary'

function groupSubjectParallels(parallels: SubjectResult[]): ParallelUnit[] {
  const teoricos = parallels.filter(p => p.tipoparalelo === 'TEORICO')
  const practicos = parallels.filter(p => p.tipoparalelo === 'PRACTICO')

  const units: ParallelUnit[] = []
  const usedPracticos = new Set<string>()

  for (const t of teoricos) {
    // Sort all practicals so those matching the theoretical parallel come first
    const associatedPracticos = [...practicos].sort((a, b) => {
      const matchA = a.paralelo % 100 === t.paralelo
      const matchB = b.paralelo % 100 === t.paralelo
      if (matchA && !matchB) return -1
      if (!matchA && matchB) return 1
      return a.paralelo - b.paralelo
    })

    // Mark matched practicals as used so they don't appear as orphans
    practicos
      .filter(p => p.paralelo % 100 === t.paralelo)
      .forEach(p => usedPracticos.add(`${p.codigomateria}-${p.paralelo}`))

    units.push({
      teorico: t,
      practicos: associatedPracticos,
    })
  }

  // Sort units primarily by theoretical parallel number
  units.sort((a, b) => {
    const p1 = a.teorico?.paralelo ?? a.practicos[0]?.paralelo ?? 0
    const p2 = b.teorico?.paralelo ?? b.practicos[0]?.paralelo ?? 0
    return p1 - p2
  })

  return units
}

export function SubjectList() {
  const { state, dispatch } = useScheduler()
  const [filterText, setFilterText] = useState('')
  const [activeTab, setActiveTab] = useState<SubjectTypeTab>('all')

  const normalizedCreditType = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toUpperCase()

  const availableSubjectsForTab = useMemo(() => {
    if (activeTab === 'all') return state.availableSubjects

    const tabRules: Record<Exclude<SubjectTypeTab, 'all'>, string> = {
      general: 'EDUCACION GENERAL',
      professional: 'FORMACION PROFESIONAL',
      complementary: 'FORMACION COMPLEMENTARIA',
    }

    return state.availableSubjects.filter(
      (subject) => normalizedCreditType(subject.tipocredito) === tabRules[activeTab]
    )
  }, [activeTab, state.availableSubjects])

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const groups = useMemo<SubjectGroup[]>(() => {
    if (state.searchMode === 'available') {
      return availableSubjectsForTab.map(s => {
        const code = s.cod_materia_acad.trim().toUpperCase()
        const parallels = state.searchResults.filter(r => r.codigomateria.trim().toUpperCase() === code)

        return {
          code,
          name: s.nombre_materia,
          units: groupSubjectParallels(parallels)
        }
      })
    }

    const map = new Map<string, { code: string; name: string; parallels: SubjectResult[] }>()
    const query = state.searchQuery.trim().toUpperCase()

    // Filter results only if we have a query in search mode
    const filteredResults = state.searchMode === 'search' && query
      ? state.searchResults.filter(r =>
        r.codigomateria.trim().toUpperCase().includes(query) ||
        r.nombre.trim().toUpperCase().includes(query)
      )
      : state.searchResults

    for (const r of filteredResults) {
      const key = `${r.codigomateria}`
      if (!map.has(key)) {
        map.set(key, { code: r.codigomateria, name: r.nombre, parallels: [] })
      }
      const subjectGroup = map.get(key)!
      // Evitar duplicados exactos en los resultados
      const isDup = subjectGroup.parallels.some(p => p.paralelo === r.paralelo && p.tipoparalelo === r.tipoparalelo)
      if (!isDup) {
        subjectGroup.parallels.push(r)
      }
    }

    // Group theoreticals and practicals
    return Array.from(map.values()).map(group => {
      return {
        code: group.code,
        name: group.name,
        units: groupSubjectParallels(group.parallels),
      }
    })
  }, [state.searchResults, availableSubjectsForTab, state.searchMode])

  const filteredGroups = useMemo(() => {
    if (!filterText.trim()) return groups
    const lower = filterText.toLowerCase()
    return groups.filter(g =>
      g.code.toLowerCase().includes(lower) ||
      g.name.toLowerCase().includes(lower)
    )
  }, [groups, filterText])

  if (state.loadingSearch || state.loadingAvailable) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3">
        <div className="w-8 h-8 border-3 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Buscando...</p>
      </div>
    )
  }

  if (state.errorSearch) {
    return (
      <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-medium">
        <p>⚠ {state.errorSearch}</p>
      </div>
    )
  }

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-6">
        <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4 text-zinc-300">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <p className="text-zinc-400 font-bold text-sm">Sin resultados</p>
        <p className="text-zinc-300 text-xs mt-1">Ingresa una matrícula o busca por nombre</p>
      </div>
    )
  }

  const renderBreadcrumb = () => {
    if (state.searchMode !== 'search' || state.availableSubjects.length === 0) return null
    // Solo mostramos volver atrás si tenemos materias disponibles cargadas
    return (
      <div className="mb-4">
        <button
          onClick={() => {
            dispatch({ type: 'SET_SEARCH_MODE', payload: 'available' })
            dispatch({ type: 'SET_SEARCH_RESULTS', payload: [] })
            dispatch({ type: 'SET_SEARCH_QUERY', payload: '' })
          }}
          className="cursor-pointer text-[10px] font-bold bg-blue-600 hover:bg-blue-700 text-blue-50 px-3 py-1.5 rounded-lg uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95"
        >
          <span>←</span> Volver a mis materias
        </button>
      </div>
    )
  }

  // Vista 1: Mostrando lista de materias (available) o resultados múltiples de búsqueda
  if (state.searchMode === 'available' || (state.searchMode === 'search' && Boolean(state.searchQuery) && groups.length > 1)) {
    const tabs = [
      { key: 'all' as const, label: 'Todas' },
      { key: 'general' as const, label: 'Educación General' },
      { key: 'professional' as const, label: 'Formación Profesional' },
      { key: 'complementary' as const, label: 'Formación Complementaria' },
    ]

    return (
      <div className="flex flex-col h-full overflow-hidden">
        {renderBreadcrumb()}
        <div className="space-y-4 overflow-y-auto flex-1 pr-2 pb-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-zinc-700">
          <input
            type="text"
            placeholder="Buscar por nombre o código"
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-all"
          />

          <div className="flex flex-col gap-2">
            {state.searchMode === 'available' && (
              <div className="flex flex-wrap gap-1 p-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`cursor-pointer shrink-0 text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg transition-all ${
                      activeTab === tab.key
                        ? 'bg-blue-600 text-blue-50'
                        : 'bg-zinc-800/40 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {filteredGroups.map((group) => (
            <SubjectItem key={group.code} group={group} />
          ))}
        </div>
      </div>
    )
  }

  // Vista 2: Mostrando paralelos de una materia específica (Search Result)
  return (
    <div className="flex flex-col h-full  overflow-hidden">
      {renderBreadcrumb()}
      <div className="space-y-4 overflow-y-auto flex-1 pr-2 pb-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-zinc-700">
        {groups.map((group, groupIndex) => (
          <SubjectDetail key={group.code} group={group} groupIndex={groupIndex} />
        ))}
      </div>
    </div>
  )
}

function SubjectItem({ group }: { group: SubjectGroup }) {
  const { state, dispatch } = useScheduler()

  const handleSelectSubject = async () => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: group.code })
    dispatch({ type: 'SET_LOADING_SEARCH', payload: true })
    dispatch({ type: 'SET_ERROR_SEARCH', payload: null })
    dispatch({ type: 'SET_SEARCH_MODE', payload: 'search' })

    // If parallels are already in searchResults, don't fetch again
    const alreadyLoaded = state.searchResults.some(r => r.codigomateria.trim().toUpperCase() === group.code.trim().toUpperCase())
    if (alreadyLoaded) {
      dispatch({ type: 'SET_LOADING_SEARCH', payload: false })
      return
    }

    try {
      const { api } = await import('../../services/api')
      const results = await api.searchSubject(group.code, 1)

      // Fetch the parallel details in batches of 5 to avoid overloading the server
      for (let i = 0; i < results.length; i += 5) {
        const batch = results.slice(i, i + 5)
        await Promise.all(batch.map(async (parallel) => {
          const key = `${parallel.codigomateria}-${parallel.paralelo}-${parallel.tipocurso}`

          if (state.parallelDetails[key]) return

          try {
            const [infoRes, scheduleRes, examsRes, studentsRes] = await Promise.allSettled([
              api.getCourseInfo(parallel.codigomateria, parallel.paralelo),
              api.getSubjectSchedule(parallel.codigomateria, parallel.paralelo),
              parallel.tipoparalelo === 'TEORICO'
                ? api.getExamSchedule(parallel.codigomateria, parallel.paralelo)
                : Promise.resolve([]),
              api.getRegisteredStudents(parallel.codigomateria, parallel.paralelo),
            ])

            const isInactive = [infoRes, scheduleRes].some(
              res => res.status === 'rejected' && (res.reason as Error)?.message?.includes('404')
            )

            if (isInactive) {
              dispatch({ type: 'SET_STOPPED_SUBJECT', payload: { code: parallel.codigomateria, paralelo: parallel.paralelo } })
              return
            }

            const non404Error = [infoRes, scheduleRes].map(res =>
              res.status === 'rejected' ? (res.reason as Error)?.message : null
            ).find(msg => msg && !msg.includes('404'))

            const info = infoRes.status === 'fulfilled' ? infoRes.value[0] ?? null : null
            const scheduleData = scheduleRes.status === 'fulfilled' ? scheduleRes.value : []
            const examsData = examsRes.status === 'fulfilled' ? examsRes.value : []
            const students = studentsRes.status === 'fulfilled' ? studentsRes.value : null

            const cuposDisponibles = (info && students)
              ? Math.max(0, info.cupo_maximo - students.length)
              : null

            dispatch({
              type: 'SET_PARALLEL_DETAIL',
              payload: {
                key,
                detail: {
                  subjectCode: parallel.codigomateria,
                  subjectName: parallel.nombre,
                  paralelo: parallel.paralelo,
                  tipocurso: parallel.tipocurso as 'P' | 'G',
                  tipoparalelo: parallel.tipoparalelo,
                  info,
                  schedule: scheduleData,
                  exams: examsData,
                  loading: false,
                  error: non404Error || null,
                  cuposDisponibles,
                }
              }
            })
          } catch (e) {
            dispatch({
              type: 'SET_PARALLEL_DETAIL',
              payload: {
                key,
                detail: {
                  subjectCode: parallel.codigomateria,
                  subjectName: parallel.nombre,
                  paralelo: parallel.paralelo,
                  tipocurso: parallel.tipocurso as 'P' | 'G',
                  tipoparalelo: parallel.tipoparalelo,
                  info: null,
                  schedule: [],
                  exams: [],
                  loading: false,
                  error: (e as Error).message,
                  cuposDisponibles: null,
                }
              }
            })
          }
        }))
      }

      dispatch({ type: 'SET_SEARCH_RESULTS', payload: results })
    } catch (e) {
      dispatch({ type: 'SET_ERROR_SEARCH', payload: (e as Error).message })
    } finally {
      dispatch({ type: 'SET_LOADING_SEARCH', payload: false })
    }
  }

  return (
    <button
      onClick={handleSelectSubject}
      className="w-full text-left group bg-zinc-900 hover:bg-zinc-800/50 border border-zinc-800 hover:border-blue-900/50 transition-all cursor-pointer py-4 px-5 rounded-2xl flex flex-col gap-1 relative"
    >
      <div className="flex justify-between items-start w-full">
        <span className="text-[10px] font-bold text-zinc-600 group-hover:text-blue-500 transition-colors uppercase tracking-widest leading-none">{group.code}</span>
      </div>
      <span className="text-sm font-extrabold text-white transition-colors leading-tight">{group.name}</span>
    </button>
  )
}

function SubjectDetail({ group, groupIndex }: { group: SubjectGroup; groupIndex: number }) {
  const [sortMode] = useState<'numero' | 'profesor'>('numero')

  const sortedUnits = useMemo(() => {
    const units = [...group.units]
    if (sortMode === 'profesor') {
      units.sort((a, b) => {
        // En los resultados de búsqueda, el profesor suele venir en `profesor` del teórico
        const pA = a.teorico?.profesor ?? a.practicos[0]?.profesor ?? ''
        const pB = b.teorico?.profesor ?? b.practicos[0]?.profesor ?? ''
        // Si no hay profe, al fondo
        if (!pA) return 1
        if (!pB) return -1
        return pA.localeCompare(pB)
      })
    } else {
      // Por numero (default)
      units.sort((a, b) => {
        const p1 = a.teorico?.paralelo ?? a.practicos[0]?.paralelo ?? 0
        const p2 = b.teorico?.paralelo ?? b.practicos[0]?.paralelo ?? 0
        return p1 - p2
      })
    }
    return units
  }, [group.units, sortMode])

  return (
    <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-right-4 duration-200">
      <div className="flex flex-col px-1 gap-0.5">
        <h3 className="text-[11px] font-medium text-blue-500 uppercase tracking-[5%]">{group.code}</h3>
        <h2 className="text-2xl font-bold text-white leading-tight tracking-tight">{group.name}</h2>
      </div>

      {group.units.length > 0 ? (
        <div className="space-y-3">
          {/* <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <label className="text-xs text-zinc-400">Ordenar por:</label>
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as 'numero' | 'profesor')}
                className="bg-zinc-800 border border-zinc-700 text-xs text-white rounded px-2 py-1 outline-none focus:border-zinc-500"
              >
                <option value="numero">Número Paralelo</option>
                <option value="profesor">Profesor</option>
              </select>
            </div>
          </div> */}
          <div className="space-y-2">
            {sortedUnits.map((u) => (
              <ParallelCard
                key={u.teorico ? `T-${u.teorico.paralelo}` : `P-${u.practicos[0]?.paralelo}`}
                unit={u}
                subjectIndex={groupIndex}
              />
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-zinc-500 italic px-1">No se encontraron paralelos.</p>
      )}
    </div>
  )
}
