import { useState } from "react"
import { HiCheckCircle } from "react-icons/hi"
import { MdWorkspacePremium } from "react-icons/md"
import { MdGroups } from "react-icons/md"
import { useTranslation } from "react-i18next"
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
  const { t } = useTranslation()
  const { course } = useCourse()
  const { data, loading, error, reload } = useFetch(() => enrollmentService.students(course.id), [course.id])
  const [q, setQ] = useState("")
  const [busy, setBusy] = useState(null)
  const [actionError, setActionError] = useState("")
  const students = (data ?? []).filter((s) => !q || s.displayName?.toLowerCase().includes(q.toLowerCase()))

  const remove = async (s) => {
    const ok = await confirm({
      title: t("admin.students.removeDialog.title", { name: s.displayName }),
      description: t("admin.students.removeDialog.description"),
      body: t("admin.students.removeDialog.body"),
      confirmLabel: t("admin.students.removeStudent"),
    })
    if (!ok) return
    setActionError("")
    setBusy(s.userId)
    try {
      await enrollmentService.removeStudent(course.id, s.userId)
      reload()
      toast.success(t("admin.students.toast.removed"), s.displayName)
    } catch (err) {
      setActionError(getErrorMessage(err, t("admin.students.toast.removeFailed")))
      toast.error(t("admin.students.toast.removeFailed"), err)
    } finally {
      setBusy(null)
    }
  }

  if (loading && !data) return <LoadingState />
  if (error) return <ErrorState error={error} onRetry={reload} />

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-sm text-muted-foreground">{t("admin.students.enrolledCount", { count: data.length })}</p>
        <div className="relative sm:w-64">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("admin.students.search")} className="pl-9" />
        </div>
      </div>
      <FormError message={actionError} />

      {students.length === 0 ? (
        <EmptyState icon={MdGroups} title={data.length ? t("admin.students.noMatch") : t("admin.students.empty")}>
          {!data.length && t("admin.students.emptyHint")}
        </EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border glass">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">{t("admin.students.columns.student")}</th>
                <th className="px-4 py-3 font-medium">{t("admin.students.columns.progress")}</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">{t("admin.students.columns.enrolled")}</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">{t("admin.students.columns.lastActive")}</th>
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
                      <span className="min-w-0 leading-tight">
                        <span className="block font-medium">{s.displayName}</span>
                        {s.email && <span className="block text-xs text-muted-foreground">{s.email}</span>}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex min-w-36 items-center gap-2">
                      <Progress value={s.status === "COMPLETED" ? 100 : s.percentComplete ?? 0} className="h-1.5" />
                      <span className="w-20 text-right text-xs tabular-nums text-muted-foreground">
                        {s.completedLessons ?? 0}/{s.totalLessons ?? 0} · {s.percentComplete ?? 0}%
                      </span>
                    </div>
                    {/* finished the course (maybe before lessons were added) + certificate */}
                    {(s.status === "COMPLETED" || s.certificateSerial) && (
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {s.status === "COMPLETED" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/12 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                            <HiCheckCircle className="size-3.5" /> {t("admin.students.completed")}{s.completedAt ? ` · ${formatDate(s.completedAt)}` : ""}
                          </span>
                        )}
                        {s.certificateSerial && (
                          <a
                            href={`/certificates/${s.certificateSerial}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-full bg-amber-500/12 px-2 py-0.5 text-[11px] font-semibold text-amber-700 hover:underline dark:text-amber-300"
                            title={s.certificateSerial}
                          >
                            <MdWorkspacePremium className="size-3.5" /> {t("admin.students.certificate")}
                          </a>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{formatDate(s.enrolledAt)}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{formatDate(s.lastAccessedAt) || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" disabled={busy === s.userId} onClick={() => remove(s)} aria-label={t("admin.students.removeStudent")} title={t("admin.students.removeStudent")}>
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
