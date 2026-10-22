import { cn } from "@/lib/utils"

// Small number pill for tabs and menus: fixed height + min width so 1–3 digits sit centred and never clip.
// active = filled navy (the selected tab); otherwise a quiet grey.
export function CountBadge({ children, active = false, className }) {
  return (
    <span
      className={cn(
        "inline-grid h-5 min-w-5 shrink-0 place-items-center rounded-full px-1.5 text-[11px] font-semibold leading-none tabular-nums",
        active ? "bg-primary text-primary-foreground" : "bg-neutral-200/80 text-muted-foreground dark:bg-neutral-700/70",
        className
      )}
    >
      {children}
    </span>
  )
}
