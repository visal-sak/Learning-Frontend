import { createContext, useCallback, useContext, useMemo } from "react";
import { useControllableState } from "@radix-ui/react-use-controllable-state"
import { motion, useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"

// ============================================================================
// Tokens — optional chrome for demos / quick styling
// ============================================================================

/** Border + shadow stack using theme tokens so elevation reads in light and dark. */
export const cutoutCardSurfaceShadowClassName = cn(
  "border-border/80 dark:border-border/60 border",
  "shadow-[0px_1px_2px_-1px_color-mix(in_oklab,var(--foreground)_8%,transparent),0px_4px_8px_-2px_color-mix(in_oklab,var(--foreground)_6%,transparent),0px_8px_16px_-4px_color-mix(in_oklab,var(--foreground)_5%,transparent)]",
  "transition-[box-shadow,border-color] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
  "hover:border-border hover:shadow-[0px_2px_4px_-1px_color-mix(in_oklab,var(--foreground)_10%,transparent),0px_8px_16px_-4px_color-mix(in_oklab,var(--foreground)_8%,transparent),0px_16px_32px_-8px_color-mix(in_oklab,var(--foreground)_6%,transparent)]"
)

export const cutoutCardSurfaceClassName = cn(
  "group/cutout bg-card text-card-foreground relative cursor-pointer overflow-hidden rounded-[28px]",
  cutoutCardSurfaceShadowClassName
)

/** Staggered text/footer entrance inside `CutoutCardContent` — use with `motion.div` children. */
export function useCutoutContentStaggerVariants() {
  const reduceMotion = useReducedMotion()

  return useMemo(() => {
    if (reduceMotion) {
      return {
        container: {
          hidden: {},
          show: {
            transition: { staggerChildren: 0.03, delayChildren: 0 },
          },
        },

        item: {
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] },
          },
        }
      };
    }

    return {
      container: {
        hidden: {},
        show: {
          transition: { staggerChildren: 0.055, delayChildren: 0.06 },
        },
      },

      item: {
        hidden: { opacity: 0, y: 12, filter: "blur(5px)" },
        show: {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: { type: "spring", duration: 0.48, bounce: 0.14 },
        },
      }
    };
  }, [reduceMotion]);
}

const CORNER_PATH = "M0 200C155.996 199.961 200.029 156.308 200 0V200H0Z"

const CutoutCardContext = createContext(null)

export function useCutoutCard() {
  const ctx = useContext(CutoutCardContext)
  if (!ctx) {
    throw new Error("useCutoutCard must be used within <CutoutCard>")
  }
  return ctx
}

export function useOptionalCutoutCard() {
  return useContext(CutoutCardContext)
}

