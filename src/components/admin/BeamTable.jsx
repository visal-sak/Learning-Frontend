import { useSyncExternalStore } from "react"
import { GridBeam } from "@/components/ui/grid-beam"
import { useThemeStore } from "@/store/theme.store"
import { cn } from "@/lib/utils"

// Beams follow the app's light/dark toggle
function useBeamTheme() {
  return useThemeStore((s) => (s.dark ? "dark" : "light"))
}

// Number of columns that fits the viewport (GridBeam needs a fixed grid, so pick it in JS)
function useColumns(map) {
  const query = (bp) => `(min-width: ${bp}px)`
  const pick = () => {
    const entries = Object.entries(map).map(([bp, n]) => [Number(bp), n]).sort((a, b) => b[0] - a[0])
    for (const [bp, n] of entries) if (typeof window === "undefined" || window.matchMedia(query(bp)).matches) return n
    return entries.at(-1)[1]
  }
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener("resize", cb)
      return () => window.removeEventListener("resize", cb)
    },
    pick,
    pick
  )
}

/**
 * Table on a GridBeam: every column has the same width and every row the same height,
 * so the animated beams run exactly along the cell borders.
 * columns: [{ key, label, render?(row), align?: "right" }]
 */
export function BeamTable({ columns, rows, rowKey = (r) => r.id, rowHeight = 52, minColWidth = 140, breakpoint = 768, className }) {
  const theme = useBeamTheme()
  const wide = useColumns({ 0: false, [breakpoint]: true })
  const gridRows = rows.length + 1 // + header
  const template = { gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`, gridAutoRows: `${rowHeight}px` }

  // Small screens: a uniform grid doesn't fit, so show each row as a stacked card
  if (!wide) {
    const [primary, ...rest] = columns
    return (
      <div className={cn("space-y-2", className)}>
        {rows.map((row) => (
          <div key={rowKey(row)} className="space-y-2.5 rounded-xl border border-border bg-card p-4 text-sm">
            <div className="min-w-0 font-medium">{primary.render ? primary.render(row) : row[primary.key]}</div>
            {rest.map((c) => (
              <div key={c.key} className="flex min-w-0 items-center justify-between gap-4">
                {c.label && <span className="shrink-0 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{c.label}</span>}
                <div className={cn("flex min-w-0 justify-end text-right", !c.label && "w-full")}>{c.render ? c.render(row) : <span className="truncate">{row[c.key] ?? "—"}</span>}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl">
      <GridBeam
        rows={gridRows}
        cols={columns.length}
        colorVariant="colorful"
        theme={theme}
        active
        borderRadius={12}
        className={cn("rounded-xl border border-border bg-card", className)}
        // +2px for the 1px border top and bottom, so the last row isn't clipped
        style={{ height: gridRows * rowHeight + 2, minWidth: columns.length * minColWidth }}
      >
        <div role="table" className="grid h-full text-sm" style={template}>
          {columns.map((c) => (
            <div
              key={c.key}
              role="columnheader"
              className={cn("flex items-center px-5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground", c.align === "right" && "justify-end")}
            >
              {c.label}
            </div>
          ))}
          {rows.map((row) =>
            columns.map((c) => (
              <div
                key={`${rowKey(row)}-${c.key}`}
                role="cell"
                className={cn("flex min-w-0 items-center px-5 text-foreground", c.align === "right" && "justify-end")}
              >
                {c.render ? c.render(row) : <span className="truncate">{row[c.key] ?? "—"}</span>}
              </div>
            ))
          )}
        </div>
      </GridBeam>
    </div>
  )
}

/**
 * Metric tiles on a GridBeam. items: [{ label, value, delta?, deltaTone?: "up" | "down" | "muted" }]
 * cols: responsive map { minWidthPx: columns }, e.g. { 0: 2, 1024: 4 }
 */
export function BeamStatGrid({ items, cols = { 0: 2, 1024: 4 }, tileHeight = 124, className }) {
  const theme = useBeamTheme()
  // GridBeam needs ≥ 2 rows — if everything would fit in one row, wrap into two instead of leaving an empty row
  const n = Math.min(useColumns(cols), Math.max(1, Math.ceil(items.length / 2)))
  const rows = Math.max(2, Math.ceil(items.length / n))
  // Pad so the grid is always full (the beam grid is uniform)
  const cells = [...items, ...Array.from({ length: rows * n - items.length }, () => null)]

  return (
    <GridBeam
      rows={rows}
      cols={n}
      colorVariant="colorful"
      theme={theme}
      active
      borderRadius={12}
      className={cn("rounded-xl border border-border bg-card", className)}
      style={{ height: rows * tileHeight + 2 }}
    >
      <div className="grid h-full" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`, gridAutoRows: `${tileHeight}px` }}>
        {cells.map((item, i) =>
          item ? (
            <div key={item.label} className="flex min-w-0 flex-col justify-center px-5">
              <p className="truncate text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{item.label}</p>
              <p className="mt-2 truncate text-2xl font-semibold tabular-nums tracking-tight sm:text-[28px]">{item.value ?? "—"}</p>
              {item.delta != null && (
                <p
                  className={cn(
                    "mt-2 truncate text-xs",
                    item.deltaTone === "down" ? "text-red-500" : item.deltaTone === "muted" ? "text-muted-foreground" : "text-emerald-500"
                  )}
                >
                  {item.delta}
                </p>
              )}
            </div>
          ) : (
            <div key={`empty-${i}`} />
          )
        )}
      </div>
    </GridBeam>
  )
}

const pillTones = {
  green: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  blue: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  violet: "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400",
  amber: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  red: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
  gray: "border-border bg-muted text-muted-foreground",
}

export function StatusPill({ tone = "gray", children }) {
  return <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium", pillTones[tone])}>{children}</span>
}

export function ProgressCell({ value = 0 }) {
  const v = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div className="flex w-full items-center gap-3">
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-pink-500" style={{ width: `${v}%` }} />
      </div>
      <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">{v}%</span>
    </div>
  )
}
