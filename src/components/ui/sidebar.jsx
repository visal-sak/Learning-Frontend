/**
 * Sidebar — ported from the Wensity primitive (TSX → JSX for this Vite/JS project).
 * - framer-motion → motion/react (same API, already installed)
 * - Base UI useRender (asChild) → Radix Slot (already installed)
 * - Tabler icons → lucide-react
 * - Added `to` on <SidebarItem> to render a react-router <Link> with the full item content
 */
import * as React from "react"
import { Link } from "react-router-dom"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { Slot } from "radix-ui"
import { ChevronRight, PanelLeftClose, PanelLeftOpen } from "lucide-react"

import { cn } from "@/lib/utils"

const STYLE_ID = "wensity-sidebar-styles"
const STYLES = `
.sidebar-nav { scrollbar-width: thin; scrollbar-color: transparent transparent; }
.sidebar-nav::-webkit-scrollbar { width: 4px; }
.sidebar-nav::-webkit-scrollbar-track { background: transparent; }
.sidebar-nav::-webkit-scrollbar-thumb { background-color: transparent; border-radius: 9999px; transition: background-color 0.45s ease; }
.sidebar-nav:hover { scrollbar-color: color-mix(in srgb, var(--foreground) 14%, transparent) transparent; }
.sidebar-nav:hover::-webkit-scrollbar-thumb { background-color: color-mix(in srgb, var(--foreground) 14%, transparent); }
`

if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const style = document.createElement("style")
  style.id = STYLE_ID
  style.textContent = STYLES
  document.head.appendChild(style)
}

/* ─── Motion constants ──────────────────────────────────────── */

const EASE_OUT = [0.23, 1, 0.32, 1]

/* ─── Context ───────────────────────────────────────────────── */

const SidebarContext = React.createContext(null)

function useSidebarContext() {
  const ctx = React.useContext(SidebarContext)
  if (!ctx) throw new Error("Sidebar compound components must be used within <Sidebar>")
  return ctx
}

/** Current sidebar state — lets custom header/footer content react to collapse. */
export function useSidebar() {
  const { variant, collapsed, toggleCollapsed } = useSidebarContext()
  return { variant, collapsed, toggleCollapsed }
}

/* ─── Resizable width hook ──────────────────────────────────── */

function useResizableWidth(initial, min, max) {
  const [width, setWidth] = React.useState(initial)
  const [isDragging, setIsDragging] = React.useState(false)
  const dragState = React.useRef(null)

  const clamp = React.useCallback((value) => Math.min(max, Math.max(min, value)), [min, max])

  const onPointerDown = React.useCallback(
    (e) => {
      e.preventDefault()
      e.target.setPointerCapture(e.pointerId)
      dragState.current = { startX: e.clientX, startWidth: width }
      setIsDragging(true)
    },
    [width]
  )

  React.useEffect(() => {
    if (!isDragging) return
    const onPointerMove = (e) => {
      if (!dragState.current) return
      setWidth(clamp(dragState.current.startWidth + e.clientX - dragState.current.startX))
    }
    const onPointerUp = () => {
      dragState.current = null
      setIsDragging(false)
    }
    document.addEventListener("pointermove", onPointerMove)
    document.addEventListener("pointerup", onPointerUp)
    return () => {
      document.removeEventListener("pointermove", onPointerMove)
      document.removeEventListener("pointerup", onPointerUp)
    }
  }, [isDragging, clamp])

  const onKeyDown = React.useCallback(
    (e) => {
      const step = e.shiftKey ? 48 : 16
      if (e.key === "ArrowLeft") {
        e.preventDefault()
        setWidth((w) => clamp(w - step))
      } else if (e.key === "ArrowRight") {
        e.preventDefault()
        setWidth((w) => clamp(w + step))
      } else if (e.key === "Home") {
        e.preventDefault()
        setWidth(min)
      } else if (e.key === "End") {
        e.preventDefault()
        setWidth(max)
      }
    },
    [clamp, min, max]
  )

  const reset = React.useCallback(() => setWidth(initial), [initial])
  return { width, isDragging, onPointerDown, onKeyDown, reset }
}

