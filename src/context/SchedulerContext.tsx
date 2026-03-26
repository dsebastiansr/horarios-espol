import { createContext, useContext, useReducer, type ReactNode } from 'react'
import type { SchedulerState, SchedulerAction, SelectedParallel } from '../types'

// --- Initial State ---
const initialState: SchedulerState = {
  selectedParallels: [],
  searchResults: [],
  availableSubjects: [],
  parallelDetails: {},
  searchQuery: '',
  searchMode: 'search',
  loadingSearch: false,
  loadingAvailable: false,
  errorSearch: null,
  studentInfo: null,
  stoppedSubjects: {},
}

// --- Reducer ---
function schedulerReducer(state: SchedulerState, action: SchedulerAction): SchedulerState {
  switch (action.type) {
    case 'SET_SEARCH_RESULTS':
      const filtered = action.payload.filter(r => {
        const stopParallel = state.stoppedSubjects[r.codigomateria]
        if (stopParallel === undefined) return true
        const rBase = r.paralelo % 100
        const stopBase = stopParallel % 100
        if (rBase < stopBase) return true
        if (rBase > stopBase) return false
        return r.paralelo < stopParallel
      })
      return { ...state, searchResults: filtered }
    case 'SET_AVAILABLE_SUBJECTS':
      return { ...state, availableSubjects: action.payload }
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload }
    case 'SET_SEARCH_MODE':
      return { ...state, searchMode: action.payload }
    case 'SET_LOADING_SEARCH':
      return { ...state, loadingSearch: action.payload }
    case 'SET_LOADING_AVAILABLE':
      return { ...state, loadingAvailable: action.payload }
    case 'SET_ERROR_SEARCH':
      return { ...state, errorSearch: action.payload }
    case 'SET_PARALLEL_DETAIL':
      return {
        ...state,
        parallelDetails: {
          ...state.parallelDetails,
          [action.payload.key]: action.payload.detail,
        },
      }
    case 'SET_STUDENT_INFO':
      return { ...state, studentInfo: action.payload }
    case 'SET_STOPPED_SUBJECT':
      const { code, paralelo: stopP } = action.payload
      return {
        ...state,
        stoppedSubjects: { ...state.stoppedSubjects, [code]: stopP },
        searchResults: state.searchResults.filter(r => {
          if (r.codigomateria !== code) return true
          const rBase = r.paralelo % 100
          const stopBase = stopP % 100
          if (rBase < stopBase) return true
          if (rBase > stopBase) return false
          return r.paralelo < stopP
        })
      }
    case 'ADD_PARALLEL': {
      const exists = state.selectedParallels.some(p => p.id === action.payload.id)
      if (exists) return state
      return { ...state, selectedParallels: [...state.selectedParallels, action.payload] }
    }
    case 'REMOVE_PARALLEL': {
      const pToRemove = state.selectedParallels.find(p => p.id === action.payload)
      if (!pToRemove) return state
      return {
        ...state,
        selectedParallels: state.selectedParallels.filter(p => p.subjectCode !== pToRemove.subjectCode),
      }
    }
    case 'CLEAR_ALL':
      return { ...state, selectedParallels: [] }
    default:
      return state
  }
}

// --- Context ---
interface SchedulerContextValue {
  state: SchedulerState
  dispatch: React.Dispatch<SchedulerAction>
}

const SchedulerContext = createContext<SchedulerContextValue | null>(null)

// --- Provider ---
export function SchedulerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(schedulerReducer, initialState)
  return (
    <SchedulerContext.Provider value={{ state, dispatch }}>
      {children}
    </SchedulerContext.Provider>
  )
}

// --- Hook ---
export function useScheduler() {
  const ctx = useContext(SchedulerContext)
  if (!ctx) throw new Error('useScheduler must be used within SchedulerProvider')
  return ctx
}

// --- Selector helpers ---
export function useSelectedParallels(): SelectedParallel[] {
  return useScheduler().state.selectedParallels
}
