import { useState } from "react"
import { Link, NavLink, Outlet, useParams } from "react-router-dom"
import { ArrowLeft, Eye, Send, Globe, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ErrorState, LoadingState, StatusBadge } from "@/components/course/CourseBits"
import { FormError } from "@/components/auth/FormField"
import { useFetch } from "@/hooks/useFetch"
import { useRoles } from "@/hooks/useRoles"
import { courseService } from "@/services/course.service"
import { getErrorMessage } from "@/lib/api"
import { cn } from "@/lib/utils"
import { motion } from "motion/react"

const tabs = [
  { to: "", label: "Details", end: true },
  { to: "curriculum", label: "Curriculum" },
  { to: "quiz", label: "Quiz" },
  { to: "students", label: "Students" },
  { to: "reviews", label: "Reviews" },
]


export default function CourseEditorLayout() {
  const { id } = useParams()
  const { isAdmin } = useRoles()
  const { data: course, loading, error, reload } = useFetch(() => courseService.get(id), [id])
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState("")

  if (loading && !course) return <LoadingState />
  if (error) return <ErrorState error={error} onRetry={reload} />

  const setStatus = async (status, note) => {
    setActionError("")
    setBusy(true)
    try {
      await courseService.changeStatus(id, status, note)
      reload()
    } catch (err) {
      setActionError(getErrorMessage(err, "Couldn’t change status"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin/courses" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> My courses
        </Link>
        <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <h1 className="truncate text-2xl font-semibold tracking-tight">{course.title}</h1>
            <StatusBadge status={course.status} />
          </div>
          <div className="flex flex-wrap gap-2">
            {busy && <Loader2 className="m-2 size-4 animate-spin text-muted-foreground" />}
            {!isAdmin && (course.status === "DRAFT" || course.status === "REJECTED") && (
              <Button size="sm" disabled={busy} onClick={() => setStatus("PENDING_REVIEW", "Ready for review")}><Send /> Submit for review</Button>
            )}
            {isAdmin && course.status !== "PUBLISHED" && (
              <Button size="sm" disabled={busy} onClick={() => setStatus("PUBLISHED", "Published by admin")}><Globe /> Publish</Button>
            )}
            {course.status === "PUBLISHED" && (
              <Button size="sm" variant="outline" disabled={busy} onClick={() => setStatus("DRAFT", "Unpublished")}>Unpublish</Button>
            )}
            <Button size="sm" variant="outline" asChild><Link to={`/courses/${course.id}`}><Eye /> View</Link></Button>
          </div>
        </div>
        {course.reviewNote && (
          <p className="mt-3 rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Reviewer note:</span> {course.reviewNote}
          </p>
        )}
        <FormError message={actionError} />
      </div>

      {/* Segmented tabs: the active pill slides between tabs; scrolls sideways on small screens (no scrollbar) */}
      <nav className="-mx-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="inline-flex items-center gap-1 rounded-xl bg-muted p-1">
          {tabs.map((t) => (
            <NavLink
              key={t.label}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                cn(
                  "relative shrink-0 rounded-lg px-3.5 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50",
                  isActive && "text-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="course-editor-tab"
                      className="absolute inset-0 rounded-lg bg-background shadow-sm"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="relative">{t.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <Outlet context={{ course, reload }} />
    </div>
  )
}
