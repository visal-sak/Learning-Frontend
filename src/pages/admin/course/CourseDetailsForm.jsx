import { useEffect, useState } from "react"
import { Loader2, Save } from "lucide-react"
import { useTranslation } from "react-i18next"
import { RiCheckboxCircleFill } from "react-icons/ri"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { NativeSelect } from "@/components/ui/native-select"
import FormField, { FormError } from "@/components/auth/FormField"
import { ImageUpload } from "@/components/admin/AdminUI"
import { useCatalogStore } from "@/store"
import { getErrorMessage } from "@/lib/api"
import { LEVELS } from "@/lib/constants"
import { Checkbox } from "@/components/ui/checkbox"

const toForm = (c = {}) => ({
  title: c.title ?? "",
  categoryId: c.categoryId ?? "",
  summary: c.summary ?? "",
  description: c.description ?? "",
  thumbnailUrl: c.thumbnailUrl ?? "",
  level: c.level ?? "BEGINNER",
  // completion & certificate settings
  requireQuizPass: c.requireQuizPass ?? false,
  requireFinalQuiz: c.requireFinalQuiz ?? true,
  certificateEnabled: c.certificateEnabled ?? true,
  // AI helper in quizzes
  aiHelperEnabled: c.aiHelperEnabled ?? true,
  aiHintsPerAttempt: c.aiHintsPerAttempt ?? 3,
  aiInFinalQuiz: c.aiInFinalQuiz ?? false,
  aiExplainEnabled: c.aiExplainEnabled ?? true,
  aiHintPenalty: c.aiHintPenalty ?? 0,
})

