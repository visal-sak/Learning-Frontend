import { useState } from "react"
import { Search, UserMinus, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FormError } from "@/components/auth/FormField"
import { EmptyState, ErrorState, LoadingState } from "@/components/course/CourseBits"
import { useCourse } from "./useCourse"
import { useFetch } from "@/hooks/useFetch"
import { enrollmentService } from "@/services/enrollment.service"
import { getErrorMessage } from "@/lib/api"
import { formatDate } from "@/lib/format"
import { confirm } from "@/store/confirm.store"
import { toast } from "@/lib/toast"

export default function StudentsTab() {
  const { course } = useCourse()
  const { data, loading, error, reload } = useFetch(() => enrollmentService.students(course.id), [course.id])
  const [q, setQ] = useState("")
  const [busy, setBusy] = useState(null)
  const [actionError, setActionError] = useState("")
  const students = (data ?? []).filter((s) => !q || s.displayName?.toLowerCase().includes(q.toLowerCase()))

  const remove = async (s) => {
    const ok = await confirm({
      title: `Remove ${s.displayName}?`,
      description: "They’ll be unenrolled from this course.",
      body: "Their lesson progress and quiz results for this course will be lost.",
      confirmLabel: "Remove student",
    })
    if (!ok) return
    setActionError("")
    setBusy(s.userId)
    try {
      await enrollmentService.removeStudent(course.id, s.userId)
      reload()
      toast.success("Student removed", s.displayName)
    } catch (err) {
      setActionError(getErrorMessage(err, "Couldn’t remove student"))
      toast.error("Couldn’t remove student", err)
    } finally {
      setBusy(null)
    }
  }

  if (loading && !data) return <LoadingState />
  if (error) return <ErrorState error={error} onRetry={reload} />

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-sm text-muted-foreground">{data.length} enrolled student{data.length === 1 ? "" : "s"}</p>
        <div className="relative sm:w-64">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search students…" className="pl-9" />
        </div>
      </div>
      <FormError message={actionError} />

      {students.length === 0 ? (
        <EmptyState title={data.length ? "No students match" : "No students yet"}>
          {!data.length && "Students appear here once they enroll in a published course."}
        </EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border glass">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Progress</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Enrolled</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Last active</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {students.map((s) => (
                <tr key={s.userId}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        {s.avatarUrl && <AvatarImage src={s.avatarUrl} alt="" />}
                        <AvatarFallback className="bg-accent text-xs text-accent-foreground">
                          {(s.displayName ?? "?").split(" ").map((p) => p[0]).slice(0, 2).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{s.displayName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex min-w-36 items-center gap-2">
                      <Progress value={s.percentComplete ?? 0} className="h-1.5" />
                      <span className="w-20 text-right text-xs tabular-nums text-muted-foreground">
                        {s.completedLessons ?? 0}/{s.totalLessons ?? 0} · {s.percentComplete ?? 0}%
                      </span>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{formatDate(s.enrolledAt)}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{formatDate(s.lastAccessedAt) || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" disabled={busy === s.userId} onClick={() => remove(s)} aria-label="Remove student" title="Remove student">
                      {busy === s.userId ? <Loader2 className="animate-spin" /> : <UserMinus />}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
