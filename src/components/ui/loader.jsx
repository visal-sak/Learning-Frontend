import { motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"

/**
 * Monochrome ring loader (JS port of the shared loader component).
 * - title / subtitle are optional: pass null (or leave out) to hide them
 * - sizes: xs (inline sections), sm, md, lg
 * - rings are black in light mode and white in dark mode; motion stops for reduced-motion users
 */
const sizeConfig = {
  xs: { container: "size-9", titleClass: "text-xs/tight font-medium", subtitleClass: "text-[11px]/relaxed", spacing: "space-y-1", maxWidth: "max-w-48", gap: "gap-2.5", pad: "p-3" },
  sm: { container: "size-20", titleClass: "text-sm/tight font-medium", subtitleClass: "text-xs/relaxed", spacing: "space-y-2", maxWidth: "max-w-48", gap: "gap-6", pad: "p-6" },
  md: { container: "size-32", titleClass: "text-base/snug font-medium", subtitleClass: "text-sm/relaxed", spacing: "space-y-3", maxWidth: "max-w-56", gap: "gap-8", pad: "p-8" },
  lg: { container: "size-40", titleClass: "text-lg/tight font-semibold", subtitleClass: "text-base/relaxed", spacing: "space-y-4", maxWidth: "max-w-64", gap: "gap-8", pad: "p-8" },
}

// One ring per entry: conic gradient (the arc) masked to a thin band (the ring)
const ring = (from, stops, band) => ({
  background: `conic-gradient(from ${from}deg, ${stops})`,
  mask: `radial-gradient(circle at 50% 50%, ${band})`,
  WebkitMask: `radial-gradient(circle at 50% 50%, ${band})`,
})

const RINGS = [
  { from: 0, stops: (c) => `transparent 0deg, rgb(${c}) 90deg, transparent 180deg`, band: "transparent 35%, black 37%, black 39%, transparent 41%", opacity: 0.8, duration: 3, dir: 1, ease: "linear" },
  { from: 0, stops: (c) => `transparent 0deg, rgb(${c}) 120deg, rgba(${c}, 0.5) 240deg, transparent 360deg`, band: "transparent 42%, black 44%, black 48%, transparent 50%", opacity: 0.9, duration: 2.5, dir: 1, ease: [0.4, 0, 0.6, 1] },
  { from: 180, stops: (c) => `transparent 0deg, rgba(${c}, 0.6) 45deg, transparent 90deg`, band: "transparent 52%, black 54%, black 56%, transparent 58%", opacity: 0.35, duration: 4, dir: -1, ease: [0.4, 0, 0.6, 1] },
  { from: 270, stops: (c) => `transparent 0deg, rgba(${c}, 0.4) 20deg, transparent 40deg`, band: "transparent 61%, black 62%, black 63%, transparent 64%", opacity: 0.5, duration: 3.5, dir: 1, ease: "linear" },
]

export default function Loader({ title = "Loading…", subtitle = null, size = "md", className, ...props }) {
  const config = sizeConfig[size] ?? sizeConfig.md
  const reduce = useReducedMotion()
  const spin = (r) => (reduce ? {} : { animate: { rotate: [0, 360 * r.dir] }, transition: { duration: r.duration, repeat: Infinity, ease: r.ease } })

  return (
    <div role="status" aria-live="polite" className={cn("flex flex-col items-center justify-center", config.gap, config.pad, className)} {...props}>
      <motion.div
        className={cn("relative", config.container)}
        {...(reduce ? {} : { animate: { scale: [1, 1.02, 1] }, transition: { duration: 4, repeat: Infinity, ease: [0.4, 0, 0.6, 1] } })}
      >
        {/* light mode: black rings */}
        {RINGS.map((r, i) => (
          <motion.div
            key={`l${i}`}
            className="absolute inset-0 rounded-full dark:hidden"
            style={{ ...ring(r.from, r.stops("0, 0, 0"), r.band), opacity: r.opacity }}
            {...spin(r)}
          />
        ))}
        {/* dark mode: white rings */}
        {RINGS.map((r, i) => (
          <motion.div
            key={`d${i}`}
            className="absolute inset-0 hidden rounded-full dark:block"
            style={{ ...ring(r.from, r.stops("255, 255, 255"), r.band), opacity: r.opacity }}
            {...spin(r)}
          />
        ))}
      </motion.div>

      {(title || subtitle) && (
        <motion.div
          className={cn("text-center", config.spacing, config.maxWidth)}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        >
          {title && (
            <p className={cn(config.titleClass, "leading-[1.15] tracking-[-0.02em] text-black/90 antialiased dark:text-white/90")}>
              <motion.span
                {...(reduce ? {} : { animate: { opacity: [0.9, 0.7, 0.9] }, transition: { duration: 3, repeat: Infinity, ease: [0.4, 0, 0.6, 1] } })}
              >
                {title}
              </motion.span>
            </p>
          )}
          {subtitle && (
            <p className={cn(config.subtitleClass, "font-normal leading-[1.45] tracking-[-0.01em] text-black/60 antialiased dark:text-white/60")}>
              {subtitle}
            </p>
          )}
        </motion.div>
      )}
    </div>
  )
}