// Shared by "new course" and the Details tab. `onSubmit(payload)` does the API call.
export default function CourseDetailsForm({ course, onSubmit, submitLabel }) {
  const { t } = useTranslation()
  const categories = useCatalogStore((s) => s.categories)
  const fetchCategories = useCatalogStore((s) => s.fetchCategories)
  const [form, setForm] = useState(() => toForm(course))
  const [errors, setErrors] = useState({})
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchCategories().catch(() => {})
  }, [fetchCategories])

  const set = (name, value) => {
    setSaved(false)
    setForm((f) => ({ ...f, [name]: value }))
    if (errors[name]) setErrors((x) => ({ ...x, [name]: undefined }))
  }
  const onChange = (e) => set(e.target.name, e.target.value)

  const submit = async (e) => {
    e.preventDefault()
    const v = {}
    if (!form.title.trim()) v.title = t("admin.courseForm.required")
    if (!form.categoryId) v.categoryId = t("admin.courseForm.pickCategory")
    setErrors(v)
    if (Object.keys(v).length) return
    setError("")
    setSaving(true)
    try {
      await onSubmit({ ...form, title: form.title.trim() })
      setSaved(true)
    } catch (err) {
      setError(getErrorMessage(err, t("admin.courseForm.saveFailed")))
    } finally {
      setSaving(false)
    }
  }

  const card = "rounded-2xl border border-neutral-200/80 bg-white p-5 sm:p-6 dark:border-neutral-800 dark:bg-neutral-900"

  return (
    <form onSubmit={submit} className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]" noValidate>
      <div className="space-y-5">
        <FormError message={error} />

        <section className={card}>
          <CardTitle title={t("admin.courseForm.basics")} hint={t("admin.courseForm.basicsHint")} />
          <div className="space-y-4">
            <FormField id="title" label={t("admin.courseForm.title")} value={form.title} onChange={onChange} error={errors.title} placeholder={t("admin.courseForm.titlePlaceholder")} maxLength={200} />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="categoryId" label={t("admin.courseForm.category")} as={NativeSelect} value={form.categoryId} onChange={onChange} error={errors.categoryId}>
                <option value="">{t("admin.courseForm.selectCategory")}</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </FormField>
              <FormField id="level" label={t("admin.courseForm.level")} as={NativeSelect} value={form.level} onChange={onChange}>
                {LEVELS.map((l) => <option key={l.value} value={l.value}>{t(`admin.levels.${l.value}`, { defaultValue: l.label })}</option>)}
              </FormField>
            </div>
          </div>
        </section>

        <section className={card}>
          <CardTitle title={t("admin.courseForm.about")} hint={t("admin.courseForm.aboutHint")} />
          <div className="space-y-4">
            <div className="space-y-1.5">
              <FormField id="summary" label={t("admin.courseForm.summary")} value={form.summary} onChange={onChange} placeholder={t("admin.courseForm.summaryPlaceholder")} maxLength={500} />
              <p className="text-right text-xs tabular-nums text-muted-foreground">{form.summary.length}/500</p>
            </div>
            <FormField id="description" label={t("admin.courseForm.description")} as={Textarea} rows={8} value={form.description} onChange={onChange} placeholder={t("admin.courseForm.descriptionPlaceholder")} />
          </div>
        </section>

        {course && (
          <section className={card}>
            <CardTitle title={t("admin.courseForm.settings")} hint={t("admin.courseForm.settingsHint")} />
            <div className="divide-y divide-neutral-200/80 rounded-xl border border-neutral-200/80 dark:divide-neutral-800 dark:border-neutral-800">
              {[
                ["certificateEnabled", "settingCertificate"],
                ["requireFinalQuiz", "settingFinalQuiz"],
                ["requireQuizPass", "settingQuizPass"],
              ].map(([name, key]) => (
                <label key={name} className={cn("flex cursor-pointer items-start gap-3 px-4 py-3.5 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/40", name === "requireFinalQuiz" && !form.certificateEnabled && "pointer-events-none opacity-50")}>
                  <Checkbox checked={form[name]} onChange={(v) => set(name, v)} className="mt-0.5" disabled={name === "requireFinalQuiz" && !form.certificateEnabled} />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{t(`admin.courseForm.${key}`)}</span>
                    <span className="block text-xs text-muted-foreground">{t(`admin.courseForm.${key}Hint`)}</span>
                    {name === "requireFinalQuiz" && form.requireFinalQuiz && form.certificateEnabled && !course.finalQuizQuestions && (
                      <span className="mt-1 block text-xs text-amber-700 dark:text-amber-400">{t("admin.courseForm.settingFinalQuizNone")}</span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </section>
        )}

        {course && (
          <section className={card}>
            <CardTitle title={t("admin.courseForm.aiTitle")} hint={t("admin.courseForm.aiHint")} />
            <div className="divide-y divide-neutral-200/80 rounded-xl border border-neutral-200/80 dark:divide-neutral-800 dark:border-neutral-800">
              <SettingRow checked={form.aiHelperEnabled} onChange={(v) => set("aiHelperEnabled", v)} title={t("admin.courseForm.aiLesson")} hint={t("admin.courseForm.aiLessonHint")} />
              <div className={cn("flex items-center justify-between gap-4 px-4 py-3.5", !form.aiHelperEnabled && !form.aiInFinalQuiz && "opacity-50")}>
                <span className="min-w-0 pl-8">
                  <span className="block text-sm font-medium">{t("admin.courseForm.aiHints")}</span>
                  <span className="block text-xs text-muted-foreground">{t("admin.courseForm.aiHintsHint")}</span>
                </span>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={form.aiHintsPerAttempt}
                  onChange={(e) => set("aiHintsPerAttempt", Math.max(0, Math.min(10, Number(e.target.value) || 0)))}
                  className="h-9 w-20 shrink-0 rounded-md border bg-transparent px-3 text-sm tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                  aria-label={t("admin.courseForm.aiHints")}
                />
              </div>
              <SettingRow checked={form.aiInFinalQuiz} onChange={(v) => set("aiInFinalQuiz", v)} title={t("admin.courseForm.aiFinal")} hint={t("admin.courseForm.aiFinalHint")} />
              <SettingRow checked={form.aiExplainEnabled} onChange={(v) => set("aiExplainEnabled", v)} title={t("admin.courseForm.aiExplain")} hint={t("admin.courseForm.aiExplainHint")} />
              <div className="flex items-center justify-between gap-4 px-4 py-3.5">
                <label className="flex min-w-0 cursor-pointer items-start gap-3">
                  <Checkbox checked={form.aiHintPenalty > 0} onChange={(v) => set("aiHintPenalty", v ? 0.25 : 0)} className="mt-0.5" />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{t("admin.courseForm.aiPenalty")}</span>
                    <span className="block text-xs text-muted-foreground">{t("admin.courseForm.aiPenaltyHint")}</span>
                  </span>
                </label>
                {form.aiHintPenalty > 0 && (
                  <span className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground">
                    −
                    <input
                      type="number"
                      min={0.05}
                      max={1}
                      step={0.05}
                      value={form.aiHintPenalty}
                      onChange={(e) => set("aiHintPenalty", Math.max(0, Math.min(1, Number(e.target.value) || 0)))}
                      className="h-9 w-20 rounded-md border bg-transparent px-3 text-sm tabular-nums text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                      aria-label={t("admin.courseForm.aiPenalty")}
                    />
                    {t("admin.courseForm.aiPenaltyUnit")}
                  </span>
                )}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Side column: thumbnail + save, kept in view while scrolling the form */}
      <div className="space-y-5 lg:sticky lg:top-[72px]">
        <section className={card}>
          <CardTitle title={t("admin.courseForm.thumbnail")} hint={t("admin.courseForm.thumbnailHint")} />
          <ImageUpload value={form.thumbnailUrl} onChange={(url) => set("thumbnailUrl", url)} />
        </section>

        <section className={cn(card, "space-y-3")}>
          <Button type="submit" size="lg" disabled={saving} className="w-full">
            {saving ? <Loader2 className="animate-spin" /> : <Save />}
            {submitLabel ?? t("common.actions.saveChanges")}
          </Button>
          <p className={cn("flex items-center justify-center gap-1.5 text-xs", saved ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
            {saved ? <><RiCheckboxCircleFill className="size-4" /> {t("admin.courseForm.allSaved")}</> : t("admin.courseForm.saveHint")}
          </p>
        </section>
      </div>
    </form>
  )
}

function SettingRow({ checked, onChange, title, hint }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 px-4 py-3.5 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
      <Checkbox checked={checked} onChange={onChange} className="mt-0.5" />
      <span className="min-w-0">
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
    </label>
  )
}

function CardTitle({ title, hint }) {
  return (
    <div className="mb-4">
      <h2 className="text-[15px] font-bold">{title}</h2>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}
