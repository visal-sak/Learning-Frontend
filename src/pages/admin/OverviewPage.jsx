import { Link } from "react-router-dom"
import { MdBarChart } from "react-icons/md"
import { useShallow } from "zustand/react/shallow"
import { useTranslation } from "react-i18next"
import { PenSquare, Users, BookOpen, FilePen, ClipboardCheck, GraduationCap, FileText, ListChecks, Star, UserCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader, Stars } from "@/components/admin/AdminUI"
import { DataTable, Tag } from "@/components/admin/DataTable"
import { categoryTag } from "@/lib/tags"
import { HiUsers } from "react-icons/hi"
import { CourseThumb, EmptyState, ErrorState, LoadingState } from "@/components/course/CourseBits"
import { useFetch } from "@/hooks/useFetch"
import { useRoles } from "@/hooks/useRoles"
import { useAuthStore, selectDisplayUser } from "@/store"
import { reportService } from "@/services/report.service"
import { StatCard } from "@/components/StatCard"

const fmt = (n) => (n == null ? "—" : Number(n).toLocaleString())
const fmtRating = (n) => (n ? Number(n).toFixed(1) : "—")
const pct = (t, part, whole) => (whole ? t("admin.overview.ofTotal", { pct: Math.round((part / whole) * 100) }) : null)

function StatGrid({ children }) {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{children}</div>
}

function PlatformStats() {
  const { t } = useTranslation()
  const { data: s, loading, error, reload } = useFetch(() => reportService.platform(), [])
  if (loading) return <LoadingState variant="section" />
  if (error) return <ErrorState error={error} onRetry={reload} className="py-8" />
  const totalCourses = (s.publishedCourses ?? 0) + (s.draftCourses ?? 0) + (s.pendingReview ?? 0)
  return (
    <StatGrid>
      <StatCard icon={Users} tone="sky" label={t("admin.overview.platform.users")} subtitle={t("admin.overview.platform.usersHint")} value={fmt(s.totalUsers)} detail={t("admin.overview.platform.instructorsCount", { count: s.totalInstructors ?? 0, value: fmt(s.totalInstructors) })} />
      <StatCard icon={BookOpen} tone="green" label={t("admin.overview.platform.published")} subtitle={t("admin.overview.platform.publishedHint")} value={fmt(s.publishedCourses)} detail={pct(t, s.publishedCourses, totalCourses)} detailTone="up" />
      <StatCard icon={FilePen} tone="gray" label={t("admin.overview.platform.drafts")} subtitle={t("admin.overview.platform.draftsHint")} value={fmt(s.draftCourses)} />
      <StatCard
        icon={ClipboardCheck}
        tone="amber"
        label={t("admin.overview.platform.pending")}
        subtitle={t("admin.overview.platform.pendingHint")}
        value={fmt(s.pendingReview)}
        detail={s.pendingReview ? <Link to="/admin/review-queue" className="hover:underline">{t("admin.overview.platform.reviewNow")}</Link> : t("admin.overview.platform.allClear")}
        detailTone={s.pendingReview ? "down" : "up"}
      />
      <StatCard icon={GraduationCap} tone="violet" label={t("admin.overview.platform.enrollments")} subtitle={t("admin.overview.platform.enrollmentsHint")} value={fmt(s.totalEnrollments)} />
      <StatCard icon={FileText} tone="green" label={t("admin.overview.platform.lessons")} subtitle={t("admin.overview.platform.lessonsHint")} value={fmt(s.totalLessons)} />
      <StatCard icon={ListChecks} tone="pink" label={t("admin.overview.platform.quizAttempts")} subtitle={t("admin.overview.platform.quizAttemptsHint")} value={fmt(s.quizAttempts)} />
      <StatCard icon={Star} tone="yellow" label={t("admin.overview.platform.avgRating")} subtitle={t("admin.overview.platform.avgRatingHint")} value={fmtRating(s.averageRating)} detail={s.averageRating ? t("admin.overview.outOf5") : null} />
    </StatGrid>
  )
}

function TeachingStats() {
  const { t } = useTranslation()
  const { data: s, loading, error, reload } = useFetch(() => reportService.myTeaching(), [])
  if (loading) return <LoadingState variant="section" />
  if (error) return <ErrorState error={error} onRetry={reload} className="py-8" />
  return (
    <StatGrid>
      <StatCard icon={BookOpen} tone="green" label={t("admin.overview.teaching.myCourses")} subtitle={t("admin.overview.teaching.myCoursesHint")} value={fmt(s.myCourses)} detail={t("admin.overview.teaching.publishedCount", { count: s.myPublishedCourses ?? 0, value: fmt(s.myPublishedCourses) })} detailTone="up" />
      <StatCard icon={UserCheck} tone="violet" label={t("admin.overview.teaching.students")} subtitle={t("admin.overview.teaching.studentsHint")} value={fmt(s.myStudents)} />
      <StatCard icon={FileText} tone="sky" label={t("admin.overview.teaching.lessons")} subtitle={t("admin.overview.teaching.lessonsHint")} value={fmt(s.myLessons)} />
      <StatCard icon={Star} tone="yellow" label={t("admin.overview.teaching.avgRating")} subtitle={t("admin.overview.teaching.avgRatingHint")} value={fmtRating(s.myAverageRating)} detail={t("admin.overview.teaching.reviewsCount", { count: s.myReviewCount ?? 0, value: fmt(s.myReviewCount) })} />
    </StatGrid>
  )
}

