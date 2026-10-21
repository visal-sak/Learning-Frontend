import { cn } from "@/lib/utils"

/**
 * Admin table in the shared look (white card, grey header row, hairline rows).
 * Desktop: a real <table>. Phones: one stacked card per row — the first column on top,
 * then "label  value" lines, and the `actions` column (if any) at the bottom.
 *
 * columns: [{ key, label, render?(row, index), align?: "right", className?, nowrap? }]
 */
export function DataTable({ columns, rows, rowKey = (r) => r.id, className }) {
  const th = "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
  const cell = (c, row, i) => (c.render ? c.render(row, i) : row[c.key] ?? <span className="text-muted-foreground">—</span>)
  const [primary, ...rest] = columns
  const actions = rest.find((c) => c.key === "actions")
  const details = rest.filter((c) => c !== actions)

  return (
    <div className={cn("overflow-hidden rounded-xl border border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-900", className)}>
      <table className="hidden w-full text-sm md:table">
        <thead className="border-b border-neutral-200/80 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800/40">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={cn(th, c.align === "right" && "text-right", c.className)}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200/80 dark:divide-neutral-800">
          {rows.map((row, i) => (
            <tr key={rowKey(row)} className="transition-colors hover:bg-neutral-50/70 dark:hover:bg-neutral-800/30">
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={cn("px-4 py-3", c.align === "right" && "text-right", (c.nowrap || c.key === "actions") && "w-px whitespace-nowrap", c.className)}
                >
                  {cell(c, row, i)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="divide-y divide-neutral-200/80 md:hidden dark:divide-neutral-800">
        {rows.map((row, i) => (
          <li key={rowKey(row)} className="space-y-2.5 p-4 text-sm">
            <div className="min-w-0">{cell(primary, row, i)}</div>
            {details.map((c) => (
              <div key={c.key} className="flex min-w-0 items-center justify-between gap-4">
                <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{c.label}</span>
                <div className="flex min-w-0 justify-end text-right">{cell(c, row, i)}</div>
              </div>
            ))}
            {actions && <div className="flex justify-start pt-1">{cell(actions, row, i)}</div>}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Tag({ className, children }) {
  return <span className={cn("inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold", className)}>{children}</span>
}
