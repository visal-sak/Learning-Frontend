import { Link } from "react-router-dom"
import { useShallow } from "zustand/react/shallow"
import { PenSquare, Users, BookOpen, FilePen, ClipboardCheck, GraduationCap, FileText, ListChecks, Star, UserCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader, Stars } from "@/components/admin/AdminUI"
import { BeamTable } from "@/components/admin/BeamTable"
import { CourseThumb, EmptyState, ErrorState, LoadingState } from "@/components/course/CourseBits"
import { useFetch } from "@/hooks/useFetch"
import { useRoles } from "@/hooks/useRoles"
import { useAuthStore, selectDisplayUser } from "@/store"
import { reportService } from "@/services/report.service"
import { cn } from "@/lib/utils"

const fmt = (n) => (n == null ? "—" : Number(n).toLocaleString())
const fmtRating = (n) => (n ? Number(n).toFixed(1) : "—")
const pct = (part, whole) => (whole ? `${Math.round((part / whole) * 100)}% of total` : null)

// Stat card in the review-card style: icon "avatar" + name/subtitle header, big value, detail line
const tones = {
  green: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  sky: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  violet: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  amber: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  pink: "bg-pink-500/15 text-pink-600 dark:text-pink-400",
  yellow: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
  gray: "bg-muted text-muted-foreground",
}

function StatCard({ icon: Icon, label, subtitle, value, detail, detailTone = "muted", tone = "gray" }) {
  return (
    <article className="glass flex flex-col gap-3 rounded-2xl p-5 text-card-foreground">
      <header className="flex items-center gap-3">
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-full", tones[tone])}>
          <Icon className="size-[18px]" />
        </span>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[15px] font-bold">{label}</p>
          {subtitle && <p className="truncate text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </header>
      <p className="text-3xl font-semibold tabular-nums tracking-tight">{value ?? "—"}</p>
      {detail && (
        <p className={cn("text-xs", detailTone === "down" ? "text-red-500" : detailTone === "up" ? "text-emerald-500" : "text-muted-foreground")}>
          {detail}
        </p>
      )}
    </article>
  )
}

function StatGrid({ children }) {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{children}</div>
}

function PlatformStats() {
  const { data: s, loading, error, reload } = useFetch(() => reportService.platform(), [])
  if (loading) return <LoadingState className="py-8" />
  if (error) return <ErrorState error={error} onRetry={reload} className="py-8" />
  const totalCourses = (s.publishedCourses ?? 0) + (s.draftCourses ?? 0) + (s.pendingReview ?? 0)
  return (
    <StatGrid>
      <StatCard icon={Users} tone="sky" label="Users" subtitle="Registered accounts" value={fmt(s.totalUsers)} detail={`${fmt(s.totalInstructors)} instructors`} />
      <StatCard icon={BookOpen} tone="green" label="Published courses" subtitle="Live in the catalogue" value={fmt(s.publishedCourses)} detail={pct(s.publishedCourses, totalCourses)} detailTone="up" />
      <StatCard icon={FilePen} tone="gray" label="Drafts" subtitle="Not yet submitted" value={fmt(s.draftCourses)} />
      <StatCard
        icon={ClipboardCheck}
        tone="amber"
        label="Pending review"
        subtitle="Waiting for approval"
        value={fmt(s.pendingReview)}
        detail={s.pendingReview ? <Link to="/admin/review-queue" className="hover:underline">Review now →</Link> : "All clear"}
        detailTone={s.pendingReview ? "down" : "up"}
      />
      <StatCard icon={GraduationCap} tone="violet" label="Enrollments" subtitle="All courses" value={fmt(s.totalEnrollments)} />
      <StatCard icon={FileText} tone="green" label="Lessons" subtitle="Across all courses" value={fmt(s.totalLessons)} />
      <StatCard icon={ListChecks} tone="pink" label="Quiz attempts" subtitle="Submitted by students" value={fmt(s.quizAttempts)} />
      <StatCard icon={Star} tone="yellow" label="Average rating" subtitle="From student reviews" value={fmtRating(s.averageRating)} detail={s.averageRating ? "out of 5" : null} />
    </StatGrid>
  )
}

function TeachingStats() {
  const { data: s, loading, error, reload } = useFetch(() => reportService.myTeaching(), [])
  if (loading) return <LoadingState className="py-8" />
  if (error) return <ErrorState error={error} onRetry={reload} className="py-8" />
  return (
    <StatGrid>
      <StatCard icon={BookOpen} tone="green" label="My courses" subtitle="Created by you" value={fmt(s.myCourses)} detail={`${fmt(s.myPublishedCourses)} published`} detailTone="up" />
      <StatCard icon={UserCheck} tone="violet" label="Students" subtitle="Enrolled in your courses" value={fmt(s.myStudents)} />
      <StatCard icon={FileText} tone="sky" label="Lessons" subtitle="You’ve published" value={fmt(s.myLessons)} />
      <StatCard icon={Star} tone="yellow" label="Average rating" subtitle="Your courses" value={fmtRating(s.myAverageRating)} detail={`${fmt(s.myReviewCount)} reviews`} />
    </StatGrid>
  )
}

const courseColumn = {
  key: "title",
  label: "Course",
  render: (c) => (
    <Link to={`/courses/${c.courseId}`} className="flex min-w-0 items-center gap-3 hover:text-primary">
      <CourseThumb course={{ id: c.courseId, thumbnailUrl: c.thumbnailUrl, title: c.title }} className="w-10 shrink-0 rounded" iconClassName="size-3" />
      <span className="truncate font-medium">{c.title}</span>
    </Link>
  ),
}

function TopTable({ title, description, load, columns }) {
  const { data, loading, error, reload } = useFetch(load, [])
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {loading ? (
        <LoadingState className="py-6" />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} className="py-6" />
      ) : !data?.length ? (
        <EmptyState title="No data yet" className="py-8" />
      ) : (
        <BeamTable columns={columns} rows={data} rowKey={(c) => c.courseId} />
      )}
    </section>
  )
}

