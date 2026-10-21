import { Link } from "react-router-dom"
import { useShallow } from "zustand/react/shallow"
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
const pct = (part, whole) => (whole ? `${Math.round((part / whole) * 100)}% of total` : null)

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

// Rank tile + course thumbnail (on #f5f5f5) + title
const courseColumn = {
  key: "title",
  label: "Course",
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
}

const initialsOf = (name = "") => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "?"

const instructorColumn = {
  key: "instructorName",
  label: "Instructor",
  render: (c) =>
    c.instructorName ? (
      <span className="flex min-w-0 items-center gap-2">
        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-neutral-100 text-[10px] font-semibold text-muted-foreground dark:bg-neutral-800">
          {initialsOf(c.instructorName)}
        </span>
        <span className="truncate">{c.instructorName}</span>
      </span>
    ) : null,
}

const categoryColumn = {
  key: "categoryName",
  label: "Category",
  render: (c) => (c.categoryName ? <Tag className={categoryTag(c.categoryName)}>{c.categoryName}</Tag> : null),
}

function TopTable({ title, description, load, columns }) {
  const { data, loading, error, reload } = useFetch(load, [])
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-base font-bold tracking-tight">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {loading ? (
        <LoadingState className="py-6" />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} className="py-6" />
      ) : !data?.length ? (
        <EmptyState title="No data yet" className="py-8" />
      ) : (
        <DataTable columns={columns} rows={data} rowKey={(c) => c.courseId} />
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
          <h2 className="text-base font-bold tracking-tight">Platform</h2>
          <PlatformStats />
        </section>
      )}
      {(isInstructor || !isAdmin) && (
        <section className="space-y-3">
          <h2 className="text-base font-bold tracking-tight">My teaching</h2>
          <TeachingStats />
        </section>
      )}

      <TopTable
        title="Most popular"
        description="Courses with the most enrollments"
        load={() => reportService.topCourses(5)}
        columns={[
          courseColumn,
          instructorColumn,
          categoryColumn,
          {
            key: "enrollmentCount",
            label: "Students",
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
        title="Top rated"
        description="Highest average rating from students"
        load={() => reportService.topRated(5)}
        columns={[
          courseColumn,
          instructorColumn,
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
