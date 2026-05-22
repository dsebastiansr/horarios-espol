// --- API Response Types ---

export interface SubjectResult {
  codigomateria: string
  nombre: string
  paralelo: number
  tipoparalelo: 'TEORICO' | 'PRACTICO'
  tipocurso: string
  profesor?: string
}

export interface AvailableSubject {
  cod_materia_acad: string
  nombre_materia: string
  numcreditos: number
  tipocredito: string;        // EDUCACIÓN GENERAL, FORMACIÓN COMPLEMENTARIA, FORMACIÓN PROFESIONAL
  estadoacad: string
  cod_unidadestudiante: string
}

export interface ScheduleSlot {
  nombre: string
  codigomateria: string
  horainicio: number // seconds from midnight
  horafin: number   // seconds from midnight
  nombredia: string
  aula: string
  bloque: string
  campus: string
  idaula: number
}

export interface ExamSlot {
  nombre?: string
  codigomateria?: string
  horainicio?: number
  horafin?: number
  fecha?: string
  nombredia?: string
  aula?: string
  [key: string]: unknown // API schema not fully documented
}

export interface CourseInfo {
  cod_materia_acad: string
  paralelo: number
  nombre_materia: string
  nombre_profesor: string
  cupo_maximo: number
}

// --- App State Types ---

export interface ParallelDetail {
  subjectCode: string
  subjectName: string
  paralelo: number
  tipocurso: 'P' | 'G'
  tipoparalelo: 'TEORICO' | 'PRACTICO'
  info: CourseInfo | null
  schedule: ScheduleSlot[]
  exams: ExamSlot[]
  loading: boolean
  error: string | null
  cuposDisponibles: number | null
}

export interface SelectedParallel {
  id: string // `${subjectCode}-${paralelo}`
  subjectCode: string
  subjectName: string
  paralelo: number
  tipocurso: 'P' | 'G'
  tipoparalelo: 'TEORICO' | 'PRACTICO'
  info: CourseInfo
  schedule: ScheduleSlot[]
  exams: ExamSlot[]
  color: string
}

export interface ConflictInfo {
  paralelo: SelectedParallel
  type: 'schedule' | 'exam'
}

export type SearchMode = 'search' | 'available'

// --- Scheduler State ---
export interface SchedulerState {
  selectedParallels: SelectedParallel[]
  searchResults: SubjectResult[]
  availableSubjects: AvailableSubject[]
  parallelDetails: Record<string, ParallelDetail>
  searchQuery: string
  searchMode: SearchMode
  loadingSearch: boolean
  loadingAvailable: boolean
  errorSearch: string | null
  studentInfo: StudentInfo | null
  stoppedSubjects: Record<string, number[]>
}

export interface StudentInfo {
  usuario: string
  matricula: string
  identificacion: string
  nombres: string
  apellidos: string
  correo: string
  fechanacimiento: string
  carrera: string
  facultad: string
  facebook: string
  twitter: string
  factor: number
  foto: string
  promediogeneral: number
}

// --- Reducer Actions ---
export type SchedulerAction =
  | { type: 'RESET_FOR_NEW_STUDENT' }
  | { type: 'SET_SEARCH_RESULTS'; payload: SubjectResult[] }
  | { type: 'SET_AVAILABLE_SUBJECTS'; payload: AvailableSubject[] }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SEARCH_MODE'; payload: SearchMode }
  | { type: 'SET_LOADING_SEARCH'; payload: boolean }
  | { type: 'SET_LOADING_AVAILABLE'; payload: boolean }
  | { type: 'SET_ERROR_SEARCH'; payload: string | null }
  | { type: 'SET_PARALLEL_DETAIL'; payload: { key: string; detail: ParallelDetail } }
  | { type: 'SET_STUDENT_INFO'; payload: StudentInfo | null }
  | { type: 'SET_STOPPED_SUBJECT'; payload: { code: string; paralelo: number } }
  | { type: 'ADD_PARALLEL'; payload: SelectedParallel }
  | { type: 'REMOVE_PARALLEL'; payload: string }
  | { type: 'CLEAR_ALL' }
