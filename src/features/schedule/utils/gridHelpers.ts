import { GRID_END, GRID_START, SLOT_SECONDS, SUBJECT_COLORS } from '../../../domain/scheduler/conflicts'

export function computeDynamicRange(slots: Array<{ horainicio?: number; horafin?: number }>) {
  if (slots.length === 0) {
    return { dynamicStart: GRID_START, dynamicEnd: GRID_END }
  }

  const minStart = Math.min(...slots.map((slot) => slot.horainicio as number))
  const maxEnd = Math.max(...slots.map((slot) => slot.horafin as number))
  const dynamicStart = Math.floor(minStart / SLOT_SECONDS) * SLOT_SECONDS
  const dynamicEnd = Math.ceil(maxEnd / SLOT_SECONDS) * SLOT_SECONDS

  return { dynamicStart, dynamicEnd }
}

export function buildSubjectColorMap(subjectCodes: string[]) {
  const subjectColorMap = new Map<string, string>()
  subjectCodes.forEach((subjectCode) => {
    if (!subjectColorMap.has(subjectCode)) {
      const nextIndex = subjectColorMap.size % SUBJECT_COLORS.length
      subjectColorMap.set(subjectCode, SUBJECT_COLORS[nextIndex])
    }
  })
  return subjectColorMap
}

export const EXAM_DAYS = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'] as const
