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
    case 'RESET_FOR_NEW_STUDENT':
      return {
        ...state,
        selectedParallels: [],
        searchResults: [],
        availableSubjects: [],
        parallelDetails: {},
        searchQuery: '',
        searchMode: 'search',
        errorSearch: null,
        studentInfo: null,
        stoppedSubjects: {},
      }
    case 'SET_SEARCH_RESULTS': {
      const filtered = action.payload.filter(r => {
        const stoppedArr = state.stoppedSubjects[r.codigomateria] || []
        return !stoppedArr.includes(r.paralelo)
      })
      return { ...state, searchResults: filtered }
    }
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
    case 'SET_STOPPED_SUBJECT': {
      const { code, paralelo: stopP } = action.payload
      return {
        ...state,
        stoppedSubjects: {
          ...state.stoppedSubjects,
          [code]: [...(state.stoppedSubjects[code] || []), stopP]
        },
        searchResults: state.searchResults.filter(r => {
          if (r.codigomateria !== code) return true
          const stoppedArr = state.stoppedSubjects[code] || []
          return !stoppedArr.includes(r.paralelo) && stopP !== r.paralelo
        })
      }
    }
    case 'ADD_PARALLEL': {
      const exists = state.selectedParallels.some(p => p.id === action.payload.id)
      if (exists) return state
      return { ...state, selectedParallels: [...state.selectedParallels, action.payload] }
    }
    case 'REMOVE_PARALLEL': {
      return {
        ...state,
        selectedParallels: state.selectedParallels.filter(p => p.id !== action.payload),
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
// eslint-disable-next-line react-refresh/only-export-components
export function useScheduler() {
  const ctx = useContext(SchedulerContext)
  if (!ctx) throw new Error('useScheduler must be used within SchedulerProvider')
  return ctx
}

// --- Selector helpers ---
// eslint-disable-next-line react-refresh/only-export-components
export function useSelectedParallels(): SelectedParallel[] {
  return useScheduler().state.selectedParallels
}
