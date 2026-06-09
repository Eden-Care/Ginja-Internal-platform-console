export type DonutSegment = { k: string; n: number; color: string }

/**
 * Conic-gradient donut. `color` values are token references resolved to
 * `hsl(var(--token))` so the chart stays white-label friendly.
 */
export function Donut({
  segments,
  total,
  centerLabel = "Total",
}: {
  segments: DonutSegment[]
  total: number
  centerLabel?: string
}) {
  const stops = segments
    .map((s, i) => {
      const start = segments
        .slice(0, i)
        .reduce((sum, x) => sum + (x.n / total) * 100, 0)
      const end = start + (s.n / total) * 100
      return `${s.color} ${start}% ${end}%`
    })
    .join(", ")

  return (
    <div
      className="relative size-[132px] shrink-0 rounded-full"
      style={{ background: `conic-gradient(${stops})` }}
    >
      <div className="absolute inset-[19px] rounded-full bg-card" />
      <div className="absolute inset-0 z-[1] grid place-items-center text-center">
        <div>
          <b className="mono text-[22px] font-bold tracking-tight">{total}</b>
          <span className="eyebrow block text-[9px]">{centerLabel}</span>
        </div>
      </div>
    </div>
  )
}
