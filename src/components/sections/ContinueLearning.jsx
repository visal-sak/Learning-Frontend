import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import { IoIosPlayCircle } from "react-icons/io"
import { IoBook } from "react-icons/io5"
import { MdWorkspacePremium, MdSchool } from "react-icons/md"
import { HiAcademicCap } from "react-icons/hi"
import { RiCheckboxCircleFill } from "react-icons/ri"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { CourseThumb, EmptyState, ErrorState, LoadingState } from "@/components/course/CourseBits"
import { useAuthStore } from "@/store"
import { useFetch } from "@/hooks/useFetch"
import { enrollmentService, toList } from "@/services/course.service"
import { certificateService } from "@/services/certificate.service"
import { normalizeEnrollment } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"

const CARD = "rounded-2xl border border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-900"

export default function ContinueLearning() {
  const isAuthed = useAuthStore((s) => !!s.accessToken)
  if (!isAuthed) return null
  return <ContinueLearningInner />
}

function ContinueLearningInner() {
  const { data, loading, error, reload } = useFetch(() => enrollmentService.mine(), [])
  const certs = useFetch(() => certificateService.mine(), [])
  const { t } = useTranslation()
  const items = toList(data).map(normalizeEnrollment)
  const isDone = (e) => e.status === "COMPLETED" || e.progress >= 100
  const inProgress = items.filter((e) => !isDone(e))
  const completed = items.length - inProgress.length
  const overall = items.length ? Math.round(items.reduce((n, e) => n + e.progress, 0) / items.length) : 0

  return (
    <section id="my-learning" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t("site.home.continue.title")}</h2>
          <p className="mt-1 text-muted-foreground">{t("site.home.continue.subtitle")}</p>
        </div>
        {items.length > 0 && (
          <Button variant="bordered" asChild>
            <Link to="/my-learning">{t("common.actions.seeAll")} <ArrowRight /></Link>
          </Button>
        )}
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-3">
        {/* In-progress courses */}
        <div className={cn(CARD, "overflow-hidden lg:col-span-2")}>
          <div className="flex items-center justify-between border-b border-neutral-200/80 px-5 py-4 dark:border-neutral-800">
            <div>
              <h3 className="text-[15px] font-bold">{t("site.home.continue.inProgress")}</h3>
              <p className="text-xs text-muted-foreground">{t("site.home.continue.inProgressSub")}</p>
            </div>
            {inProgress.length > 0 && (
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">{t("site.home.continue.active", { count: inProgress.length })}</span>
            )}
          </div>
          {loading ? (
            <LoadingState variant="section" />
          ) : error ? (
            <ErrorState error={error} onRetry={reload} className="py-8" />
          ) : inProgress.length === 0 ? (
            <EmptyState icon={MdSchool} title={items.length ? t("site.home.continue.allCaughtUp") : t("site.shared.notEnrolled")} className="m-5">
              <Link to="/courses" className="text-primary hover:underline">{t("site.shared.browseCourses")}</Link>
            </EmptyState>
          ) : (
            <ul className="divide-y divide-neutral-200/80 dark:divide-neutral-800">
              {inProgress.slice(0, 3).map((e) => (
                <CourseRow key={e.courseId} item={e} />
              ))}
            </ul>
          )}
        </div>

        {/* Stats */}
        <div className={cn(CARD, "p-5")}>
          <h3 className="text-[15px] font-bold">{t("site.home.continue.progressTitle")}</h3>
          <p className="text-xs text-muted-foreground">{t("site.home.continue.progressSub")}</p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Stat to="/my-learning" icon={HiAcademicCap} tone="bg-violet-500/12 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300" label={t("site.home.continue.stats.enrolled")} value={items.length} />
            <Stat to="/my-learning" icon={IoBook} tone="bg-sky-500/12 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300" label={t("site.home.continue.stats.inProgress")} value={inProgress.length} />
            <Stat to="/my-learning?tab=completed" icon={RiCheckboxCircleFill} tone="bg-emerald-500/12 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300" label={t("site.home.continue.stats.completed")} value={completed} />
            <Stat to="/my-learning?tab=certificates" icon={MdWorkspacePremium} tone="bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300" label={t("site.home.continue.stats.certificates")} value={certs.data?.length ?? 0} />
          </div>

          {items.length > 0 && (
            <div className="mt-5 border-t border-neutral-200/80 pt-4 dark:border-neutral-800">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-medium text-muted-foreground">{t("site.home.continue.overall")}</span>
                <span className="font-semibold tabular-nums">{overall}%</span>
              </div>
              <Progress value={overall} className="h-2" />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function CourseRow({ item: e }) {
  const { t } = useTranslation()
  const learnPath = `/courses/${e.courseId}/learn${e.nextLessonId ? `/${e.nextLessonId}` : ""}`
  return (
    <li className="flex items-center gap-4 p-4 transition-colors hover:bg-neutral-50/70 sm:px-5 dark:hover:bg-neutral-800/30">
      <Link to={`/courses/${e.courseId}`} className="block w-24 shrink-0 overflow-hidden rounded-xl bg-[#f5f5f5] sm:w-28 dark:bg-neutral-800">
        <CourseThumb course={{ id: e.courseId, ...e }} className="aspect-[16/10] object-contain p-2 mix-blend-multiply dark:mix-blend-normal" iconClassName="size-6" />
      </Link>
      <div className="min-w-0 flex-1">
        <Link to={`/courses/${e.courseId}`} className="block truncate font-semibold hover:text-primary hover:underline">{e.title}</Link>
        {e.instructorName && <p className="truncate text-xs text-muted-foreground">{t("site.shared.by", { name: e.instructorName })}</p>}
        <div className="mt-2.5 flex items-center gap-3">
          <Progress value={e.progress} className="h-1.5" />
          <span className="w-9 shrink-0 text-right text-xs font-semibold tabular-nums">{e.progress}%</span>
        </div>
        {e.totalLessons != null && (
          <p className="mt-1 text-[11px] text-muted-foreground">{t("site.shared.lessonsProgress", { done: e.completedLessons ?? 0, total: e.totalLessons })}</p>
        )}
      </div>
      <Button asChild className="hidden shrink-0 sm:inline-flex">
        <Link to={learnPath}><IoIosPlayCircle className="size-4" /> {t("common.actions.continue")}</Link>
      </Button>
      <Button asChild size="icon" className="shrink-0 sm:hidden" aria-label={t("common.actions.continue")}>
        <Link to={learnPath}><IoIosPlayCircle className="size-4" /></Link>
      </Button>
    </li>
  )
}

function Stat({ to, icon: Icon, tone, label, value }) {
  return (
    <Link
      to={to}
      className="group rounded-xl border border-neutral-200/80 bg-neutral-50 p-3.5 transition-colors hover:border-neutral-300 hover:bg-white dark:border-neutral-800 dark:bg-neutral-800/40 dark:hover:bg-neutral-800"
    >
      <span className={cn("grid size-9 place-items-center rounded-lg", tone)}>
        <Icon className="size-5" />
      </span>
      <p className="mt-3 text-2xl font-bold leading-none tabular-nums">{value}</p>
      <p className="mt-1 text-xs font-medium text-muted-foreground">{label}</p>
    </Link>
  )
}