export default function OverviewPage() {
  const { isAdmin, isInstructor } = useRoles()
  const display = useAuthStore(useShallow(selectDisplayUser))

  return (
    <div className="space-y-10">
      <PageHeader title={`Welcome back${display.name ? `, ${display.name.split(" ")[0]}` : ""}`} description="Here’s what’s happening across your courses.">
        <Button variant="outline" asChild><Link to="/admin/courses"><PenSquare /> Manage courses</Link></Button>
      </PageHeader>

      {isAdmin && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Platform</h2>
          <PlatformStats />
        </section>
      )}
      {(isInstructor || !isAdmin) && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">My teaching</h2>
          <TeachingStats />
        </section>
      )}

      <TopTable
        title="Most popular"
        description="Courses with the most enrollments"
        load={() => reportService.topCourses(5)}
        columns={[
          courseColumn,
          { key: "instructorName", label: "Instructor" },
          { key: "categoryName", label: "Category" },
          { key: "enrollmentCount", label: "Students", align: "right", render: (c) => <span className="tabular-nums">{fmt(c.enrollmentCount)}</span> },
        ]}
      />
      <TopTable
        title="Top rated"
        description="Highest average rating from students"
        load={() => reportService.topRated(5)}
        columns={[
          courseColumn,
          { key: "instructorName", label: "Instructor" },
          {
            key: "averageRating",
            label: "Rating",
            render: (c) => (
              <span className="flex items-center gap-2">
                <Stars value={c.averageRating} size="size-3" />
                <span className="text-xs tabular-nums text-muted-foreground">{fmtRating(c.averageRating)}</span>
              </span>
            ),
          },
          { key: "reviewCount", label: "Reviews", align: "right", render: (c) => <span className="tabular-nums">{fmt(c.reviewCount)}</span> },
        ]}
      />
    </div>
  )
}