// Rank tile + course thumbnail (on #f5f5f5) + title
const courseColumn = (t) => ({
  key: "title",
  label: t("admin.overview.columns.course"),
  render: (c, i) => (
    <Link to={`/courses/${c.courseId}`} className="group flex min-w-0 items-center gap-3">
      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
      <span className="block w-14 shrink-0 overflow-hidden rounded-md bg-[#f5f5f5] dark:bg-neutral-800">
        <CourseThumb
          course={{ id: c.courseId, thumbnailUrl: c.thumbnailUrl, title: c.title }}
          className="aspect-[16/10] object-contain p-1 mix-blend-multiply dark:mix-blend-normal"
          iconClassName="size-4"
        />
      </span>
      <span className="truncate font-semibold group-hover:text-primary group-hover:underline">{c.title}</span>
    </Link>
  ),
})

const initialsOf = (name = "") => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "?"

const instructorColumn = (t) => ({
  key: "instructorName",
  label: t("admin.overview.columns.instructor"),
  render: (c) =>
    c.instructorName ? (
      <span className="flex min-w-0 items-center gap-2">
        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-neutral-100 text-[10px] font-semibold text-muted-foreground dark:bg-neutral-800">
          {initialsOf(c.instructorName)}
        </span>
        <span className="truncate">{c.instructorName}</span>
      </span>
    ) : null,
})

const categoryColumn = (t) => ({
  key: "categoryName",
  label: t("admin.overview.columns.category"),
  render: (c) => (c.categoryName ? <Tag className={categoryTag(c.categoryName)}>{c.categoryName}</Tag> : null),
})

function TopTable({ title, description, load, columns }) {
  const { t } = useTranslation()
  const { data, loading, error, reload } = useFetch(load, [])
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-base font-bold tracking-tight">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {loading ? (
        <LoadingState variant="section" />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} className="py-6" />
      ) : !data?.length ? (
        <EmptyState icon={MdBarChart} title={t("admin.overview.noData")} className="py-8" />
      ) : (
        <DataTable columns={columns} rows={data} rowKey={(c) => c.courseId} />
      )}
    </section>
  )
}

export default function OverviewPage() {
  const { t } = useTranslation()
  const { isAdmin, isInstructor } = useRoles()
  const display = useAuthStore(useShallow(selectDisplayUser))

  return (
    <div className="space-y-10">
      <PageHeader title={display.name ? t("admin.overview.welcomeName", { name: display.name.split(" ")[0] }) : t("admin.overview.welcome")} description={t("admin.overview.description")}>
        <Button variant="outline" asChild><Link to="/admin/courses"><PenSquare /> {t("admin.overview.manageCourses")}</Link></Button>
      </PageHeader>

      {isAdmin && (
        <section className="space-y-3">
          <h2 className="text-base font-bold tracking-tight">{t("admin.overview.platformTitle")}</h2>
          <PlatformStats />
        </section>
      )}
      {(isInstructor || !isAdmin) && (
        <section className="space-y-3">
          <h2 className="text-base font-bold tracking-tight">{t("admin.overview.teachingTitle")}</h2>
          <TeachingStats />
        </section>
      )}

      <TopTable
        title={t("admin.overview.popular.title")}
        description={t("admin.overview.popular.description")}
        load={() => reportService.topCourses(5)}
        columns={[
          courseColumn(t),
          instructorColumn(t),
          categoryColumn(t),
          {
            key: "enrollmentCount",
            label: t("admin.overview.columns.students"),
            align: "right",
            nowrap: true,
            render: (c) => (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/12 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-sky-700 dark:bg-sky-500/20 dark:text-sky-300">
                <HiUsers className="size-3.5" /> {fmt(c.enrollmentCount)}
              </span>
            ),
          },
        ]}
      />
      <TopTable
        title={t("admin.overview.topRated.title")}
        description={t("admin.overview.topRated.description")}
        load={() => reportService.topRated(5)}
        columns={[
          courseColumn(t),
          instructorColumn(t),
          {
            key: "averageRating",
            label: t("admin.overview.columns.rating"),
            render: (c) => (
              <span className="flex items-center gap-2">
                <Stars value={c.averageRating} size="size-3" />
                <span className="text-xs tabular-nums text-muted-foreground">{fmtRating(c.averageRating)}</span>
              </span>
            ),
          },
          { key: "reviewCount", label: t("admin.overview.columns.reviews"), align: "right", render: (c) => <span className="tabular-nums">{fmt(c.reviewCount)}</span> },
        ]}
      />
    </div>
  )
}
