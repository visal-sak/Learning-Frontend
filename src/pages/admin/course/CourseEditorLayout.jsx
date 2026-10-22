import { Suspense, useState } from "react"
import { WiDirectionLeft } from "react-icons/wi"
import { Link, NavLink, Outlet, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Send, Globe, Loader2, EyeOff } from "lucide-react"
import { IoEye } from "react-icons/io5"
import { IoBook } from "react-icons/io5"
import { MdAccessTimeFilled } from "react-icons/md"
import { FaChartBar } from "react-icons/fa"
import { TbMessageReport } from "react-icons/tb"
import { Button } from "@/components/ui/button"
import { CourseThumb, ErrorState, LoadingState, StatusBadge } from "@/components/course/CourseBits"
import { FormError } from "@/components/auth/FormField"
import { useFetch } from "@/hooks/useFetch"
import { useRoles } from "@/hooks/useRoles"
import { courseService } from "@/services/course.service"
import { getErrorMessage } from "@/lib/api"
import { levelLabel } from "@/lib/constants"
import { formatMinutes } from "@/lib/format"
import { categoryTag } from "@/lib/tags"
import { cn } from "@/lib/utils"
import { motion } from "motion/react"

// `key` → admin.courseEditor.tabs.<key> (translated at render time)
const tabs = [
  { to: "", key: "details", end: true },
  { to: "curriculum", key: "curriculum" },
  { to: "quiz", key: "quiz" },
  { to: "students", key: "students" },
  { to: "reviews", key: "reviews" },
]

const CARD = "rounded-2xl border border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-900"

export default function CourseEditorLayout() {
  const { t } = useTranslation()
  const { id } = useParams()
  const { isAdmin } = useRoles()
  const { data: course, loading, error, reload } = useFetch(() => courseService.get(id), [id])
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState("")

  if (loading && !course) return <LoadingState title={t("admin.courseEditor.loading")} />
  if (error) return <ErrorState error={error} onRetry={reload} />

  const setStatus = async (status, note) => {
    setActionError("")
    setBusy(true)
    try {
      await courseService.changeStatus(id, status, note)
      reload()
    } catch (err) {
      setActionError(getErrorMessage(err, t("admin.courseEditor.statusFailed")))
    } finally {
      setBusy(false)
    }
  }

  const rejected = course.status === "REJECTED"

  return (
    <div className="space-y-5">
      <Button variant="bordered" size="sm" asChild>
        <Link to="/admin/courses"><WiDirectionLeft className="size-5" /> {t("admin.nav.myCourses")}</Link>
      </Button>

      {/* Course header: thumbnail, title + status, facts, actions */}
      <section className={cn(CARD, "flex flex-col gap-5 p-4 sm:flex-row sm:items-center sm:p-5")}>
        <span className="block w-full shrink-0 overflow-hidden rounded-xl bg-[#f5f5f5] sm:w-40 dark:bg-neutral-800">
          <CourseThumb course={course} className="aspect-[16/10] object-contain p-3 mix-blend-multiply dark:mix-blend-normal" iconClassName="size-8" />
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {course.categoryName && (
              <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", categoryTag(course.categoryName))}>{course.categoryName}</span>
            )}
            <StatusBadge status={course.status} />
          </div>
          <h1 className="truncate text-2xl font-bold tracking-tight">{course.title}</h1>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {course.level && <span className="flex items-center gap-1.5"><FaChartBar className="size-3.5" /> {t(`admin.levels.${course.level}`, { defaultValue: levelLabel(course.level) })}</span>}
            <span className="flex items-center gap-1.5"><IoBook className="size-3.5" /> {t("admin.courses.lessonCount", { count: course.lessonCount ?? 0 })}</span>
            <span className="flex items-center gap-1.5"><MdAccessTimeFilled className="size-4" /> {formatMinutes(course.totalMinutes)}</span>
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-stretch">
          {!isAdmin && (course.status === "DRAFT" || rejected) && (
            <Button size="lg" disabled={busy} onClick={() => setStatus("PENDING_REVIEW", "Ready for review")}>
              {busy ? <Loader2 className="animate-spin" /> : <Send />} {t("admin.courses.submitForReview")}
            </Button>
          )}
          {isAdmin && course.status !== "PUBLISHED" && (
            <Button size="lg" disabled={busy} onClick={() => setStatus("PUBLISHED", "Published by admin")}>
              {busy ? <Loader2 className="animate-spin" /> : <Globe />} {t("admin.courses.publish")}
            </Button>
          )}
          {course.status === "PUBLISHED" && (
            <Button size="lg" variant="bordered" disabled={busy} onClick={() => setStatus("DRAFT", "Unpublished")}>
              {busy ? <Loader2 className="animate-spin" /> : <EyeOff />} {t("admin.courseEditor.unpublish")}
            </Button>
          )}
          <Button size="lg" variant="bordered" asChild>
            <Link to={`/courses/${course.id}`}><IoEye className="size-4" /> {t("admin.courses.viewOnSite")}</Link>
          </Button>
        </div>
      </section>

      {/* Reviewer note: red when the course was rejected, neutral otherwise */}
      {course.reviewNote && (
        <div
          className={cn(
            "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
            rejected
              ? "border-rose-500/30 bg-rose-500/8 text-rose-900 dark:bg-rose-500/10 dark:text-rose-200"
              : "border-sky-500/25 bg-sky-500/8 text-sky-900 dark:bg-sky-500/10 dark:text-sky-200"
          )}
        >
          <TbMessageReport className="mt-0.5 size-5 shrink-0" />
          <p>
            <span className="font-semibold">{t("admin.courseEditor.reviewerNote")} · </span>
            {course.reviewNote}
          </p>
        </div>
      )}
      <FormError message={actionError} />

      {/* Tabs: the active pill slides between tabs; scrolls sideways on small screens (no scrollbar) */}
      <nav className="-mx-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="inline-flex items-center gap-1 rounded-xl border border-neutral-200/80 bg-neutral-100/70 p-1 dark:border-neutral-800 dark:bg-neutral-900">
          {tabs.map((tab) => (
            <NavLink
              key={tab.key}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                cn(
                  "relative shrink-0 rounded-lg px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50",
                  isActive && "text-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="course-editor-tab"
                      className="absolute inset-0 rounded-lg bg-white shadow-sm dark:bg-neutral-800"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="relative">{t(`admin.courseEditor.tabs.${tab.key}`)}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Switching tabs loads only the tab, the course header stays */}
      <Suspense fallback={<LoadingState />}>
        <Outlet context={{ course, reload }} />
      </Suspense>
    </div>
  )
}
