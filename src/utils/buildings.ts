const BUILDING_FACULTY_COLORS: Record<number, string> = {
  3: '#51A335',  // FCV
  5: '#00B1C1',  // Maritima
  7: '#EA691D',  // Administrativo
  8: '#FFDE00',  // CELEX
  9: '#5A3885',  // FCNM
  10: '#d62b2c', // Bienestar
  11: '#758396', // FIEC
  12: '#2167A2', // FIMCP
  13: '#25541E', // FICT
  14: '#CF2A7E', // FADCOM
}

export function getBuildingColorFromBlock(block?: string | null): string | null {
  if (!block) return null
  const match = block.match(/\d+/)
  if (!match) return null
  const buildingNumber = Number(match[0])
  return BUILDING_FACULTY_COLORS[buildingNumber] ?? null
}

export function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '')
  const safeHex = normalized.length === 3
    ? normalized.split('').map((ch) => ch + ch).join('')
    : normalized

  const r = parseInt(safeHex.slice(0, 2), 16)
  const g = parseInt(safeHex.slice(2, 4), 16)
  const b = parseInt(safeHex.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function getReadableTextColor(hex: string): '#000000' | '#FFFFFF' {
  const normalized = hex.replace('#', '')
  const safeHex = normalized.length === 3
    ? normalized.split('').map((ch) => ch + ch).join('')
    : normalized

  const r = parseInt(safeHex.slice(0, 2), 16)
  const g = parseInt(safeHex.slice(2, 4), 16)
  const b = parseInt(safeHex.slice(4, 6), 16)
  const luminance = (0.299 * r) + (0.587 * g) + (0.114 * b)
  return luminance > 160 ? '#000000' : '#FFFFFF'
}

export function mixHexColors(baseHex: string, mixHex: string, ratio: number): string {
  const clamp = Math.max(0, Math.min(1, ratio))

  const expand = (hex: string) => {
    const normalized = hex.replace('#', '')
    return normalized.length === 3
      ? normalized.split('').map((ch) => ch + ch).join('')
      : normalized
  }

  const base = expand(baseHex)
  const mix = expand(mixHex)

  const bR = parseInt(base.slice(0, 2), 16)
  const bG = parseInt(base.slice(2, 4), 16)
  const bB = parseInt(base.slice(4, 6), 16)

  const mR = parseInt(mix.slice(0, 2), 16)
  const mG = parseInt(mix.slice(2, 4), 16)
  const mB = parseInt(mix.slice(4, 6), 16)

  const toHex = (value: number) => Math.round(value).toString(16).padStart(2, '0')

  const r = bR + (mR - bR) * clamp
  const g = bG + (mG - bG) * clamp
  const b = bB + (mB - bB) * clamp

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}