export function CutoutCard({
  className,
  hovered: hoveredProp,
  defaultHovered = false,
  onHoveredChange,
  trackPointerHover = true,
  onMouseEnter,
  onMouseLeave,
  children,
  ...props
}) {
  const reduceMotion = useReducedMotion()
  const [hovered, setHovered] = useControllableState({
    prop: hoveredProp,
    defaultProp: defaultHovered,
    onChange: onHoveredChange,
  })

  const setHoveredStable = useCallback(
    (next) => {
      setHovered(next)
    },
    [setHovered]
  )

  const ctx = useMemo(() => ({
    hovered: hovered ?? false,
    setHovered: setHoveredStable,
  }), [hovered, setHoveredStable])

  const handleMouseEnter = (e) => {
    onMouseEnter?.(e)
    if (e.defaultPrevented || !trackPointerHover) {
      return
    }
    setHoveredStable(true)
  }

  const handleMouseLeave = (e) => {
    onMouseLeave?.(e)
    if (e.defaultPrevented || !trackPointerHover) {
      return
    }
    setHoveredStable(false)
  }

  return (
    <CutoutCardContext.Provider value={ctx}>
      <motion.div
        animate={{ opacity: 1 }}
        className={cn(className)}
        data-slot="cutout-card"
        data-state={ctx.hovered ? "hovered" : "idle"}
        initial={{ opacity: 0 }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        transition={
          reduceMotion
            ? { duration: 0.22, ease: [0.23, 1, 0.32, 1] }
            : { duration: 0.36, ease: [0.23, 1, 0.32, 1] }
        }
        {...props}
      >
        {children}
      </motion.div>
    </CutoutCardContext.Provider>
  )
}

export function CutoutCardMedia({
  className,
  ...props
}) {
  return (
    <div
      className={cn("relative overflow-hidden", className)}
      data-slot="cutout-card-media"
      {...props}
    />
  )
}

/** Fills its parent by default; parent `CutoutCardMedia` should be `relative` with a defined block size.
 *  (Vite port: plain <img> instead of next/image.) */
export function CutoutCardImage({
  className,
  alt = "",
  fill = true,
  loading = "lazy",
  ...props
}) {
  return (
    <img
      alt={alt}
      className={cn(
        "object-cover transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover/cutout:scale-105",
        fill && "absolute inset-0 h-full w-full",
        className
      )}
      data-slot="cutout-card-image"
      loading={loading}
      {...props}
    />
  )
}

export function CutoutCardOverlay({
  className,
  ...props
}) {
  return (
    <div
      className={cn(
        "from-background/35 dark:from-background/50 pointer-events-none absolute inset-0 bg-linear-to-t via-transparent to-transparent",
        className
      )}
      data-slot="cutout-card-overlay"
      {...props}
    />
  )
}

export function CutoutCardContent({
  className,
  ...props
}) {
  return (
    <div
      className={cn("p-6", className)}
      data-slot="cutout-card-content"
      {...props}
    />
  )
}

export function CutoutCardFooter({
  className,
  ...props
}) {
  return (
    <div
      className={cn("flex items-center justify-between", className)}
      data-slot="cutout-card-footer"
      {...props}
    />
  )
}

export function CutoutCorner({
  className,
  size = 32,
  viewBox = "0 0 200 200",
  ...props
}) {
  return (
    <>
      {/* biome-ignore lint/a11y/noSvgWithoutTitle: decorative corner mask; hidden from AT via aria-hidden */}
      <svg
        aria-hidden
        className={cn(className)}
        data-slot="cutout-corner"
        height={size}
        viewBox={viewBox}
        width={size}
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <path d={CORNER_PATH} fill="currentColor" />
      </svg>
    </>
  )
}

/** Absolutely positioned strip (e.g. bottom-left “Featured”); add corners as siblings inside. Static (no entrance motion) to avoid compositing seams next to the media edge. */
export function CutoutCardInsetLabel({
  className,
  ...props
}) {
  return (
    <div
      className={cn("absolute", className)}
      data-slot="cutout-card-inset-label"
      {...props}
    />
  )
}

/** Corner badge shell (e.g. top-right “New”); add corners as siblings inside. Static (no entrance motion). */
export function CutoutCardPin({
  className,
  ...props
}) {
  return (
    <div
      className={cn("absolute", className)}
      data-slot="cutout-card-pin"
      {...props}
    />
  )
}

export function CutoutCardAction({
  className,
  revealOnHover = true,
  ...props
}) {
  const { hovered } = useCutoutCard()
  const reduceMotion = useReducedMotion()
  const visible = !revealOnHover || hovered

  return (
    <motion.div
      animate={
        visible
          ? { opacity: 1, transform: "translateY(0px)" }
          : { opacity: 0, transform: "translateY(8px)" }
      }
      className={cn(
        "absolute",
        revealOnHover && !visible && "pointer-events-none",
        className
      )}
      data-reveal={revealOnHover ? "hover" : "always"}
      data-slot="cutout-card-action"
      transition={
        reduceMotion
          ? { duration: 0.15, ease: [0.23, 1, 0.32, 1] }
          : { duration: 0.24, ease: [0.23, 1, 0.32, 1] }
      }
      {...props}
    />
  )
}