/* ─── Shared item styling ───────────────────────────────────── */

const itemBaseClasses = cn(
  "group/sidebar-item relative flex w-full items-center gap-2.5 rounded-[0.625rem] px-3 py-[7px]",
  "text-[13.5px] font-medium leading-none outline-none select-none whitespace-nowrap",
  "transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
  "focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--foreground)_45%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
  "disabled:pointer-events-none disabled:opacity-40"
)

const itemInactiveClasses = cn(
  "text-[color-mix(in_srgb,var(--foreground)_72%,transparent)]",
  "hover:text-[var(--foreground)]",
  "hover:bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)]"
)

const itemActiveClasses = "text-[var(--foreground)]"

const activePillClasses = cn(
  "pointer-events-none absolute inset-0 rounded-[0.625rem]",
  "bg-[color-mix(in_srgb,var(--foreground)_7%,transparent)]"
)

/* ─── <Sidebar> ─────────────────────────────────────────────── */

export const Sidebar = React.forwardRef(function Sidebar(
  {
    variant = "default",
    collapsed: controlledCollapsed,
    defaultCollapsed = false,
    onCollapsedChange,
    width: widthProp = 260,
    collapsedWidth = 60,
    minWidth = 180,
    maxWidth = 400,
    className,
    children,
    "aria-label": ariaLabel = "Sidebar",
    style,
    ...props
  },
  ref
) {
  const reactId = React.useId()
  const prefersReducedMotion = useReducedMotion()
  const isCollapsible = variant === "collapsible"
  const isIconRail = variant === "icon-rail"
  const isResizable = variant === "resizable"

  const [internalCollapsed, setInternalCollapsed] = React.useState(defaultCollapsed)
  const isControlled = controlledCollapsed !== undefined
  const collapsed = isIconRail ? true : isCollapsible ? (isControlled ? controlledCollapsed : internalCollapsed) : false

  const toggleCollapsed = React.useCallback(() => {
    if (!isCollapsible) return
    const next = !collapsed
    if (!isControlled) setInternalCollapsed(next)
    onCollapsedChange?.(next)
  }, [isCollapsible, collapsed, isControlled, onCollapsedChange])

  const resize = useResizableWidth(widthProp, minWidth, maxWidth)
  const effectiveWidth = collapsed ? collapsedWidth : isResizable ? resize.width : widthProp

  const ctx = React.useMemo(
    () => ({ variant, collapsed, toggleCollapsed, navId: `sidebar-${reactId}` }),
    [variant, collapsed, toggleCollapsed, reactId]
  )

  return (
    <SidebarContext.Provider value={ctx}>
      <nav
        ref={ref}
        aria-label={ariaLabel}
        data-slot="sidebar"
        data-variant={variant}
        data-collapsed={collapsed ? "true" : "false"}
        data-dragging={resize.isDragging ? "true" : undefined}
        style={{
          ...style,
          width: effectiveWidth,
          flexShrink: 0,
          transition: resize.isDragging || prefersReducedMotion ? "none" : "width 240ms cubic-bezier(0.23,1,0.32,1)",
        }}
        className={cn(
          "relative isolate flex h-full flex-col overflow-hidden",
          "bg-[var(--background)] text-[var(--foreground)]",
          variant === "floating"
            ? cn(
                "m-3 h-[calc(100%-1.5rem)] rounded-2xl border border-[var(--border)] bg-[var(--card)]",
                "[box-shadow:0_1px_2px_rgba(0,0,0,0.06),0_8px_24px_-12px_rgba(0,0,0,0.12)]"
              )
            : "border-r border-[var(--border)]",
          resize.isDragging && "select-none",
          className
        )}
        {...props}
      >
        {children}
        {isResizable && (
          <div
            role="separator"
            tabIndex={0}
            aria-orientation="vertical"
            aria-label="Resize sidebar"
            aria-valuemin={minWidth}
            aria-valuemax={maxWidth}
            aria-valuenow={Math.round(resize.width)}
            data-slot="sidebar-resize-handle"
            onPointerDown={resize.onPointerDown}
            onKeyDown={resize.onKeyDown}
            onDoubleClick={resize.reset}
            className={cn(
              "absolute inset-y-0 right-0 z-20 w-1.5 cursor-col-resize outline-none",
              "after:absolute after:inset-y-0 after:right-0 after:w-[2px] after:bg-transparent after:transition-colors after:duration-150",
              "hover:after:bg-[color-mix(in_srgb,var(--foreground)_18%,transparent)]",
              "focus-visible:after:bg-[color-mix(in_srgb,var(--foreground)_25%,transparent)]",
              resize.isDragging && "after:bg-[color-mix(in_srgb,var(--foreground)_30%,transparent)]"
            )}
          />
        )}
      </nav>
    </SidebarContext.Provider>
  )
})

