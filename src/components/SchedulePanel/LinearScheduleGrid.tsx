import { secondsToTime } from '../../utils/conflicts'

interface DayDefinition {
  key: string
  label: string
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
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-zinc-900/40 rounded-2xl border border-dashed border-zinc-800">
        <p className="text-zinc-400 text-sm font-medium">{emptyTitle}</p>
        {emptySubtitle && <p className="text-zinc-600 text-xs mt-1">{emptySubtitle}</p>}
      </div>
    )
  }

  const hours: number[] = []
  for (let s = gridStart; s <= gridStart + totalSlots * slotSeconds; s += slotSeconds) {
    hours.push(s)
  }

  return (
    <div className="overflow-x-auto bg-zinc-900/70 rounded-2xl border border-zinc-800">
      <div
        className={`grid text-xs p-4 ${minWidthClassName}`}
        style={{ gridTemplateColumns: `56px repeat(${days.length}, 1fr)` }}
      >
        <div />
        {days.map((day) => (
          <div key={day.key} className="px-2 py-2 text-center border-b border-zinc-800">
            <span className="text-zinc-300 text-[11px] font-semibold tracking-wide uppercase">{day.label}</span>
          </div>
        ))}

        {hours.map((hourSec) => {
          const slotIndex = Math.floor((hourSec - gridStart) / slotSeconds)
          const rowStart = slotIndex + 2
          const isHalfHour = hourSec % 3600 !== 0

          return (
            <div key={hourSec} className="contents">
              <div
                className={`text-right pr-3 pt-0.5 ${isHalfHour ? 'text-zinc-700 text-[9px]' : 'text-zinc-500 text-[10px]'}`}
                style={{ gridRow: `${rowStart} / span 1`, gridColumn: 1 }}
              >
                {!isHalfHour && secondsToTime(hourSec)}
              </div>

              {days.map((d, dayIndex) => (
                <div
                  key={`${d.key}-${hourSec}`}
                  className={`border-l border-t ${isHalfHour ? 'border-zinc-800/20' : 'border-zinc-800/45'}`}
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
              className="z-10 rounded-md p-2.5 flex flex-col gap-1 bg-[#111]"
              style={{
                gridColumn: item.day + 2,
                gridRow: `${item.startSlot + 2} / span ${rowSpan}`,
                borderColor: item.color,
                boxShadow: `inset 0 0 0 1px ${item.color}33`,
                margin: '2px 4px',
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
              {item.subtitle && <p className="text-zinc-400 text-[10px]">{item.subtitle}</p>}
              {item.detail && <p className="text-zinc-500 text-[10px] truncate">{item.detail}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
