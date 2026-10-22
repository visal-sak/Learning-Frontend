import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

// Brand checkbox: rounded box, navy fill + white tick when on. Native input underneath for forms and keyboard.
export function Checkbox({ checked, onChange, className, size = "md", ...props }) {
  return (
    <span className={cn("relative inline-grid shrink-0 place-items-center", size === "sm" ? "size-4" : "size-5", className)}>
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange?.(e.target.checked, e)}
        className={cn(
          "peer absolute inset-0 m-0 appearance-none border-2 transition-colors outline-none",
          size === "sm" ? "rounded-[4px]" : "rounded-[6px]",
          "border-neutral-300 bg-white hover:border-primary/60 dark:border-neutral-600 dark:bg-neutral-900",
          "checked:border-primary checked:bg-primary dark:checked:border-primary dark:checked:bg-primary",
          "focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:opacity-50"
        )}
        {...props}
      />
      <Check
        strokeWidth={3.5}
        className={cn("pointer-events-none relative text-primary-foreground opacity-0 transition-opacity peer-checked:opacity-100", size === "sm" ? "size-2.5" : "size-3.5")}
      />
    </span>
  )
}