/* ─── Fading label (shared by item / nested / section) ──────── */

function FadingLabel({ show, className, children }) {
  const prefersReducedMotion = useReducedMotion()
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.12, ease: EASE_OUT }}
          className={className}
        >
          {children}
        </motion.span>
      )}
    </AnimatePresence>
  )
}

/* ─── <SidebarHeader> ───────────────────────────────────────── */

export const SidebarHeader = React.forwardRef(function SidebarHeader({ className, children, onClick, ...props }, ref) {
  const { collapsed, variant, toggleCollapsed } = useSidebarContext()
  const isCollapsible = variant === "collapsible"

  // Collapsed: drop the toggle (no room at rail width) — clicking the header expands instead
  const visibleChildren = collapsed
    ? React.Children.toArray(children).filter((child) => !(React.isValidElement(child) && child.type === SidebarToggle))
    : children

  return (
    <div
      ref={ref}
      data-slot="sidebar-header"
      data-collapsed={collapsed ? "true" : "false"}
      role={collapsed && isCollapsible ? "button" : undefined}
      tabIndex={collapsed && isCollapsible ? 0 : undefined}
      aria-label={collapsed && isCollapsible ? "Expand sidebar" : undefined}
      onClick={(e) => {
        onClick?.(e)
        if (collapsed && isCollapsible) toggleCollapsed()
      }}
      onKeyDown={(e) => {
        if (collapsed && isCollapsible && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault()
          toggleCollapsed()
        }
      }}
      className={cn(
        "flex shrink-0 items-center",
        collapsed
          ? cn(
              "flex-col justify-center gap-2 px-0 py-3",
              isCollapsible &&
                cn(
                  "cursor-pointer select-none outline-none rounded-[0.625rem]",
                  "[transition:background-color_150ms_cubic-bezier(0.23,1,0.32,1),transform_120ms_cubic-bezier(0.23,1,0.32,1)]",
                  "hover:bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)]",
                  "focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--foreground)_45%,transparent)]",
                  "active:[transform:scale(0.97)] motion-reduce:active:[transform:none]"
                )
            )
          : "h-[52px] gap-2.5 px-[18px]",
        className
      )}
      {...props}
    >
      {visibleChildren}
    </div>
  )
})

/* ─── <SidebarNav> ──────────────────────────────────────────── */

export const SidebarNav = React.forwardRef(function SidebarNav({ className, children, ...props }, ref) {
  const { navId } = useSidebarContext()
  return (
    <div
      ref={ref}
      id={navId}
      data-slot="sidebar-nav"
      className={cn("sidebar-nav min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain py-2", className)}
      {...props}
    >
      {children}
    </div>
  )
})

/* ─── <SidebarSection> ──────────────────────────────────────── */

