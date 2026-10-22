import { useState } from "react"
import { MdFactCheck } from "react-icons/md"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Check, X, Eye, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/admin/AdminUI"
import { CourseThumb, EmptyState, ErrorState, LoadingState } from "@/components/course/CourseBits"
import { FormError } from "@/components/auth/FormField"
import { useFetch } from "@/hooks/useFetch"
import { courseService } from "@/services/course.service"
import { getErrorMessage } from "@/lib/api"
import { levelLabel } from "@/lib/constants"
import { formatMinutes } from "@/lib/format"

export default function ReviewQueuePage() {
  const { t } = useTranslation()
  const { data, loading, error, reload } = useFetch(() => courseService.pendingReview(), [])
  const courses = data ?? []

  return (
    <>
      <PageHeader title={t("admin.reviewQueue.title")} description={t("admin.reviewQueue.description")} />
      {loading && !data ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : courses.length === 0 ? (
        <EmptyState icon={MdFactCheck} title={t("admin.reviewQueue.empty")}>{t("admin.reviewQueue.emptyHint")}</EmptyState>
      ) : (
        <div className="divide-y rounded-xl border glass">
          {courses.map((c) => <ReviewRow key={c.id} course={c} onDone={reload} />)}
        </div>
      )}
    </>
  )
}

function ReviewRow({ course, onDone }) {
  const { t } = useTranslation()
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState("")

  const decide = async (status) => {
    if (status === "REJECTED" && !note.trim()) return setError(t("admin.reviewQueue.noteRequired"))
    setError("")
    setBusy(status)
    try {
      await courseService.changeStatus(course.id, status, note.trim() || "Approved")
      onDone()
    } catch (err) {
      setError(getErrorMessage(err, t("admin.reviewQueue.updateFailed")))
      setBusy(null)
    }
  }

  return (
    <div className="space-y-3 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <CourseThumb course={course} className="w-full shrink-0 rounded-md sm:w-32" iconClassName="size-6" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium">{course.title}</h3>
          {course.summary && <p className="truncate text-sm text-muted-foreground">{course.summary}</p>}
          <p className="text-xs text-muted-foreground">
            {[course.instructorName && t("admin.reviewQueue.byInstructor", { name: course.instructorName }), course.categoryName, course.level && t(`admin.levels.${course.level}`, { defaultValue: levelLabel(course.level) }), t("admin.courses.lessonCount", { count: course.lessonCount ?? 0 }), formatMinutes(course.totalMinutes)]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <Button size="sm" variant="outline" asChild><Link to={`/courses/${course.id}`}><Eye /> {t("admin.reviewQueue.preview")}</Link></Button>
      </div>
      <FormError message={error} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("admin.reviewQueue.notePlaceholder")} maxLength={500} />
        <div className="flex gap-2">
          <Button size="sm" className="h-9" disabled={!!busy} onClick={() => decide("PUBLISHED")}>
            {busy === "PUBLISHED" ? <Loader2 className="animate-spin" /> : <Check />} {t("admin.reviewQueue.approve")}
          </Button>
          <Button size="sm" variant="outline" className="h-9 text-destructive hover:text-destructive" disabled={!!busy} onClick={() => decide("REJECTED")}>
            {busy === "REJECTED" ? <Loader2 className="animate-spin" /> : <X />} {t("admin.reviewQueue.reject")}
          </Button>
        </div>
      </div>
    </div>
  )
}
