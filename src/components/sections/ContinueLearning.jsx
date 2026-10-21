import { Link } from "react-router-dom"
import { Play, BookOpen, CheckCircle2, GraduationCap } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { CourseThumb, EmptyState, ErrorState, LoadingState } from "@/components/course/CourseBits"
import { useAuthStore } from "@/store"
import { useFetch } from "@/hooks/useFetch"
import { enrollmentService, toList } from "@/services/course.service"
import { normalizeEnrollment } from "@/lib/format"
import { cn } from "@/lib/utils"

// Surface from heygaia's workflow-card: soft zinc fill + hairline outline, 24px corners
const workflowSurface = "rounded-3xl outline-1 bg-zinc-100 outline-zinc-200 dark:bg-zinc-800 dark:outline-zinc-800/70"
// Rows inside a panel: one step lighter/darker so they read as items on the surface
const workflowRow = "rounded-2xl bg-white/70 transition-colors hover:bg-white dark:bg-zinc-900/50 dark:hover:bg-zinc-900/80"

export function EnrollmentList({ items }) {
  return (
    <div className="space-y-2.5">
      {items.map((e) => (
        <Link
          key={e.courseId}
          to={`/courses/${e.courseId}/learn${e.nextLessonId ? `/${e.nextLessonId}` : ""}`}
          className={cn("flex items-center gap-4 p-3", workflowRow)}
        >
          <CourseThumb course={{ id: e.courseId, ...e }} className="w-24 shrink-0 rounded-xl" iconClassName="size-6" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-zinc-900 dark:text-white">{e.title}</p>
            {e.instructorName && <p className="truncate text-xs text-zinc-500">by {e.instructorName}</p>}
            <div className="mt-2 flex items-center gap-3">
              <Progress value={e.progress} className="h-1.5" />
              <span className="w-9 text-right text-xs text-zinc-500">{e.progress}%</span>
            </div>
          </div>
          <Button size="icon" className="shrink-0" tabIndex={-1} aria-hidden>
            <Play className="fill-current" />
          </Button>
        </Link>
      ))}
    </div>
  )
}

// Icon in a tinted tile, like the workflow-card category icons
function Stat({ icon: Icon, label, value, tile }) {
  return (
    <div className={cn("flex items-center justify-between p-3", workflowRow)}>
      <span className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
        <span className={cn("rounded-lg p-1.5", tile)}>
          <Icon className="size-5" />
        </span>
        {label}
      </span>
      <span className="text-lg font-semibold tabular-nums text-zinc-900 dark:text-white">{value}</span>
    </div>
  )
}

function Panel({ title, description, className, children }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-4 p-4 sm:p-5", workflowSurface, className)}>
      <div>
        <h3 className="text-lg font-medium text-zinc-900 dark:text-white">{title}</h3>
        <p className="mt-0.5 text-xs text-zinc-500">{description}</p>
      </div>
      {children}
    </div>
  )
}

export default function ContinueLearning() {
  const isAuthed = useAuthStore((s) => !!s.accessToken)
  if (!isAuthed) return null
  return <ContinueLearningInner />
}

function ContinueLearningInner() {
  const { data, loading, error, reload } = useFetch(() => enrollmentService.mine(), [])
  const items = toList(data).map(normalizeEnrollment)
  const inProgress = items.filter((e) => e.progress < 100)
  const completed = items.length - inProgress.length

  return (
    <section id="my-learning" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="mb-8 flex items-end justify-between gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Continue learning</h2>
        {items.length > 0 && (
          <Button variant="link" asChild className="px-0"><Link to="/my-learning">See all</Link></Button>
        )}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="In progress" description="Pick up right where you left off." className="lg:col-span-2">
          {loading ? (
            <LoadingState className="py-8" />
          ) : error ? (
            <ErrorState error={error} onRetry={reload} className="py-8" />
          ) : inProgress.length === 0 ? (
            <EmptyState title={items.length ? "All caught up!" : "You haven’t enrolled in a course yet"} className="border-zinc-300 dark:border-zinc-700">
              <Link to="/courses" className="text-primary hover:underline">Browse courses</Link>
            </EmptyState>
          ) : (
            <EnrollmentList items={inProgress.slice(0, 3)} />
          )}
        </Panel>

        <Panel title="Your stats" description="Keep the momentum going.">
          <div className="grid gap-2.5">
            <Stat icon={GraduationCap} label="Enrolled" value={items.length} tile="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" />
            <Stat icon={BookOpen} label="In progress" value={inProgress.length} tile="bg-sky-500/20 text-cyan-600 dark:text-cyan-400" />
            <Stat icon={CheckCircle2} label="Completed" value={completed} tile="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400" />
          </div>
        </Panel>
      </div>
    </section>
  )
}
