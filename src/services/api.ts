import { parseISO8601Duration } from '../utils/conflicts'
import type {
  SubjectResult,
  AvailableSubject,
  ScheduleSlot,
  ExamSlot,
  CourseInfo,
  StudentInfo
} from '../types'

async function get<T>(path: string, params: Record<string, string>): Promise<T> {
  const searchParams = new URLSearchParams(params)
  const res = await fetch(`${path}?${searchParams.toString()}`)
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`)
  return res.json() as Promise<T>
}

export const api = {
  searchSubject: (parameter: string, typeSearch: 1 | 2) =>
    get<SubjectResult[]>('/api/search-subject', {
      parameter,
      type_search: String(typeSearch),
    }),

  getAvailableSubjects: (studentCode: string) =>
    get<AvailableSubject[]>('/api/available-subjects', {
      student_code: studentCode,
    }),

  getSubjectSchedule: async (subjectCode: string, paralelo: number) => {
    const data = await get<Record<string, unknown>[]>('/api/subject-schedule', {
      subject_code: subjectCode,
      course: String(paralelo),
    })
    return data.map(slot => ({
      ...slot,
      horainicio: typeof slot.horainicio === 'string' ? parseISO8601Duration(slot.horainicio) : slot.horainicio,
      horafin: typeof slot.horafin === 'string' ? parseISO8601Duration(slot.horafin) : slot.horafin,
    })) as ScheduleSlot[]
  },

  getExamSchedule: async (subjectCode: string, paralelo: number) => {
    const data = await get<Record<string, unknown>[]>('/api/exam-schedule', {
      subject_code: subjectCode,
      course: String(paralelo),
    })
    return data.map(slot => ({
      ...slot,
      horainicio: typeof slot.horainicio === 'string' ? parseISO8601Duration(slot.horainicio) : slot.horainicio,
      horafin: typeof slot.horafin === 'string' ? parseISO8601Duration(slot.horafin) : slot.horafin,
    })) as ExamSlot[]
  },

  getCourseInfo: (subjectCode: string, paralelo: number) =>
    get<CourseInfo[]>('/api/course-info', {
      subject_code: subjectCode,
      course: String(paralelo),
    }),

  getStudentInfo: (studentCode: string) =>
    get<StudentInfo>('/api/general-info', {
      student_code: studentCode,
    }),

  getRegisteredStudents: (subjectCode: string, paralelo: number) =>
    get<Record<string, unknown>[]>('/api/registered-students', {
      subject_code: subjectCode,
      course: String(paralelo),
    }),
}
