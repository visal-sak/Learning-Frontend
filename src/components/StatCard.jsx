import { cn } from "@/lib/utils"

const tones = {
  green: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  sky: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  violet: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  amber: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  pink: "bg-pink-500/15 text-pink-600 dark:text-pink-400",
  yellow: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
  gray: "bg-muted text-muted-foreground",
}

// Stat card: label + subtitle with a tinted icon on the right, big value, optional detail pill.
// variant "card" stands on its own (admin Overview); "inset" is a flat tile for use inside another card.
const variants = {
  card: "border border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-900",
  inset: "border border-neutral-200/80 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800/40",
}

const detailTones = {
  up: "bg-emerald-500/12 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  down: "bg-rose-500/12 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
  muted: "bg-neutral-100 text-muted-foreground dark:bg-neutral-800",
}

export function StatCard({ icon: Icon, label, subtitle, value, detail, detailTone = "muted", tone = "gray", variant = "card" }) {
  return (
    <article className={cn("flex flex-col gap-5 rounded-2xl p-5 text-card-foreground", variants[variant] ?? variants.card)}>
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold">{label}</p>
          {subtitle && <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", tones[tone])}>
          <Icon className="size-5" />
        </span>
      </header>
      <div className="mt-auto flex flex-wrap items-end justify-between gap-2">
        <p className="text-3xl font-bold leading-none tabular-nums tracking-tight">{value ?? "—"}</p>
        {detail && (
          <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", detailTones[detailTone] ?? detailTones.muted)}>{detail}</span>
        )}
      </div>
    </article>
  )
}
