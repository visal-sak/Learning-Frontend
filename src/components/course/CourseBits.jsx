import { BookOpen, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { COURSE_STATUS } from "@/lib/constants"
import { getErrorMessage } from "@/lib/api"

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
  const s = COURSE_STATUS[status] ?? { label: status, className: "bg-secondary text-secondary-foreground" }
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold", s.className)}>
      {s.dot && <span className={cn("size-1.5 rounded-full", s.dot)} />}
      {s.label}
    </span>
  )
}


export function LoadingState({ className }) {
  return (
    <div className={cn("flex justify-center py-16", className)}>
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  )
}

export function ErrorState({ error, onRetry, className }) {
  return (
    <div className={cn("flex flex-col items-center gap-3 py-16 text-center", className)}>
      <AlertCircle className="size-6 text-destructive" />
      <p className="text-sm text-muted-foreground">{getErrorMessage(error, "Couldn’t load data")}</p>
      {onRetry && <Button variant="outline" size="sm" onClick={onRetry}>Try again</Button>}
    </div>
  )
}

export function EmptyState({ title, children, className }) {
  return (
    <div className={cn("rounded-xl border border-dashed px-6 py-14 text-center", className)}>
      <p className="font-medium">{title}</p>
      {children && <div className="mt-1 text-sm text-muted-foreground">{children}</div>}
    </div>
  )
}
