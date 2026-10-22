import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import FormField, { FormError } from "@/components/auth/FormField"
import { Modal } from "@/components/admin/AdminUI"
import { LoadingState } from "@/components/course/CourseBits"
import LessonCheckEditor, { cleanCheck } from "@/components/lesson/LessonCheckEditor"
import { contentService } from "@/services/content.service"
import { lessonCheckService } from "@/services/lessonCheck.service"
import { getErrorMessage } from "@/lib/api"
import { toast } from "@/lib/toast"

/**
 * A quiz item in the curriculum (a lesson with kind QUIZ): title, pass mark and questions.
 * Place it after a lesson for a quick check, or last in a section to review the whole section.
 */
export default function QuizItemModal({ sectionId, lessonId, onClose, onSaved }) {
  const { t } = useTranslation()
  const isNew = !lessonId
  const [title, setTitle] = useState("")
  const [passMark, setPassMark] = useState("70")
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (isNew) return
    Promise.all([contentService.getLesson(lessonId), lessonCheckService.forEditing(lessonId).catch(() => null)])
      .then(([l, c]) => {
        setTitle(l.title ?? "")
        setQuestions(c?.questions ?? [])
        setPassMark(c?.passMark == null ? "" : String(c.passMark))
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [isNew, lessonId])

  const submit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return setError(t("admin.curriculum.titleRequired"))
    const qs = cleanCheck(questions)
    if (!qs.length) return setError(t("admin.quizItem.needQuestion"))
    setError("")
    setSaving(true)
    const payload = { title: title.trim(), kind: "QUIZ", durationMinutes: 0, preview: false, content: "", videoUrl: "", blocks: [] }
    try {
      const saved = isNew ? await contentService.createLesson({ sectionId, ...payload }) : await contentService.updateLesson(lessonId, payload)
      const mark = passMark === "" ? null : Math.max(0, Math.min(100, Number(passMark) || 0))
      await lessonCheckService.save(saved?.id ?? lessonId, qs, mark)
      toast.success(isNew ? t("admin.quizItem.added") : t("admin.quizItem.saved"), payload.title)
      onSaved()
    } catch (err) {
      setError(getErrorMessage(err, t("admin.curriculum.saveFailed")))
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={isNew ? t("admin.quizItem.newTitle") : t("admin.quizItem.editTitle")} className="sm:max-w-3xl">
      {loading ? (
        <LoadingState variant="section" />
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <FormError message={error} />
          <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
            <FormField id="quizTitle" label={t("admin.quizItem.title")} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("admin.quizItem.titlePh")} maxLength={200} autoFocus />
            <div className="space-y-2">
              <Label htmlFor="passMark">{t("admin.quizItem.passMark")}</Label>
              <div className="relative">
                <Input id="passMark" type="number" min={0} max={100} value={passMark} onChange={(e) => setPassMark(e.target.value)} placeholder="—" className="pr-8" />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
              </div>
            </div>
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">{t("admin.quizItem.hint")}</p>

          <LessonCheckEditor value={questions} onChange={setQuestions} />

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>{t("common.actions.cancel")}</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : <Save />} {isNew ? t("admin.quizItem.add") : t("admin.quizItem.save")}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
