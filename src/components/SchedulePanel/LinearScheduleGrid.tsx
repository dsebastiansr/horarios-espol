import { secondsToTime } from '../../utils/conflicts'
import { hexToRgba, mixHexColors } from '../../utils/buildings'

interface DayDefinition {
  key: string
  label: string
}

interface GridBadge {
  label: string
  kind?: 'date' | 'block' | 'room' | 'default'
  colorHex?: string
}

interface GridItem {
  id: string
  day: number
  startSlot: number
  endSlot: number
  color: string
  title: string
  subtitle?: string
  detail?: string
  badges?: GridBadge[]
  timeRange?: string
  rightTag?: string
  rightTagClassName?: string
}

interface LinearScheduleGridProps {
  days: DayDefinition[]
  totalSlots: number
  slotSeconds: number
  gridStart: number
  items: GridItem[]
  minWidthClassName?: string
  emptyTitle: string
  emptySubtitle?: string
}

export function LinearScheduleGrid({
  days,
  totalSlots,
  slotSeconds,
  gridStart,
  items,
  minWidthClassName = 'min-w-[760px]',
  emptyTitle,
  emptySubtitle,
}: LinearScheduleGridProps) {
  const getBadgeClassName = (kind: GridBadge['kind']) => {
    switch (kind) {
      case 'date':
        return ''
      case 'block':
        return ''
      case 'room':
        return ''
      default:
        return ''
    }
  }

  const getBadgeToneStyle = (baseColor: string, kind: GridBadge['kind']) => {
    const byKind = {
      date: 0.32,
      block: 0.26,
      room: 0.38,
      default: 0.3,
    } as const

    const ratio = byKind[kind ?? 'default']
    const bg = mixHexColors(baseColor, '#FFFFFF', ratio)

    return {
      color: '#F8FAFC',
      borderColor: hexToRgba('#FFFFFF', 0.34),
      backgroundColor: hexToRgba(bg, 0.22),
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-zinc-900/50 rounded-2xl border border-zinc-800">
        <p className="text-zinc-300 text-sm font-medium">{emptyTitle}</p>
        {emptySubtitle && <p className="text-zinc-500 text-xs mt-1">{emptySubtitle}</p>}
      </div>
    )
  }

  const hours: number[] = []
  for (let s = gridStart; s <= gridStart + totalSlots * slotSeconds; s += slotSeconds) {
    hours.push(s)
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/70 shadow-sm">
      <div
        className={`grid text-xs p-3 ${minWidthClassName}`}
        style={{ gridTemplateColumns: `56px repeat(${days.length}, 1fr)` }}
      >
        <div className="sticky left-0 z-20" />
        {days.map((day) => (
          <div key={day.key} className="px-2 py-2.5 text-center border-zinc-800 bg-zinc-900/90">
            <span className="text-zinc-300 text-[10px] font-semibold tracking-wide uppercase">{day.label}</span>
          </div>
        ))}

        {hours.map((hourSec) => {
          const slotIndex = Math.floor((hourSec - gridStart) / slotSeconds)
          const rowStart = slotIndex + 2
          const isHalfHour = hourSec % 3600 !== 0

          return (
            <div key={hourSec} className="contents">
              <div
                className={`text-right pr-3 pt-0.5 ${isHalfHour ? 'text-zinc-600 text-[9px]' : 'text-zinc-500 text-[10px] font-medium'}`}
                style={{ gridRow: `${rowStart} / span 1`, gridColumn: 1 }}
              >
                {secondsToTime(hourSec)}
              </div>

              {days.map((d, dayIndex) => (
                <div
                  key={`${d.key}-${hourSec}`}
                  className={`border-l border-t ${slotIndex === totalSlots ? 'border-b' : ''} ${isHalfHour ? 'border-zinc-800/90' : 'border-zinc-800/90'}`}
                  style={{ gridRow: `${rowStart} / span 1`, gridColumn: dayIndex + 2 }}
                />
              ))}
            </div>
          )
        })}

        {items.map((item) => {
          const rowSpan = item.endSlot - item.startSlot
          if (rowSpan <= 0 || item.day < 0 || item.day >= days.length) return null

          return (
            <div
              key={item.id}
              className="z-10 rounded-lg p-2.5 flex flex-col gap-1.5 border mx-0.5 my-0.5"
              style={{
                gridColumn: item.day + 2,
                gridRow: `${item.startSlot + 2} / span ${rowSpan}`,
                backgroundColor: item.color,
                borderColor: mixHexColors(item.color, '#FFFFFF', 0.24),
                boxShadow: `inset 0 0 0 1px ${mixHexColors(item.color, '#000000', 0.2)}`,
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-zinc-100 text-[11px] font-semibold leading-tight line-clamp-2">{item.title}</p>
                {item.rightTag && (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold uppercase ${item.rightTagClassName ?? 'bg-zinc-800 text-zinc-400'}`}
                  >
                    {item.rightTag}
                  </span>
                )}
              </div>
              {item.badges && item.badges.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {item.badges.map((badge, index) => (
                    <span
                      key={`${item.id}-badge-${index}`}
                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium border ${getBadgeClassName(badge.kind)}`}
                      style={getBadgeToneStyle(item.color, badge.kind)}
                    >
                      {badge.label}
                    </span>
                  ))}
                </div>
              )}
              {item.detail && <p className="text-zinc-500 text-[10px] truncate">{item.detail}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
