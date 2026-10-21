/**
 * Adaptive notch navigation bar — ported from TSX to JSX for this Vite/JS project.
 * framer-motion → motion/react (same API, already installed). Otherwise unchanged,
 * plus `NotchDropdownItem` is exported so custom bars (see sections/Navbar.jsx) can reuse it.
 */
import { forwardRef, useCallback, useEffect, useId, useMemo, useRef, useState } from "react"
import { LayoutGroup, motion } from "motion/react"
import { Check, ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"

export function NotchLeftWing({ position = "top", className }) {
  const isBottom = position === "bottom"
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      shapeRendering="geometricPrecision"
      className={cn(
        "pointer-events-none absolute right-full size-2.5 md:size-4 overflow-visible select-none text-zinc-950 transition-colors duration-200 dark:text-zinc-200",
        isBottom ? "bottom-0" : "top-0",
        className
      )}
    >
      <path d={isBottom ? "M 0 20 C 11.046 20 20 11.046 20 0 H 21 V 21 H 0 Z" : "M 0 0 C 11.046 0 20 8.954 20 20 H 21 V -1 H 0 Z"} fill="currentColor" />
    </svg>
  )
}

export function NotchRightWing({ position = "top", className }) {
  const isBottom = position === "bottom"
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      shapeRendering="geometricPrecision"
      className={cn(
        "pointer-events-none absolute left-full size-2.5 md:size-4 overflow-visible select-none text-zinc-950 transition-colors duration-200 dark:text-zinc-200",
        isBottom ? "bottom-0" : "top-0",
        className
      )}
    >
      <path d={isBottom ? "M 20 20 C 8.954 20 0 11.046 0 0 H -1 V 21 H 20 Z" : "M 20 0 C 8.954 0 0 8.954 0 20 H -1 V -1 H 20 Z"} fill="currentColor" />
    </svg>
  )
}

export function NotchCornerLeftWing({ position = "top", className }) {
  const isBottom = position === "bottom"
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      shapeRendering="geometricPrecision"
      className={cn(
        "pointer-events-none absolute left-0 size-2.5 md:size-4 overflow-visible select-none text-zinc-950 transition-colors duration-200 dark:text-zinc-200",
        isBottom ? "bottom-full" : "top-full",
        className
      )}
    >
      <path d={isBottom ? "M 0 20 H 20 C 8.954 20 0 11.046 0 0 V 20 Z" : "M 0 0 H 20 C 8.954 0 0 8.954 0 20 V 0 Z"} fill="currentColor" />
    </svg>
  )
}

export function NotchCornerRightWing({ position = "top", className }) {
  const isBottom = position === "bottom"
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      shapeRendering="geometricPrecision"
      className={cn(
        "pointer-events-none absolute right-0 size-2.5 md:size-4 overflow-visible select-none text-zinc-950 transition-colors duration-200 dark:text-zinc-200",
        isBottom ? "bottom-full" : "top-full",
        className
      )}
    >
      <path d={isBottom ? "M 20 20 H 0 C 11.046 20 20 11.046 20 0 V 20 Z" : "M 20 0 H 0 C 11.046 0 20 8.954 20 20 V 0 Z"} fill="currentColor" />
    </svg>
  )
}

export const NotchItem = forwardRef(function NotchItem(
  { id, label, isActive, icon: Icon, badge, disabled, className, onClick, onSelect, ...props },
  ref
) {
  const handleClick = (event) => {
    if (disabled) {
      event.preventDefault()
      return
    }
    onSelect(id)
    onClick?.(event)
  }

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      if (!disabled) onSelect(id)
    }
  }

  return (
    <button
      ref={ref}
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "group relative flex h-9 cursor-pointer items-center gap-2 rounded-full px-3.5 text-sm font-medium transition-colors outline-none select-none",
        "focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-1 dark:focus-visible:ring-zinc-500",
        isActive ? "font-semibold text-zinc-50 dark:text-zinc-950" : "text-zinc-400 hover:text-zinc-200 dark:text-zinc-600 dark:hover:text-zinc-900",
        disabled && "cursor-not-allowed pointer-events-none opacity-40",
        className
      )}
      {...props}
    >
      {isActive && (
        <motion.span
          layoutId="notch-active-pill"
          className="absolute inset-0 rounded-full bg-zinc-800 dark:bg-zinc-300"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}

      <span className="relative z-10 flex items-center gap-2">
        {Icon && (
          <Icon
            className={cn(
              "size-4 shrink-0 transition-colors",
              isActive ? "text-zinc-50 dark:text-zinc-950" : "text-zinc-400 group-hover:text-zinc-200 dark:text-zinc-600 dark:group-hover:text-zinc-900"
            )}
          />
        )}
        <span className="leading-none">{label}</span>
        {badge && (
          <span className="rounded-full bg-zinc-800 px-1.5 py-0.5 text-[10px] font-bold tracking-tight uppercase text-zinc-300 dark:bg-zinc-300 dark:text-zinc-800">
            {badge}
          </span>
        )}
      </span>
    </button>
  )
})

