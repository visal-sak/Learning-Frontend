import * as React from "react"
import { Select as SelectPrimitive } from "radix-ui"
import { Check, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { menuAnimation } from "@/components/ui/dropdown-menu"

// Radix Select doesn't allow "" as an item value, so placeholder options ("All categories") map to this
const EMPTY = "__empty__"

/**
 * Drop-in replacement for <select>: same props (value, onChange(e), <option> children, id, name,
 * disabled, aria-*) but rendered as a Radix Select with the dropdown-menu open/close animation.
 */
function NativeSelect({ value, onChange, children, className, id, name, disabled, "aria-label": ariaLabel, "aria-invalid": ariaInvalid }) {
  const options = React.Children.toArray(children)
    .filter((el) => React.isValidElement(el) && el.type === "option")
    .map((el) => {
      const raw = el.props.value ?? el.props.children
      return { value: raw === "" ? EMPTY : String(raw), label: el.props.children, disabled: el.props.disabled }
    })

  const current = value === "" || value == null ? EMPTY : String(value)
  const placeholder = options.find((o) => o.value === EMPTY)?.label ?? "Select…"

  return (
    <SelectPrimitive.Root
      value={current}
      onValueChange={(v) => onChange?.({ target: { name, id, value: v === EMPTY ? "" : v } })}
      disabled={disabled}
      name={name}
    >
      <SelectPrimitive.Trigger
        id={id}
        aria-label={ariaLabel}
        aria-invalid={ariaInvalid}
        data-slot="native-select"
        className={cn(
          "group border-input flex h-9 w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] dark:bg-input/30",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[placeholder]:text-muted-foreground [&>span]:truncate",
          className
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon asChild>
          {/* points down when closed, flips up while the list is open */}
          <ChevronDown className="size-4 shrink-0 opacity-60 transition-transform duration-200 ease-out group-data-[state=open]:rotate-180 motion-reduce:transition-none" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          className={cn(
            "relative z-[100002] max-h-[var(--radix-select-content-available-height)] min-w-[var(--radix-select-trigger-width)] origin-[--radix-select-content-transform-origin] overflow-y-auto overflow-x-hidden rounded-xl border bg-popover p-1 text-popover-foreground shadow-md",
            menuAnimation
          )}
        >
          <SelectPrimitive.Viewport>
            {options.map((o) => (
              <SelectPrimitive.Item
                key={o.value}
                value={o.value}
                disabled={o.disabled}
                className="relative flex cursor-pointer select-none items-center rounded-xl py-1.5 pr-8 pl-3 text-sm text-foreground/85 outline-none transition-colors focus:bg-muted focus:text-foreground data-[state=checked]:font-medium data-[state=checked]:text-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              >
                <SelectPrimitive.ItemText>{o.label}</SelectPrimitive.ItemText>
                <span className="absolute right-2 flex size-3.5 items-center justify-center">
                  <SelectPrimitive.ItemIndicator>
                    <Check className="size-4" />
                  </SelectPrimitive.ItemIndicator>
                </span>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}

export { NativeSelect }
