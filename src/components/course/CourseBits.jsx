import { BookOpen, AlertCircle } from "lucide-react"
import { MdInbox } from "react-icons/md"
import Loader from "@/components/ui/loader"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { COURSE_STATUS } from "@/lib/constants"
import { getErrorMessage } from "@/lib/api"
import { useTranslation } from "react-i18next"

const gradients = [
  "from-sky-500/30 to-indigo-500/10",
  "from-emerald-500/30 to-teal-500/10",
  "from-pink-500/30 to-purple-500/10",
  "from-orange-500/30 to-red-500/10",
  "from-yellow-400/30 to-amber-600/10",
  "from-blue-500/30 to-cyan-400/10",
]

// Stable gradient per course so cards without a thumbnail still look distinct
const pick = (key = "") => gradients[[...key].reduce((n, c) => n + c.charCodeAt(0), 0) % gradients.length]

export function CourseThumb({ course, className, iconClassName }) {
  if (course?.thumbnailUrl) {
    return <img src={course.thumbnailUrl} alt="" loading="lazy" className={cn("aspect-[16/9] w-full object-cover", className)} />
  }
  return (
    <div className={cn("grid aspect-[16/9] w-full place-items-center bg-gradient-to-br", pick(course?.id || course?.title), className)}>
      <BookOpen className={cn("size-12 text-foreground/60", iconClassName)} />
    </div>
  )
}

export function StatusBadge({ status }) {
  const { t } = useTranslation()
  const s = COURSE_STATUS[status] ?? { label: status, className: "bg-secondary text-secondary-foreground" }
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold", s.className)}>
      {s.dot && <span className={cn("size-1.5 rounded-full", s.dot)} />}
      {t(`site.courseStatus.${status}`, { defaultValue: s.label })}
    </span>
  )
}


/**
 * The one loading style used across the app (ring loader).
 * variant "page"    (default) — centred in the middle of the visible screen
 * variant "section" — small loader inside a card/section of a page that is already showing
 */
export function LoadingState({ className, title, subtitle = null, size, variant = "page" }) {
  const { t } = useTranslation()
  const section = variant === "section"
  return (
    <div
      className={cn(
        section ? "flex justify-center py-6" : "flex min-h-[calc(100dvh-9rem)] w-full items-center justify-center",
        className
      )}
    >
      <Loader title={title ?? t("common.states.loading")} subtitle={subtitle} size={size ?? "xs"} />
    </div>
  )
}

export function ErrorState({ error, onRetry, className }) {
  const { t } = useTranslation()
  return (
    <div className={cn("flex flex-col items-center gap-3 py-16 text-center", className)}>
      <AlertCircle className="size-6 text-destructive" />
      <p className="text-sm text-muted-foreground">{getErrorMessage(error, t("site.shared.loadError"))}</p>
      {onRetry && <Button variant="outline" size="sm" onClick={onRetry}>{t("common.actions.retry")}</Button>}
    </div>
  )
}

/**
 * Empty state: a filled icon in soft navy halos, a title, a short hint and an optional action.
 * variant "card" (default) sits inside a page section; "page" fills a whole screen (no box).
 */
export function EmptyState({ title, children, action, icon: Icon = MdInbox, variant = "card", className }) {
  const page = variant === "page"
  return (
    <div
      className={cn(
        "relative flex flex-col items-center overflow-hidden px-6 text-center",
        page
          ? "min-h-[calc(100dvh-14rem)] justify-center py-16"
          : "rounded-2xl border border-neutral-200/80 bg-white py-12 dark:border-neutral-800 dark:bg-neutral-900",
        className
      )}
    >
      {/* faint dot grid that fades out from the middle */}
      {!page && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 text-primary/[0.07] dark:text-white/[0.05]"
          style={{
            backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
            backgroundSize: "16px 16px",
            maskImage: "radial-gradient(ellipse 60% 70% at 50% 40%, black, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse 60% 70% at 50% 40%, black, transparent 75%)",
          }}
        />
      )}
      <div className="relative grid size-20 place-items-center rounded-full bg-primary/[0.05] dark:bg-primary/10">
        <div className="grid size-14 place-items-center rounded-full bg-primary/10 ring-1 ring-primary/10 dark:bg-primary/20">
          <Icon className="size-7 text-primary" />
        </div>
      </div>
      <h3 className={cn("relative mt-5 font-semibold tracking-tight text-balance", page ? "text-xl" : "text-base")}>{title}</h3>
      {children && <div className="relative mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">{children}</div>}
      {action && <div className="relative mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  )
}
