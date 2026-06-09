export type HBar = { label: string; n: number; pct: number }

/** Horizontal bar list (label · track/fill · count) — onboarding pipeline. */
export function HBarList({ bars }: { bars: HBar[] }) {
  return (
    <div className="grid gap-[11px]">
      {bars.map((b) => (
        <div
          key={b.label}
          className="grid grid-cols-[130px_1fr_46px] items-center gap-2.5 text-[12.5px]"
        >
          <span>{b.label}</span>
          <div className="h-[9px] overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${b.pct}%` }}
            />
          </div>
          <span className="mono text-right text-muted-foreground">{b.n}</span>
        </div>
      ))}
    </div>
  )
}