export const SidebarSection = React.forwardRef(function SidebarSection({ className, label, children, ...props }, ref) {
  const { collapsed } = useSidebarContext()
  return (
    <div ref={ref} data-slot="sidebar-section" role="group" aria-label={label} className={cn("py-1", className)} {...props}>
      {label && (
        <div className="flex h-[26px] items-end px-[18px] pb-1.5">
          <FadingLabel show={!collapsed} className="whitespace-nowrap text-[10.5px] font-medium uppercase leading-none tracking-[0.08em] text-[var(--muted-foreground)]">
            {label}
          </FadingLabel>
        </div>
      )}
      <div className="flex flex-col gap-px px-2">{children}</div>
    </div>
  )
})

/* ─── Active pill (glides between items) ────────────────────── */

function ActivePill({ navId }) {
  const prefersReducedMotion = useReducedMotion()
  if (prefersReducedMotion) return <span aria-hidden="true" className={activePillClasses} />
  return (
    <motion.span
      aria-hidden="true"
      layoutId={`${navId}-active-pill`}
      transition={{ type: "spring", stiffness: 520, damping: 42 }}
      className={activePillClasses}
    />
  )
}

/* ─── <SidebarItem> ─────────────────────────────────────────── */

export const SidebarItem = React.forwardRef(function SidebarItem(
  { className, icon, active = false, href, to, external = false, badge, asChild = false, children, disabled, ...props },
  ref
) {
  const { collapsed, navId } = useSidebarContext()
  const composedClassName = cn(itemBaseClasses, active ? itemActiveClasses : itemInactiveClasses, className)
  const title = collapsed && typeof children === "string" ? children : undefined
  const shared = {
    "data-slot": "sidebar-item",
    "data-active": active ? "true" : undefined,
    "aria-current": active ? "page" : undefined,
    title,
    className: composedClassName,
  }

  if (asChild && React.isValidElement(children)) {
    return <Slot.Root ref={ref} {...shared} {...props}>{children}</Slot.Root>
  }

  const content = (
    <>
      {active ? <ActivePill navId={navId} /> : null}
      {icon ? (
        <span
          data-slot="sidebar-item-icon"
          className={cn(
            "relative z-10 flex size-5 shrink-0 items-center justify-center",
            active
              ? "text-[var(--foreground)]"
              : "text-[var(--muted-foreground)] transition-colors duration-150 group-hover/sidebar-item:text-[var(--foreground)]"
          )}
        >
          {icon}
        </span>
      ) : null}
      <FadingLabel show={!collapsed} className="relative z-10 min-w-0 flex-1 truncate text-left">
        {children}
      </FadingLabel>
      {badge ? (
        <FadingLabel show={!collapsed} className="relative z-10 flex shrink-0 items-center">
          {badge}
        </FadingLabel>
      ) : null}
    </>
  )

  // Client-side route (react-router)
  if (to) {
    return (
      <Link ref={ref} to={to} {...shared} {...props}>
        {content}
      </Link>
    )
  }

  if (href) {
    return (
      <a ref={ref} href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} {...shared} {...props}>
        {content}
      </a>
    )
  }

  return (
    <button ref={ref} type="button" disabled={disabled} {...shared} {...props}>
      {content}
    </button>
  )
})

/* ─── <SidebarNested> ───────────────────────────────────────── */