export function NotchDropdownItem({ item, isSelected, onSelect }) {
  const Icon = item.icon
  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      disabled={item.disabled}
      onClick={() => onSelect(item.id)}
      className={cn(
        "flex w-full cursor-pointer items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-left text-sm outline-none transition-colors select-none",
        "focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500",
        isSelected
          ? "bg-zinc-800 font-semibold text-zinc-50 dark:bg-zinc-300 dark:text-zinc-950"
          : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 active:bg-zinc-800 dark:text-zinc-600 dark:hover:bg-zinc-300/60 dark:hover:text-zinc-950 dark:active:bg-zinc-300",
        item.disabled && "cursor-not-allowed pointer-events-none opacity-40"
      )}
    >
      <div className="flex items-center gap-2.5">
        {Icon && <Icon className={cn("size-4 shrink-0", isSelected ? "text-zinc-50 dark:text-zinc-950" : "text-zinc-400 dark:text-zinc-600")} />}
        <span>{item.label}</span>
      </div>
      {isSelected && <Check className="size-3.5 text-zinc-50 dark:text-zinc-950" />}
    </button>
  )
}

/** Full-screen framed layout from the original component (frame + notches + scroll viewport). */
export function NotchNav({
  items,
  activeId: controlledActiveId,
  defaultActiveId,
  position = "top",
  logo,
  rightContent,
  showLogo = true,
  showRightContent = true,
  children,
  onActiveChange,
  className,
  ...props
}) {
  const containerRef = useRef(null)
  const layoutGroupId = useId()
  const [internalActiveId, setInternalActiveId] = useState(defaultActiveId || items[0]?.id || "")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const isBottom = position === "bottom"
  const activeId = controlledActiveId !== undefined ? controlledActiveId : internalActiveId

  const activeIndex = useMemo(() => {
    const index = items.findIndex((item) => item.id === activeId)
    return index >= 0 ? index : 0
  }, [items, activeId])
  const activeItem = items[activeIndex] || items[0]

  const handleSelect = useCallback(
    (id) => {
      if (controlledActiveId === undefined) setInternalActiveId(id)
      setIsDropdownOpen(false)
      onActiveChange?.(id)
    },
    [controlledActiveId, onActiveChange]
  )

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) setIsDropdownOpen(false)
    }
    if (isDropdownOpen) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isDropdownOpen])

  return (
    <div className={cn("fixed inset-0 h-screen w-screen overflow-hidden bg-zinc-950 p-0 md:p-2 transition-colors duration-200 dark:bg-zinc-200", className)} {...props}>
      <div className="relative flex h-full w-full flex-col rounded-none md:rounded-2xl bg-background text-foreground antialiased transition-colors duration-200">
        <div
          aria-hidden="true"
          onClick={() => setIsDropdownOpen(false)}
          className={cn(
            "absolute inset-0 z-40 rounded-none md:rounded-2xl transition-opacity duration-200 ease-out xl:hidden",
            isDropdownOpen ? "pointer-events-auto bg-black/20 backdrop-blur-[2px] opacity-100 dark:bg-black/40" : "pointer-events-none opacity-0"
          )}
        />

        {showLogo && logo && (
          <aside
            aria-label="Brand logo notch"
            className={cn(
              "hidden xl:flex absolute left-0 z-50 h-10 px-5 select-none transition-colors duration-200 bg-zinc-950 dark:bg-zinc-200 dark:text-zinc-950",
              isBottom ? "bottom-0 rounded-tr-[24px] md:items-end" : "top-0 rounded-br-[24px] md:items-baseline"
            )}
          >
            <div className="flex items-center text-zinc-50 dark:text-zinc-950">{logo}</div>
            <NotchRightWing position={position} />
            <NotchCornerLeftWing position={position} />
          </aside>
        )}

        <header
          role="tablist"
          aria-orientation="horizontal"
          className={cn(
            "hidden xl:flex absolute left-1/2 -translate-x-1/2 z-50 h-11 px-4 bg-zinc-950 text-zinc-50 select-none transition-colors duration-200 dark:bg-zinc-200 dark:text-zinc-950",
            isBottom ? "bottom-0 rounded-t-[24px] md:items-end" : "top-0 rounded-b-[24px] md:items-start"
          )}
        >
          <NotchLeftWing position={position} />
          <NotchRightWing position={position} />
          <LayoutGroup id={layoutGroupId}>
            <div className="flex items-center gap-1">
              {items.map((item) => (
                <NotchItem
                  key={item.id}
                  id={item.id}
                  label={item.label}
                  icon={item.icon}
                  badge={item.badge}
                  disabled={item.disabled}
                  isActive={item.id === activeId}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          </LayoutGroup>
        </header>

        {showRightContent && rightContent && (
          <aside
            aria-label="User actions notch"
            className={cn(
              "hidden xl:flex absolute right-0 z-50 h-10 px-5 select-none transition-colors duration-200 bg-zinc-950 dark:bg-zinc-200 dark:text-zinc-950",
              isBottom ? "bottom-0 rounded-tl-[24px] md:items-end" : "top-0 rounded-bl-[24px] md:items-start"
            )}
          >
            <NotchLeftWing position={position} />
            <NotchCornerRightWing position={position} />
            <div className="flex items-center text-zinc-50 dark:text-zinc-950">{rightContent}</div>
          </aside>
        )}

        <div
          ref={containerRef}
          className={cn(
            "xl:hidden absolute z-50 flex flex-col bg-zinc-950 text-zinc-50 select-none transition-colors duration-200 dark:bg-zinc-200 dark:text-zinc-950",
            "w-auto left-1/2 -translate-x-1/2 px-4",
            isBottom ? "bottom-0 rounded-t-[24px]" : "top-0 rounded-b-[24px]"
          )}
        >
          <NotchLeftWing position={position} />
          <NotchRightWing position={position} />

          <div className={cn("w-auto xl:w-max lg:w-full flex h-10 items-center justify-between gap-3 sm:gap-5", isBottom ? "sm:items-baseline md:items-end" : "sm:items-baseline md:items-start")}>
            {showLogo && logo && <div className="flex shrink-0 items-center text-zinc-50 dark:text-zinc-950">{logo}</div>}

            <button
              type="button"
              aria-expanded={isDropdownOpen}
              aria-haspopup="listbox"
              aria-label="Toggle navigation menu"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="group flex h-8 sm:h-8.5 w-full cursor-pointer items-center justify-center gap-1.5 rounded-full px-2.5 py-2.5 sm:p-2.5 text-xs sm:text-sm font-semibold text-zinc-50 outline-none transition-colors sm:hover:bg-zinc-800/60 focus-visible:ring-2 focus-visible:ring-zinc-400 dark:text-zinc-950 dark:sm:hover:bg-zinc-300/60 dark:focus-visible:ring-zinc-500"
            >
              {activeItem?.icon && <activeItem.icon className="size-3.5 sm:size-4 shrink-0 text-zinc-400 dark:text-zinc-600" />}
              <span className="leading-none">{activeItem?.label}</span>
              {isBottom ? (
                <ChevronUp className={cn("size-3.5 text-zinc-400 transition-transform duration-200 dark:text-zinc-600", isDropdownOpen && "rotate-180")} />
              ) : (
                <ChevronDown className={cn("size-3.5 text-zinc-400 transition-transform duration-200 dark:text-zinc-600", isDropdownOpen && "rotate-180")} />
              )}
            </button>

            {showRightContent && rightContent && (
              <div className="flex w-max shrink-0 items-center justify-end text-zinc-50 dark:text-zinc-950">{rightContent}</div>
            )}
          </div>

          <div
            role="listbox"
            aria-label="Navigation options"
            className={cn(
              "grid w-full transition-[grid-template-rows,opacity] duration-200 ease-out",
              isDropdownOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none"
            )}
          >
            <div className="overflow-hidden">
              <div className={cn("flex w-full flex-col gap-0.5 px-0.5", isBottom ? "pb-2 pt-1.5" : "pt-1.5 pb-2.5")}>
                {items.map((item) => (
                  <NotchDropdownItem key={item.id} item={item} isSelected={item.id === activeId} onSelect={handleSelect} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={cn("relative flex h-full w-full items-center justify-center overflow-y-auto overflow-x-hidden px-3 sm:px-4 md:px-6", isBottom ? "pt-3 pb-17.5" : "pt-17.5 pb-3")}>
          {children}
        </div>
      </div>
    </div>
  )
}
