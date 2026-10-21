import { useState } from "react"
import { Link } from "react-router-dom"
import { Plus, Pencil, Send, Trash2, Eye, Loader2, Globe, Archive, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/admin/AdminUI"
import { CourseThumb, EmptyState, ErrorState, LoadingState, StatusBadge } from "@/components/course/CourseBits"
import { FormError } from "@/components/auth/FormField"
import { useFetch } from "@/hooks/useFetch"
import { useRoles } from "@/hooks/useRoles"
import { courseService } from "@/services/course.service"
import { getErrorMessage } from "@/lib/api"
import { COURSE_STATUS, levelLabel } from "@/lib/constants"
import { formatMinutes } from "@/lib/format"
import { cn } from "@/lib/utils"
import { confirm } from "@/store/confirm.store"
import { toast } from "@/lib/toast"

export default function CoursesPage() {
  const { isAdmin } = useRoles()
  const { data, loading, error, reload } = useFetch(() => courseService.mine(), [])
  const all = data ?? []
  const [filter, setFilter] = useState("ALL")
  const [busyId, setBusyId] = useState(null)
  const [actionError, setActionError] = useState("")
  const courses = filter === "ALL" ? all : all.filter((c) => c.status === filter)
  const counts = all.reduce((m, c) => ({ ...m, [c.status]: (m[c.status] ?? 0) + 1 }), {})

  const run = async (id, fn, successMsg) => {
    setActionError("")
    setBusyId(id)
    try {
      await fn()
      reload()
      if (successMsg) toast.success(successMsg)
    } catch (err) {
      setActionError(getErrorMessage(err, "Action failed"))
      toast.error("Action failed", err)
    } finally {
      setBusyId(null)
    }
  }

  const statusToast = { PUBLISHED: "Course published", PENDING_REVIEW: "Submitted for review", ARCHIVED: "Course archived", DRAFT: "Moved back to draft" }
  const setStatus = (c, status, note) => run(c.id, () => courseService.changeStatus(c.id, status, note), statusToast[status])
  const onDelete = async (c) => {
    const ok = await confirm({
      title: `Delete “${c.title}”?`,
      description: "This can’t be undone.",
      body: "The course, its sections, lessons and quiz will be permanently removed, and enrolled students will lose access.",
      confirmLabel: "Delete course",
    })
    if (ok) run(c.id, () => courseService.remove(c.id), "Course deleted")
  }

  return (
    <>
      <PageHeader title="My courses" description="Create, edit and publish the courses you teach.">
        <Button asChild variant="solid" className="border-foreground bg-foreground text-background hover:bg-foreground/85">
          <Link to="/admin/courses/new"><Plus /> New course</Link>
        </Button>
      </PageHeader>

      <div className="mb-4 flex gap-1 overflow-x-auto rounded-lg bg-muted p-[3px] sm:w-fit">
        {["ALL", ...Object.keys(COURSE_STATUS)].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "shrink-0 rounded-md px-3 py-1 text-sm font-medium text-muted-foreground transition-colors",
              filter === s && "bg-background text-foreground shadow-sm"
            )}
          >
            {s === "ALL" ? "All" : COURSE_STATUS[s].label}
            <span className="ml-1.5 text-xs opacity-60">{s === "ALL" ? all.length : counts[s] ?? 0}</span>
          </button>
        ))}
      </div>

      <FormError message={actionError} />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : courses.length === 0 ? (
        <EmptyState title={all.length ? "No courses with this status" : "No courses yet"}>
          {!all.length && <Link to="/admin/courses/new" className="text-primary hover:underline">Create your first course</Link>}
        </EmptyState>
      ) : (
        <div className="mt-4 divide-y rounded-xl border glass">
          {courses.map((c) => {
            const busy = busyId === c.id
            return (
              <div key={c.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <Link to={`/admin/courses/${c.id}`} className="shrink-0">
                  <CourseThumb course={c} className="w-full rounded-md sm:w-32" iconClassName="size-6" />
                </Link>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/admin/courses/${c.id}`} className="truncate font-medium hover:underline">{c.title}</Link>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {[c.categoryName, levelLabel(c.level), `${c.lessonCount ?? 0} lessons`, formatMinutes(c.totalMinutes)].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {busy && <Loader2 className="m-2 size-4 animate-spin text-muted-foreground" />}
                  {!isAdmin && (c.status === "DRAFT" || c.status === "REJECTED") && (
                    <Button size="sm" variant="secondary" disabled={busy} onClick={() => setStatus(c, "PENDING_REVIEW", "Ready for review")}>
                      <Send /> Submit for review
                    </Button>
                  )}
                  {isAdmin && c.status !== "PUBLISHED" && (
                    <Button size="sm" variant="secondary" disabled={busy} onClick={() => setStatus(c, "PUBLISHED", "Published by admin")}>
                      <Globe /> Publish
                    </Button>
                  )}
                  {c.status === "PUBLISHED" && (
                    <Button size="icon" variant="ghost" disabled={busy} onClick={() => setStatus(c, "ARCHIVED", "Archived")} aria-label="Archive" title="Archive">
                      <Archive />
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" asChild aria-label="Students" title="Students">
                    <Link to={`/admin/courses/${c.id}/students`}><Users /></Link>
                  </Button>
                  <Button size="icon" variant="ghost" asChild aria-label="View" title="View on site">
                    <Link to={`/courses/${c.id}`}><Eye /></Link>
                  </Button>
                  <Button size="icon" variant="ghost" asChild aria-label="Edit" title="Edit">
                    <Link to={`/admin/courses/${c.id}`}><Pencil /></Link>
                  </Button>
                  <Button size="icon" variant="ghost" disabled={busy} onClick={() => onDelete(c)} aria-label="Delete" title="Delete" className="text-destructive hover:text-destructive">
                    <Trash2 />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