export const SidebarNested = React.forwardRef(function SidebarNested(
  { icon, label, open: controlledOpen, defaultOpen = false, onOpenChange, active = false, children },
  ref
) {
  const { collapsed } = useSidebarContext()
  const prefersReducedMotion = useReducedMotion()
  const reactId = React.useId()

  const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen

  const toggle = React.useCallback(() => {
    const next = !open
    if (!isControlled) setInternalOpen(next)
    onOpenChange?.(next)
  }, [open, isControlled, onOpenChange])

  const contentId = `sidebar-nested-content-${reactId}`

  return (
    <div ref={ref} data-slot="sidebar-nested" className="flex flex-col">
      <button
        type="button"
        data-slot="sidebar-nested-trigger"
        data-open={open ? "true" : "false"}
        data-active={active ? "true" : undefined}
        aria-expanded={open}
        aria-controls={contentId}
        onClick={toggle}
        title={collapsed ? label : undefined}
        className={cn(itemBaseClasses, active && collapsed ? itemActiveClasses : itemInactiveClasses)}
      >
        {active && collapsed && <span aria-hidden="true" className={activePillClasses} />}
        {icon && (
          <span
            data-slot="sidebar-nested-icon"
            className="relative z-10 flex size-5 shrink-0 items-center justify-center text-[var(--muted-foreground)] transition-colors duration-150 group-hover/sidebar-item:text-[var(--foreground)]"
          >
            {icon}
          </span>
        )}
        <FadingLabel show={!collapsed} className="relative z-10 min-w-0 flex-1 truncate text-left">
          {label}
        </FadingLabel>
        <FadingLabel show={!collapsed} className="relative z-10 flex shrink-0 items-center">
          <motion.span
            aria-hidden="true"
            animate={{ rotate: open ? 90 : 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: EASE_OUT }}
            className="flex items-center justify-center text-[var(--muted-foreground)]"
          >
            <ChevronRight className="size-3.5" strokeWidth={2} />
          </motion.span>
        </FadingLabel>
      </button>
      <AnimatePresence initial={false}>
        {open && !collapsed && (
          <motion.div
            id={contentId}
            data-slot="sidebar-nested-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: prefersReducedMotion ? 0 : 0.24, ease: EASE_OUT },
              opacity: { duration: prefersReducedMotion ? 0 : 0.16, ease: EASE_OUT },
            }}
            className="overflow-hidden"
          >
            <div className="relative ml-[21px] flex flex-col gap-px py-0.5 pl-2.5 before:absolute before:inset-y-1 before:left-0 before:w-px before:bg-[color-mix(in_srgb,var(--foreground)_10%,transparent)]">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

/* ─── <SidebarFooter> ───────────────────────────────────────── */

export const SidebarFooter = React.forwardRef(function SidebarFooter({ className, children, ...props }, ref) {
  const { collapsed } = useSidebarContext()
  return (
    <div
      ref={ref}
      data-slot="sidebar-footer"
      data-collapsed={collapsed ? "true" : "false"}
      className={cn(
        "flex shrink-0 items-center border-t border-[var(--border)] py-3",
        collapsed ? "justify-center px-0" : "gap-2.5 px-[18px]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})

/* ─── <SidebarToggle> ───────────────────────────────────────── */

export const SidebarToggle = React.forwardRef(function SidebarToggle(
  { className, children, collapsed: collapsedProp, onToggle, ...props },
  ref
) {
  const ctx = React.useContext(SidebarContext)
  const usesContext = ctx?.variant === "collapsible"
  const collapsed = usesContext ? ctx.collapsed : collapsedProp
  const toggle = usesContext ? ctx.toggleCollapsed : onToggle

  if (collapsed === undefined || !toggle) return null

  return (
    <button
      ref={ref}
      type="button"
      data-slot="sidebar-toggle"
      data-collapsed={collapsed ? "true" : "false"}
      onClick={toggle}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      aria-expanded={!collapsed}
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-[0.625rem] outline-none text-[var(--muted-foreground)]",
        "hover:bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] hover:text-[var(--foreground)]",
        "focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--foreground)_45%,transparent)]",
        "[transition:transform_120ms_cubic-bezier(0.23,1,0.32,1),color_150ms_ease,background-color_150ms_ease]",
        "active:[transform:scale(0.96)] motion-reduce:active:[transform:none]",
        className
      )}
      {...props}
    >
      {typeof children === "function"
        ? children({ collapsed })
        : children ?? (collapsed ? <PanelLeftOpen className="size-[17px]" strokeWidth={1.75} /> : <PanelLeftClose className="size-[17px]" strokeWidth={1.75} />)}
    </button>
  )
})
