import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Loader2, Search, Send, Trash2 } from "lucide-react"
import { MdQuiz } from "react-icons/md"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { NativeSelect } from "@/components/ui/native-select"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTable } from "@/components/admin/DataTable"
import { EmptyState, ErrorState, LoadingState } from "@/components/course/CourseBits"
import { BunnyAvatar } from "@/components/ai/Bunny"
import { useFetch } from "@/hooks/useFetch"
import { useCourse } from "./useCourse"
import { aiAccessService } from "@/services/aiAccess.service"
import { enrollmentService } from "@/services/enrollment.service"
import { getErrorMessage } from "@/lib/api"
import { formatDate } from "@/lib/format"
import { confirm } from "@/store/confirm.store"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"

const CARD = "rounded-2xl border border-neutral-200/80 bg-white p-5 sm:p-6 dark:border-neutral-800 dark:bg-neutral-900"
const initials = (name = "") => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?"

/** Give students extra Bunny AI tutor questions / quiz hints on a lesson, and see what was given. */
export default function AiAccessTab() {
  const { t } = useTranslation()
  const { course } = useCourse()
  const lessons = useMemo(() => (course.sections ?? []).flatMap((s) => (s.lessons ?? []).map((l) => ({ ...l, sectionTitle: s.title }))), [course])
  const students = useFetch(() => enrollmentService.students(course.id), [course.id])
  const grants = useFetch(() => aiAccessService.forCourse(course.id), [course.id])

  const [lessonId, setLessonId] = useState("")
  const [picked, setPicked] = useState(new Set())
  const [q, setQ] = useState("")
  const [extraQuestions, setExtraQuestions] = useState(3)
  const [extraHints, setExtraHints] = useState(0)
  const [note, setNote] = useState("")
  const [sendEmail, setSendEmail] = useState(true)
  const [busy, setBusy] = useState(false)

  const needle = q.trim().toLowerCase()
  const list = (Array.isArray(students.data) ? students.data : []).filter(
    (s) => !needle || s.displayName?.toLowerCase().includes(needle) || s.email?.toLowerCase().includes(needle)
  )
  const allPicked = list.length > 0 && list.every((s) => picked.has(s.userId))
  const toggle = (id) => setPicked((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAll = () => setPicked((p) => { const n = new Set(p); list.forEach((s) => (allPicked ? n.delete(s.userId) : n.add(s.userId))); return n })

  const canSend = lessonId && picked.size > 0 && (extraQuestions > 0 || extraHints > 0) && !busy

  const submit = async (e) => {
    e.preventDefault()
    if (!canSend) return
    setBusy(true)
    try {
      const created = await aiAccessService.grant({ lessonId, userIds: [...picked], extraQuestions, extraHints, note, sendEmail })
      const rows = Array.isArray(created) ? created : []
      const names = rows.map((g) => g.studentName).filter(Boolean).join(", ")
      const emailed = rows.filter((g) => g.emailQueued).length
      toast.success(t("admin.aiAccess.sentTo", { names: names || t("admin.aiAccess.students", { count: picked.size }) }), t("admin.aiAccess.sentWhere"))
      if (sendEmail && emailed < rows.length) toast.warning(t("admin.aiAccess.emailNotSent"), t("admin.aiAccess.emailNotSentHint"))
      setPicked(new Set())
      setNote("")
      grants.reload()
    } catch (err) {
      toast.error(t("admin.aiAccess.failed"), getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const revoke = async (g) => {
    const ok = await confirm({ title: t("admin.aiAccess.revokeTitle"), description: `${g.studentName ?? ""} · ${g.lessonTitle ?? ""}`, confirmLabel: t("admin.aiAccess.revoke") })
    if (!ok) return
    try {
      await aiAccessService.revoke(g.id)
      grants.reload()
    } catch (err) {
      toast.error(t("admin.aiAccess.failed"), getErrorMessage(err))
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className={cn(CARD, "space-y-5")}>
        <div className="flex items-start gap-3">
          <BunnyAvatar size={44} />
          <div>
            <h2 className="text-[15px] font-bold">{t("admin.aiAccess.title")}</h2>
            <p className="text-xs text-muted-foreground">{t("admin.aiAccess.hint")}</p>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {/* left: lesson + amounts + message */}
          <div className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">{t("admin.aiAccess.lesson")}</span>
              <NativeSelect value={lessonId} onChange={(e) => setLessonId(e.target.value)} aria-label={t("admin.aiAccess.lesson")}>
                <option value="">{t("admin.aiAccess.pickLesson")}</option>
                {lessons.map((l) => (
                  <option key={l.id} value={l.id}>{l.sectionTitle} · {l.kind === "QUIZ" ? "❓ " : ""}{l.title}</option>
                ))}
              </NativeSelect>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">{t("admin.aiAccess.extraQuestions")}</span>
                <Input type="number" min={0} max={50} value={extraQuestions} onChange={(e) => setExtraQuestions(Math.max(0, Math.min(50, Number(e.target.value) || 0)))} />
                <span className="block text-[11px] text-muted-foreground">{t("admin.aiAccess.extraQuestionsHint")}</span>
              </label>
              <label className="block space-y-1.5">
                <span className="flex items-center gap-1 text-sm font-medium"><MdQuiz className="size-4 text-amber-500" /> {t("admin.aiAccess.extraHints")}</span>
                <Input type="number" min={0} max={20} value={extraHints} onChange={(e) => setExtraHints(Math.max(0, Math.min(20, Number(e.target.value) || 0)))} />
                <span className="block text-[11px] text-muted-foreground">{t("admin.aiAccess.extraHintsHint")}</span>
              </label>
            </div>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">{t("admin.aiAccess.note")}</span>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder={t("admin.aiAccess.notePh")} className="min-h-20" />
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3">
              <Checkbox checked={sendEmail} onChange={setSendEmail} className="mt-0.5" />
              <span>
                <span className="block text-sm font-medium">{t("admin.aiAccess.email")}</span>
                <span className="block text-xs text-muted-foreground">{t("admin.aiAccess.emailHint")}</span>
              </span>
            </label>
          </div>

          {/* right: pick students */}
          <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border">
            <div className="flex items-center gap-2 border-b bg-neutral-50 px-3 py-2 dark:bg-neutral-800/40">
              <Checkbox size="sm" checked={allPicked} onChange={toggleAll} aria-label={t("admin.aiAccess.selectAll")} />
              <span className="text-xs font-semibold">{t("admin.aiAccess.students", { count: picked.size })}</span>
              <div className="relative ml-auto w-40">
                <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("admin.aiAccess.search")} className="h-7 pl-7 text-xs" />
              </div>
            </div>
            {students.loading ? (
              <LoadingState variant="section" />
            ) : students.error ? (
              <ErrorState error={students.error} onRetry={students.reload} className="py-6" />
            ) : list.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">{t("admin.aiAccess.noStudents")}<br /><span className="text-xs">{t("admin.aiAccess.noStudentsHint")}</span></p>
            ) : (
              <>
              <p className="border-b bg-neutral-50/60 px-3 py-1.5 text-[11px] text-muted-foreground dark:bg-neutral-800/20">{t("admin.aiAccess.enrolledOnly", { count: (students.data ?? []).length })}</p>
              <ul className="max-h-80 divide-y overflow-y-auto">
                {list.map((s) => (
                  <li key={s.userId}>
                    <label className={cn("flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm transition-colors hover:bg-accent/50", picked.has(s.userId) && "bg-primary/[0.04] dark:bg-primary/10")}>
                      <Checkbox size="sm" checked={picked.has(s.userId)} onChange={() => toggle(s.userId)} />
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">{initials(s.displayName)}</span>
                      <span className="min-w-0 flex-1 leading-tight">
                        <span className="block truncate font-medium">{s.displayName}</span>
                        {s.email && <span className="block truncate text-xs text-muted-foreground">{s.email}</span>}
                      </span>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{s.percentComplete ?? 0}%</span>
                    </label>
                  </li>
                ))}
              </ul>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t pt-4">
          <p className="mr-auto text-xs text-muted-foreground">{t("admin.aiAccess.summary", { count: picked.size, q: extraQuestions, h: extraHints })}</p>
          <Button type="submit" disabled={!canSend}>
            {busy ? <Loader2 className="animate-spin" /> : <Send />} {t("admin.aiAccess.send")}
          </Button>
        </div>
      </form>

      <section className="space-y-3">
        <h3 className="text-[15px] font-bold">{t("admin.aiAccess.history")}</h3>
        {grants.loading ? (
          <LoadingState variant="section" />
        ) : grants.error ? (
          <ErrorState error={grants.error} onRetry={grants.reload} />
        ) : !grants.data?.length ? (
          <EmptyState icon={() => <BunnyAvatar size={30} className="ring-0" />} title={t("admin.aiAccess.emptyTitle")}>{t("admin.aiAccess.emptyHint")}</EmptyState>
        ) : (
          <DataTable
            rows={grants.data}
            columns={[
              {
                key: "student",
                label: t("admin.aiAccess.colStudent"),
                render: (g) => (
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">{initials(g.studentName)}</span>
                    <span className="min-w-0 leading-tight">
                      <span className="block truncate font-semibold">{g.studentName}</span>
                      <span className="block truncate text-xs text-muted-foreground">{g.email}</span>
                    </span>
                  </span>
                ),
              },
              { key: "lesson", label: t("admin.aiAccess.colLesson"), render: (g) => <span className="block max-w-56 truncate">{g.lessonTitle}</span> },
              {
                key: "extra",
                label: t("admin.aiAccess.colExtra"),
                nowrap: true,
                render: (g) => (
                  <span className="flex gap-1.5">
                    {g.extraQuestions > 0 && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">+{g.extraQuestions} {t("admin.aiAccess.questionsShort")}</span>}
                    {g.extraHints > 0 && <span className="rounded-full bg-amber-500/12 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">+{g.extraHints} {t("admin.aiAccess.hintsShort")}</span>}
                  </span>
                ),
              },
              { key: "by", label: t("admin.aiAccess.colBy"), nowrap: true, render: (g) => <span className="text-muted-foreground">{g.grantedByName} · {formatDate(g.createdAt)}</span> },
              {
                key: "actions",
                label: t("admin.shared.actions"),
                align: "right",
                render: (g) => (
                  <Button size="icon" variant="ghost" className="size-8 hover:text-destructive" onClick={() => revoke(g)} aria-label={t("admin.aiAccess.revoke")} title={t("admin.aiAccess.revoke")}>
                    <Trash2 />
                  </Button>
                ),
              },
            ]}
          />
        )}
      </section>
    </div>
  )
}
