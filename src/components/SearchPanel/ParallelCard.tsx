import { useState, useEffect } from 'react'
import { useScheduler } from '../../context/SchedulerContext'
import { api } from '../../services/api'
import { hasTimeConflict, hasExamConflict, getSubjectColor, secondsToTime } from '../../utils/conflicts'
import type { ParallelUnit } from './SubjectList'
import type { SubjectResult, ParallelDetail, CourseInfo } from '../../types'

interface Props {
  unit: ParallelUnit
  subjectIndex: number
}

export function ParallelCard({ unit, subjectIndex }: Props) {
  const { state, dispatch } = useScheduler()
  const [expanded, setExpanded] = useState(false)
  const [selectedPracticoId, setSelectedPracticoId] = useState<string | null>(
    unit.practicos.length > 0 ? `${unit.practicos[0].codigomateria}-${unit.practicos[0].paralelo}-${unit.practicos[0].tipocurso}` : null
  )

  const t = unit.teorico
  const p = unit.practicos.find(pr => `${pr.codigomateria}-${pr.paralelo}-${pr.tipocurso}` === selectedPracticoId) ?? unit.practicos[0]

  const tKey = t ? `${t.codigomateria}-${t.paralelo}-${t.tipocurso}` : null
  const pKey = p ? `${p.codigomateria}-${p.paralelo}-${p.tipocurso}` : null

  const tDetail = tKey ? state.parallelDetails[tKey] : null
  const pDetail = pKey ? state.parallelDetails[pKey] : null

  const isTSelected = tKey ? state.selectedParallels.some(sel => sel.id === tKey) : false
  const isPSelected = pKey ? state.selectedParallels.some(sel => sel.id === pKey) : false
  const isSelected = isTSelected || isPSelected

  // Check if ANY other parallel of the same subject is already selected
  const subjectCode = t?.codigomateria || p?.codigomateria
  const isSubjectAlreadySelected = !isSelected && state.selectedParallels.some(sel => sel.subjectCode === subjectCode)

  const loadParallelInfo = async (parallel: SubjectResult, force = false) => {
    const key = `${parallel.codigomateria}-${parallel.paralelo}-${parallel.tipocurso}`
    // Si el curso está marcado como detenido (por un 404 previo), NO hacer nada
    const stopParallelArr = state.stoppedSubjects[parallel.codigomateria]
    if (stopParallelArr?.includes(parallel.paralelo)) return

    const existing = state.parallelDetails[key]

    // Si ya se está cargando (y no es un reintento forzado), NO hacer nada
    if (existing?.loading && !force) return

    // Si ya tiene datos (info o horario) y cupos disponibles, y no es forzado, NO hacer nada
    if (!force && existing && (existing.info || existing.schedule.length > 0) && existing.cuposDisponibles !== null) return

    const initial: ParallelDetail = {
      subjectCode: parallel.codigomateria,
      subjectName: parallel.nombre,
      paralelo: parallel.paralelo,
      tipocurso: parallel.tipocurso as 'P' | 'G',
      tipoparalelo: parallel.tipoparalelo,
      info: existing?.info || null,
      schedule: existing?.schedule || [],
      exams: existing?.exams || [],
      loading: true,
      error: null,
      cuposDisponibles: existing?.cuposDisponibles ?? null,
    }

    dispatch({ type: 'SET_PARALLEL_DETAIL', payload: { key, detail: initial } })

    try {
      const [infoRes, scheduleRes, examsRes, studentsRes] = await Promise.allSettled([
        api.getCourseInfo(parallel.codigomateria, parallel.paralelo),
        api.getSubjectSchedule(parallel.codigomateria, parallel.paralelo),
        parallel.tipoparalelo === 'TEORICO'
          ? api.getExamSchedule(parallel.codigomateria, parallel.paralelo)
          : Promise.resolve([]),
        api.getRegisteredStudents(parallel.codigomateria, parallel.paralelo),
      ])

      const info = infoRes.status === 'fulfilled' ? (infoRes.value[0] as CourseInfo) ?? null : (existing?.info || null)
      const scheduleData = scheduleRes.status === 'fulfilled' ? scheduleRes.value : (existing?.schedule || [])
      const examsData = examsRes.status === 'fulfilled' ? examsRes.value : (existing?.exams || [])
      const students = studentsRes.status === 'fulfilled' ? studentsRes.value : null

      const cuposDisponibles = (info && students)
        ? Math.max(0, info.cupo_maximo - students.length)
        : null

      // Detect if this parallel is inactive (404)
      const isInactive = [infoRes, scheduleRes].some(
        res => res.status === 'rejected' && (res.reason as Error)?.message?.includes('404')
      )

      if (isInactive) {
        dispatch({ type: 'SET_STOPPED_SUBJECT', payload: { code: parallel.codigomateria, paralelo: parallel.paralelo } })
        return
      }

      dispatch({
        type: 'SET_PARALLEL_DETAIL',
        payload: {
          key,
          detail: { ...initial, info, schedule: scheduleData, exams: examsData, cuposDisponibles, loading: false },
        },
      })
    } catch (e) {
      dispatch({
        type: 'SET_PARALLEL_DETAIL',
        payload: { key, detail: { ...initial, loading: false, error: (e as Error).message } },
      })
    }
  }

  // Prefetch effect: Solo corre cuando tKey o pKey cambian, o si faltan detalles críticos
  useEffect(() => {
    if (t && !tDetail) loadParallelInfo(t)
    if (p && !pDetail) loadParallelInfo(p)

    // También precargar los demás prácticos si no están en state
    unit.practicos.forEach(pr => {
      const key = `${pr.codigomateria}-${pr.paralelo}-${pr.tipocurso}`
      if (!state.parallelDetails[key]) loadParallelInfo(pr)
    })
  }, [tKey, pKey, unit.practicos]) // Reducidas las dependencias para evitar bucles

  // Re-fetch trigger al expandir si no hay nada de info
  useEffect(() => {
    if (expanded) {
      if (t && (!tDetail || (!tDetail.info && tDetail.schedule.length === 0))) {
        loadParallelInfo(t, true)
      }
      if (p && (!pDetail || (!pDetail.info && pDetail.schedule.length === 0))) {
        loadParallelInfo(p, true)
      }
    }
  }, [expanded])

  // Smart Default Effect: Si el P actual no tiene horario, busca uno que sí tenga
  useEffect(() => {
    if (pDetail && !pDetail.loading && pDetail.schedule.length === 0) {
      const betterP = unit.practicos.find(pr => {
        const key = `${pr.codigomateria}-${pr.paralelo}-${pr.tipocurso}`
        const pDef = state.parallelDetails[key]
        return pDef && !pDef.loading && pDef.schedule.length > 0
      })
      if (betterP) {
        setSelectedPracticoId(`${betterP.codigomateria}-${betterP.paralelo}-${betterP.tipocurso}`)
      }
    }
  }, [pDetail?.loading, unit.practicos])

  const handleExpand = () => {
    setExpanded(prev => !prev)
  }

  const [showOptions, setShowOptions] = useState(false)

  const getPracticoStatus = (pr: SubjectResult) => {
    const prKey = `${pr.codigomateria}-${pr.paralelo}-${pr.tipocurso}`
    const isPrSelected = state.selectedParallels.some(sel => sel.id === prKey)

    if (isPrSelected) return { type: 'agregado', label: 'AGREGADO' }

    const prDetail = state.parallelDetails[prKey]
    if (prDetail && !prDetail.loading && prDetail.schedule.length > 0) {
      const combined = [...(tDetail?.schedule ?? []), ...prDetail.schedule]
      // Check conflict against everything EXCEPT this subject's parallels
      const otherSelected = state.selectedParallels.filter(sel => sel.subjectCode !== pr.codigomateria)
      if (hasTimeConflict(combined, otherSelected)) {
        return { type: 'cruce', label: 'CRUCE' }
      }
    }
    return null
  }

  const handlePracticoChange = (id: string) => {
    const oldPKey = pKey
    setSelectedPracticoId(id)

    const newP = unit.practicos.find(pr => `${pr.codigomateria}-${pr.paralelo}-${pr.tipocurso}` === id)
    if (newP && expanded) {
      loadParallelInfo(newP)
    }
    setShowOptions(false)

    // If the current practical is already in the schedule, swap it with the new one
    if (oldPKey && state.selectedParallels.some(sel => sel.id === oldPKey)) {
      dispatch({ type: 'REMOVE_PARALLEL', payload: oldPKey })

      const newPKey = id
      const newPDetail = state.parallelDetails[newPKey]
      // Only add if we have the info ready (usually prefetched)
      if (newPDetail && !newPDetail.loading && newPDetail.info) {
        const color = getSubjectColor(newPDetail.subjectCode)
        dispatch({
          type: 'ADD_PARALLEL',
          payload: {
            id: newPKey,
            subjectCode: newPDetail.subjectCode,
            subjectName: newPDetail.subjectName,
            paralelo: newPDetail.paralelo,
            tipocurso: newPDetail.tipocurso,
            tipoparalelo: newPDetail.tipoparalelo,
            info: newPDetail.info,
            schedule: newPDetail.schedule,
            exams: newPDetail.exams,
            color,
          },
        })
      }
    }
  }

  // Close dropdown on click outside
  useEffect(() => {
    if (!showOptions) return
    const handler = () => setShowOptions(false)
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [showOptions])

  const combinedSchedule = [...(tDetail?.schedule ?? []), ...(pDetail?.schedule ?? [])]
  const combinedExams = [...(tDetail?.exams ?? []), ...(pDetail?.exams ?? [])]

  const conflictSchedule = (!isSelected && (tDetail || pDetail))
    ? hasTimeConflict(combinedSchedule, state.selectedParallels)
    : null

  const conflictExam = (!isSelected && (tDetail || pDetail))
    ? hasExamConflict(combinedExams, state.selectedParallels)
    : null

  const hasConflict = !!(conflictSchedule || conflictExam)
  const isReady = (t ? !!tDetail?.info : true) && (p ? !!pDetail?.info : true)
  const loading = tDetail?.loading || pDetail?.loading

  const handleAdd = () => {
    if (!isReady || isSelected || hasConflict) return
    const color = getSubjectColor(subjectCode ?? subjectIndex)

    if (t && tDetail?.info) {
      dispatch({
        type: 'ADD_PARALLEL',
        payload: {
          id: tKey!,
          subjectCode: t.codigomateria,
          subjectName: t.nombre,
          paralelo: t.paralelo,
          tipocurso: t.tipocurso as 'P' | 'G',
          tipoparalelo: t.tipoparalelo,
          info: tDetail.info,
          schedule: tDetail.schedule,
          exams: tDetail.exams,
          color,
        },
      })
    }
    if (p && pDetail?.info) {
      dispatch({
        type: 'ADD_PARALLEL',
        payload: {
          id: pKey!,
          subjectCode: p.codigomateria,
          subjectName: p.nombre,
          paralelo: p.paralelo,
          tipocurso: p.tipocurso as 'P' | 'G',
          tipoparalelo: p.tipoparalelo,
          info: pDetail.info,
          schedule: pDetail.schedule,
          exams: pDetail.exams,
          color,
        },
      })
    }
  }

  const handleRemove = () => {
    if (tKey) dispatch({ type: 'REMOVE_PARALLEL', payload: tKey })
    if (pKey) dispatch({ type: 'REMOVE_PARALLEL', payload: pKey })
  }

  const title = t
    ? `Paralelo ${t.paralelo}`
    : `Práctico ${p?.paralelo}`

  // Solo ocultamos si NO tiene NADA de información en NINGUNA de sus partes (Teórico y TODOS sus Prácticos)

  return (
    <div className={`rounded-2xl border transition-all duration-200 ${isSelected ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/20' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'}`}>
      <button
        onClick={handleExpand}
        className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-2xl cursor-pointer"
      >
        <div className="flex gap-1.5 pt-0.5">
          {t && <span className="text-[9px] font-black px-1.5 py-0.5 rounded text-blue-100 bg-blue-600 uppercase tracking-tighter">T</span>}
          {p && <span className="text-[9px] font-black px-1.5 py-0.5 rounded text-emerald-100 bg-emerald-600 uppercase tracking-tighter">P</span>}
        </div>
        <span className="text-sm font-bold text-zinc-100 truncate">{title}</span>

        {loading && (tDetail?.cuposDisponibles === null && pDetail?.cuposDisponibles === null) && (
          <span className="text-[10px] text-zinc-400 animate-pulse font-medium">Cupos...</span>
        )}

        {!loading && (tDetail?.cuposDisponibles !== null || pDetail?.cuposDisponibles !== null) && (
          <span className="text-[10px] font-bold bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">
            {tDetail?.cuposDisponibles ?? pDetail?.cuposDisponibles} cupos
          </span>
        )}

        {loading && <span className="text-[10px] text-zinc-400 ml-2 animate-pulse font-medium italic">Cargando...</span>}

        <div className="ml-auto flex items-center gap-2">
          {isSelected ? (
            <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">✓ Agregado</span>
          ) : isSubjectAlreadySelected ? (
            <span className="text-[10px] font-bold text-orange-400 border border-orange-500/20 bg-orange-500/10 px-2 py-0.5 rounded-full whitespace-nowrap">Ya en horario</span>
          ) : (
            <div className="flex gap-1">
              {conflictSchedule && <span className="text-[9px] font-black bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20 whitespace-nowrap">⚠ CRUCE HORA</span>}
              {!conflictSchedule && conflictExam && <span className="text-[9px] font-black bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full border border-yellow-500/20 whitespace-nowrap">⚠ CRUCE EXAMEN</span>}
            </div>
          )}
          <span className={`text-zinc-300 text-xs transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>▼</span>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 text-xs text-zinc-500 space-y-6 border-t border-zinc-800 pt-4">
          {loading && <p className="italic text-zinc-400">Cargando información detallada...</p>}

          {!loading && (
            <>
              {/* Selector de práctico si hay múltiples asociados */}
              {/* {unit.practicos.length > 1 && (
                <div className="flex items-center gap-2 bg-zinc-800/50 p-2.5 rounded-xl border border-zinc-800 relative">
                  <span className="font-bold text-zinc-500 text-[10px] uppercase tracking-wider shrink-0">Cambiar Práctico:</span>
                  <div className="relative flex-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowOptions(!showOptions)
                      }}
                      className="w-full flex items-center justify-between bg-zinc-900 border border-zinc-700 hover:border-zinc-600 rounded-lg px-3 py-1.5 text-zinc-100 font-medium transition-all text-[11px] group"
                    >
                      <span className="truncate">Paralelo {p.paralelo}</span>
                      <span className={`text-[10px] text-zinc-500 group-hover:text-zinc-300 transition-transform duration-200 ${showOptions ? 'rotate-180' : ''}`}>▼</span>
                    </button>

                    {showOptions && (
                      <div
                        className="absolute bottom-full left-0 right-0 mb-1 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150"
                        onClick={e => e.stopPropagation()}
                      >
                        <div className="max-h-48 overflow-y-auto py-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full">
                          {unit.practicos.map(pr => {
                            const prId = `${pr.codigomateria}-${pr.paralelo}-${pr.tipocurso}`
                            const status = getPracticoStatus(pr)
                            const isCurrent = prId === selectedPracticoId

                            return (
                              <button
                                key={prId}
                                onClick={() => handlePracticoChange(prId)}
                                className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-zinc-800 transition-colors ${isCurrent ? 'bg-blue-500/5 text-blue-400' : 'text-zinc-300'}`}
                              >
                                <span className={`text-[11px] font-bold ${isCurrent ? 'text-blue-400' : ''}`}>
                                  Paralelo {pr.paralelo}
                                </span>
                                {status && (
                                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter ${status.type === 'agregado' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                    }`}>
                                    {status.label}
                                  </span>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )} */}

              {/* Detalle Teórico */}
              {t && tDetail && !tDetail.error && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between border-zinc-800">
                    <span className="text-blue-400 font-bold tracking-tight">Teórico</span>
                    <span className="text-zinc-500 font-medium text-xs">{tDetail.info?.nombre_profesor || 'Sin profesor'}</span>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    {tDetail.schedule.length > 0 ? (
                      tDetail.schedule.map((s, i) => (
                        <div key={i} className="flex items-start gap-3 justify-between bg-zinc-800/30 p-2 rounded-lg border border-zinc-700/50">
                          <span className="text-xs font-extrabold text-blue-400 w-8">{s.nombredia.slice(0, 3)}</span>
                          <span className="text-zinc-300 font-mono tracking-tight text-xs">
                            {secondsToTime(s.horainicio)} — {secondsToTime(s.horafin)}
                          </span>
                          <span className="text-zinc-500 text-right flex-1 font-medium">{s.aula}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-zinc-400 italic py-1 text-center">Sin horario registrado</p>
                    )}
                  </div>
                </div>
              )}

              {/* Detalle Práctico */}
              {p && pDetail && !pDetail.error && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between border-zinc-800">
                    <span className="text-emerald-400 font-bold tracking-tight">Práctico</span>
                    <span className="text-zinc-500 font-medium text-xs">{pDetail.info?.nombre_profesor || 'Sin profesor'}</span>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    {pDetail.schedule.length > 0 ? (
                      pDetail.schedule.map((s, i) => (
                        <div key={i} className="flex items-start gap-3 justify-between bg-zinc-800/30 p-2 rounded-lg border border-zinc-700/50">
                          <span className="text-xs font-extrabold text-emerald-400 w-8">{s.nombredia.slice(0, 3)}</span>
                          <span className="text-zinc-300 font-mono tracking-tight text-xs">
                            {secondsToTime(s.horainicio)} — {secondsToTime(s.horafin)}
                          </span>
                          <span className="text-zinc-500 text-right flex-1 font-medium">{s.aula}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-zinc-400 italic py-1 text-center">Sin horario registrado</p>
                    )}
                  </div>
                </div>
              )}

              {/* Errores de API */}
              {(tDetail?.error || pDetail?.error) && (
                <p className="text-red-400">Error cargando datos de la API</p>
              )}

              {/* Exámenes Combinados */}
              {/* {combinedExams.length > 0 && (
                <div className="pt-3 border-t border-zinc-800">
                  <p className="text-white font-bold mb-2 tracking-tight">Fechas de Exámenes</p>
                  <div className="space-y-1.5">
                    {combinedExams.map((e, i) => {
                      let dateStr = String(e.fecha ?? e.nombredia)
                      if (e.fecha) {
                        const d = new Date(e.fecha as string)
                        d.setMinutes(d.getMinutes() + d.getTimezoneOffset()) // adjust for local print
                        dateStr = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
                      }
                      return (
                        <div key={i} className="flex items-center gap-4 justify-between bg-indigo-500/10 p-2 rounded-lg border-l-2 border-indigo-500">
                          <span className="text-xs font-bold text-indigo-400 w-fit uppercase">{dateStr}</span>
                          {e.horainicio !== undefined && e.horafin !== undefined && (
                            <span className="text-zinc-300 font-mono text-xs">
                              {secondsToTime(e.horainicio as number)} — {secondsToTime(e.horafin as number)}
                            </span>
                          )}
                          <span className="text-zinc-500 text-right flex-1 font-medium">{e.aula as string}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )} */}

              {/* Conflictos */}
              {isSubjectAlreadySelected && (
                <div className="text-orange-600 bg-orange-50 p-3 rounded-xl border border-orange-100 flex gap-2 items-start">
                  <span className="pt-0.5">⚠</span>
                  <p className="font-medium">Ya has seleccionado otro paralelo para esta materia.</p>
                </div>
              )}
              {conflictSchedule && !isSubjectAlreadySelected && (
                <div className="text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 flex gap-2 items-start">
                  <span className="pt-0.5">⚠</span>
                  <p className="font-medium text-balance">Cruce de horario con <b>{conflictSchedule.subjectName} P{conflictSchedule.paralelo}</b></p>
                </div>
              )}
              {conflictExam && !conflictSchedule && (
                <div className="text-yellow-700 bg-yellow-50 p-3 rounded-xl border border-yellow-100 flex gap-2 items-start">
                  <span className="pt-0.5">⚠</span>
                  <p className="font-medium text-balance">Cruce de examen con <b>{conflictExam.subjectName} P{conflictExam.paralelo}</b></p>
                </div>
              )}

              {/* Acciones */}
              <div className="flex gap-2 pt-2">
                {!isSelected ? (
                  <button
                    onClick={handleAdd}
                    disabled={hasConflict || !isReady || isSubjectAlreadySelected}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-white cursor-pointer font-bold w-full transition-all active:scale-[0.98]"
                  >
                    Agregar al horario
                  </button>
                ) : (
                  <button
                    onClick={handleRemove}
                    className="px-6 py-3 bg-red-900 hover:bg-zinc-700 text-red-300 rounded-xl font-bold w-full transition-all border border-red-500/80 active:scale-[0.98] text-sm"
                  >
                    Quitar del horario
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
