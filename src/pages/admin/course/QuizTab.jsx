import { useEffect, useState } from "react"
import { MdQuiz } from "react-icons/md"
import { Plus, Trash2, Loader2, Check, CircleCheck, X, Lightbulb } from "lucide-react"
import { useTranslation } from "react-i18next"
import { BiSolidEditAlt, BiSolidTrash } from "react-icons/bi"
import { RiCheckboxCircleFill } from "react-icons/ri"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import FormField, { FormError } from "@/components/auth/FormField"
import { Modal } from "@/components/admin/AdminUI"
import { EmptyState, LoadingState } from "@/components/course/CourseBits"
import { useCourse } from "./useCourse"
import { quizService } from "@/services/quiz.service"
import { getErrorMessage } from "@/lib/api"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import { QUESTION_TYPES, questionType, typeLabel } from "@/lib/quiz"
import { confirm } from "@/store/confirm.store"
import { toast } from "@/lib/toast"

// Fallback for backends without GET /courses/{id}/quiz/edit: remember the id locally, then try the student "take" endpoint
const storeKey = (courseId) => `quiz:${courseId}`
const rememberQuiz = (courseId, id) => {
  try {
    if (id) localStorage.setItem(storeKey(courseId), id)
    else localStorage.removeItem(storeKey(courseId))
  } catch { /* ignore */ }
}
const recallQuiz = (courseId) => {
  try {
    return localStorage.getItem(storeKey(courseId))
  } catch {
    return null
  }
}

async function tryEdit(courseId, id) {
  if (!id) return null
  try {
    const quiz = await quizService.forEditing(id)
    rememberQuiz(courseId, quiz.id)
    return quiz
  } catch {
    return null // stale id
  }
}

async function findQuiz(course) {
  // Preferred: ask the backend for this course's quiz (GET /courses/{id}/quiz/edit)
  try {
    const quiz = await quizService.forCourse(course.id)
    rememberQuiz(course.id, quiz.id)
    return quiz
  } catch {
    // 404 = no quiz yet (or an older backend without this endpoint); 403 = not editable right now
    // → fall back to the older lookup below, which ends in "no quiz" if nothing is found
  }

  const remembered = await tryEdit(course.id, recallQuiz(course.id))
  if (remembered) return remembered
  rememberQuiz(course.id, null)

  // The student "take" endpoint only works for published courses — skip it for drafts
  // (a brand-new course has no quiz, so the call would just fail)
  if (course.status !== "PUBLISHED") return null
  try {
    return await tryEdit(course.id, (await quizService.take(course.id))?.id)
  } catch {
    return null // no quiz yet
  }
}

// `q` is null when the course has no quiz yet
const toSettings = (q, t) => ({
  title: q?.title ?? t("admin.quiz.defaultTitle"),
  instructions: q?.instructions ?? "",
  passMark: q?.passMark ?? 70,
  maxAttempts: q?.maxAttempts ?? "",
  timeLimitMinutes: q?.timeLimitMinutes ?? "",
})

const numOrNull = (v) => (v === "" || v == null ? null : Number(v))

export default function QuizTab() {
  const { t } = useTranslation()
  const { course } = useCourse()
  const [quiz, setQuiz] = useState(null)
  const [loading, setLoading] = useState(true)
  const [questionModal, setQuestionModal] = useState(null) // { question? }

  useEffect(() => {
    let cancelled = false
    findQuiz(course).then((q) => {
      if (cancelled) return
      setQuiz(q)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course.id])

  const refresh = async () => setQuiz(await quizService.forEditing(quiz.id))

  if (loading) return <LoadingState />

  return (
    <div className="space-y-6">
      <QuizSettings
        courseId={course.id}
        quiz={quiz}
        onSaved={(q) => {
          rememberQuiz(course.id, q.id)
          setQuiz(q)
        }}
        onDeleted={() => {
          rememberQuiz(course.id, null)
          setQuiz(null)
        }}
      />

      {quiz && (
        <>
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="space-y-1.5">
                <CardTitle>{t("admin.quiz.questions")}</CardTitle>
                <CardDescription>
                  {t("admin.quiz.questionCount", { count: quiz.questions?.length ?? 0 })} · {t("admin.quiz.pointsTotal", { count: quiz.totalPoints ?? 0 })}
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setQuestionModal({})}><Plus /> {t("admin.quiz.addQuestion")}</Button>
            </CardHeader>
            <CardContent>
              {!quiz.questions?.length ? (
                <EmptyState icon={MdQuiz} title={t("admin.quiz.noQuestions")}>{t("admin.quiz.noQuestionsHint")}</EmptyState>
              ) : (
                <ol className="space-y-3">
                  {quiz.questions.map((q, i) => (
                    <QuestionItem key={q.id} index={i} question={q} onEdit={() => setQuestionModal({ question: q })} onDeleted={refresh} />
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>

          <AttemptsCard quizId={quiz.id} />
        </>
      )}

      {questionModal && (
        <QuestionModal
          quizId={quiz.id}
          question={questionModal.question}
          onClose={() => setQuestionModal(null)}
          onSaved={async () => {
            setQuestionModal(null)
            await refresh()
          }}
        />
      )}
    </div>
  )
}

function QuizSettings({ courseId, quiz, onSaved, onDeleted }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(() => toSettings(quiz, t))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const set = (k) => (e) => {
    setSaved(false)
    setForm((f) => ({ ...f, [k]: e.target.value }))
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return setError(t("admin.quiz.titleRequired"))
    setError("")
    setSaving(true)
    const payload = {
      title: form.title.trim(),
      instructions: form.instructions,
      passMark: numOrNull(form.passMark),
      maxAttempts: numOrNull(form.maxAttempts),
      timeLimitMinutes: numOrNull(form.timeLimitMinutes),
    }
    try {
      const q = quiz ? await quizService.update(quiz.id, payload) : await quizService.create({ courseId, ...payload })
      onSaved(q)
      setSaved(true)
      toast.success(quiz ? t("admin.quiz.toast.settingsSaved") : t("admin.quiz.toast.created"))
    } catch (err) {
      setError(getErrorMessage(err, t("admin.quiz.toast.saveFailed")))
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    const ok = await confirm({
      title: t("admin.quiz.deleteDialog.title"),
      description: t("admin.shared.cantUndo"),
      body: t("admin.quiz.deleteDialog.body"),
      confirmLabel: t("admin.quiz.deleteQuiz"),
    })
    if (!ok) return
    try {
      await quizService.remove(quiz.id)
      onDeleted()
      setForm(toSettings(null, t))
      toast.success(t("admin.quiz.toast.deleted"))
    } catch (err) {
      setError(getErrorMessage(err, t("admin.quiz.toast.deleteFailed")))
      toast.error(t("admin.quiz.toast.deleteFailed"), err)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{quiz ? t("admin.quiz.settingsTitle") : t("admin.quiz.addTitle")}</CardTitle>
        <CardDescription>{quiz ? t("admin.quiz.settingsHint") : t("admin.quiz.addHint")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <FormError message={error} />
          <FormField id="quizTitle" label={t("admin.quiz.title")} value={form.title} onChange={set("title")} maxLength={200} />
          <FormField id="instructions" label={t("admin.quiz.instructions")} as={Textarea} rows={3} value={form.instructions} onChange={set("instructions")} />
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField id="passMark" label={t("admin.quiz.passMark")} type="number" min={0} max={100} value={form.passMark} onChange={set("passMark")} />
            <FormField id="maxAttempts" label={t("admin.quiz.maxAttempts")} type="number" min={1} placeholder={t("admin.quiz.unlimited")} value={form.maxAttempts} onChange={set("maxAttempts")} />
            <FormField id="timeLimit" label={t("admin.quiz.timeLimit")} type="number" min={1} placeholder={t("admin.quiz.none")} value={form.timeLimitMinutes} onChange={set("timeLimitMinutes")} />
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            {saved && <span className="flex items-center gap-1 text-sm text-primary"><Check className="size-4" /> {t("admin.quiz.saved")}</span>}
            {quiz && <Button type="button" variant="ghost" className="text-destructive hover:text-destructive" onClick={remove}><Trash2 /> {t("admin.quiz.deleteQuiz")}</Button>}
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="animate-spin" />} {quiz ? t("admin.quiz.saveSettings") : t("admin.quiz.createQuiz")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function QuestionItem({ index, question, onEdit, onDeleted }) {
  const { t } = useTranslation()
  const [busy, setBusy] = useState(false)
  const type = questionType(question)
  const remove = async () => {
    if (!(await confirm({ title: t("admin.quiz.deleteQuestionDialog"), description: question.text, confirmLabel: t("admin.quiz.deleteQuestion") }))) return
    setBusy(true)
    try {
      await quizService.deleteQuestion(question.id)
      await onDeleted()
      toast.success(t("admin.quiz.toast.questionDeleted"))
    } catch (err) {
      toast.error(t("admin.quiz.toast.questionDeleteFailed"), err)
    } finally {
      setBusy(false)
    }
  }
  const accepted = (question.answerKey ?? "").split("\n").filter(Boolean)

  return (
    <li className="rounded-2xl border border-neutral-200/80 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      {/* Header: number, question, badges, actions */}
      <div className="flex items-start gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-sm font-bold text-primary">{index + 1}</span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-snug">{question.text}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-violet-500/12 px-2 py-0.5 text-[11px] font-semibold text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">
              {t(`admin.questionTypes.${type}`, { defaultValue: typeLabel(type) })}
            </span>
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-muted-foreground dark:bg-neutral-800">
              {t("admin.quiz.pts", { count: question.points ?? 1 })}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <Button size="icon" variant="bordered" className="size-8" onClick={onEdit} aria-label={t("admin.quiz.editQuestion")}>
            <BiSolidEditAlt className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="bordered"
            className="size-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-500/10"
            onClick={remove}
            disabled={busy}
            aria-label={t("admin.quiz.deleteQuestion")}
          >
            {busy ? <Loader2 className="animate-spin" /> : <BiSolidTrash className="size-4" />}
          </Button>
        </div>
      </div>

      {/* Answer key */}
      <div className="mt-4 pl-11">
        {type === "SHORT_ANSWER" ? (
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">{t("admin.quiz.acceptedAnswers")}</p>
            <ul className="flex flex-wrap gap-1.5">
              {accepted.map((ans) => (
                <li
                  key={ans}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/8 px-2.5 py-1 text-sm font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                >
                  <RiCheckboxCircleFill className="size-4" /> {ans}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {question.options?.map((o, oi) => (
              <li
                key={o.id}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border px-3 py-2 text-sm",
                  o.correct
                    ? "border-emerald-500/40 bg-emerald-500/8 font-medium text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200"
                    : "border-neutral-200/80 text-foreground/80 dark:border-neutral-800"
                )}
              >
                <span
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-md text-[11px] font-bold",
                    o.correct ? "bg-emerald-500 text-white" : "bg-neutral-100 text-muted-foreground dark:bg-neutral-800"
                  )}
                >
                  {type === "TRUE_FALSE" ? (o.text === "True" ? "T" : "F") : String.fromCharCode(65 + oi)}
                </span>
                <span className="min-w-0 flex-1 truncate">{o.text}</span>
                {o.correct && <RiCheckboxCircleFill className="size-[18px] shrink-0 text-emerald-600 dark:text-emerald-400" />}
              </li>
            ))}
          </ul>
        )}

        {question.explanation && (
          <p className="mt-3 flex gap-2 rounded-xl bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-200">
            <Lightbulb className="mt-0.5 size-4 shrink-0" /> {question.explanation}
          </p>
        )}
      </div>
    </li>
  )
}

const blankOption = () => ({ text: "", correct: false })

function QuestionModal({ quizId, question, onClose, onSaved }) {
  const { t } = useTranslation()
  const [type, setType] = useState(() => questionType(question))
  const [text, setText] = useState(question?.text ?? "")
  const [explanation, setExplanation] = useState(question?.explanation ?? "")
  const [points, setPoints] = useState(question?.points ?? 1)
  // Choice options (single / multiple choice)
  const [options, setOptions] = useState(() =>
    question?.options?.length && questionType(question) !== "TRUE_FALSE"
      ? question.options.map((o) => ({ id: o.id, text: o.text, correct: !!o.correct }))
      : [{ ...blankOption(), correct: true }, blankOption()]
  )
  // True / False: which one is correct
  const [trueIsCorrect, setTrueIsCorrect] = useState(() =>
    questionType(question) === "TRUE_FALSE" ? !!question.options?.find((o) => o.text === "True")?.correct : true
  )
  // Short answer: accepted answers, one per line
  const [answerKey, setAnswerKey] = useState(question?.answerKey ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const multi = type === "MULTIPLE_CHOICE"
  const isChoice = type === "SINGLE_CHOICE" || multi

  // Single choice: marking one correct clears the others. Multiple choice: each toggles on its own.
  const setOption = (i, patch) =>
    setOptions((opts) => opts.map((o, j) => (j === i ? { ...o, ...patch } : patch.correct && !multi ? { ...o, correct: false } : o)))

  const changeType = (next) => {
    setError("")
    // Going back to single choice keeps only the first correct option
    if (next === "SINGLE_CHOICE") {
      setOptions((opts) => {
        const first = opts.findIndex((o) => o.correct)
        return opts.map((o, j) => ({ ...o, correct: j === (first < 0 ? 0 : first) }))
      })
    }
    setType(next)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!text.trim()) return setError(t("admin.quiz.errors.textRequired"))
    const filled = options.filter((o) => o.text.trim())
    const correctCount = filled.filter((o) => o.correct).length
    const accepted = answerKey.split("\n").map((l) => l.trim()).filter(Boolean)
    if (isChoice && filled.length < 2) return setError(t("admin.quiz.errors.twoOptions"))
    if (type === "SINGLE_CHOICE" && correctCount !== 1) return setError(t("admin.quiz.errors.markCorrect"))
    if (multi && correctCount < 2) return setError(t("admin.quiz.errors.markTwoCorrect"))
    if (type === "SHORT_ANSWER" && !accepted.length) return setError(t("admin.quiz.errors.oneAccepted"))
    setError("")
    setSaving(true)
    const payload = {
      quizId,
      type,
      text: text.trim(),
      explanation: explanation.trim() || null,
      points: Number(points) || 1,
      ...(isChoice && { options: filled.map((o) => ({ ...(o.id && { id: o.id }), text: o.text.trim(), correct: o.correct })) }),
      ...(type === "TRUE_FALSE" && { correctAnswer: trueIsCorrect }),
      ...(type === "SHORT_ANSWER" && { answerKey: accepted.join("\n") }),
    }
    try {
      if (question) await quizService.updateQuestion(question.id, payload)
      else await quizService.addQuestion(payload)
      toast.success(question ? t("admin.quiz.toast.questionUpdated") : t("admin.quiz.toast.questionAdded"))
      await onSaved()
    } catch (err) {
      setError(getErrorMessage(err, t("admin.quiz.toast.questionSaveFailed")))
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={question ? t("admin.quiz.editQuestion") : t("admin.quiz.newQuestion")} className="sm:max-w-xl">
      <form onSubmit={submit} className="space-y-4">
        <FormError message={error} />

        {/* Question type */}
        <div className="space-y-2">
          <Label>{t("admin.quiz.questionType")}</Label>
          <div className="grid grid-cols-2 gap-2">
            {QUESTION_TYPES.map((qt) => (
              <button
                key={qt.value}
                type="button"
                onClick={() => changeType(qt.value)}
                aria-pressed={type === qt.value}
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-left transition-colors",
                  type === qt.value
                    ? "border-primary bg-primary/5 ring-1 ring-primary dark:bg-primary/10"
                    : "border-neutral-200/80 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50"
                )}
              >
                <p className="text-sm font-semibold">{t(`admin.questionTypes.${qt.value}`, { defaultValue: qt.label })}</p>
                <p className="text-xs text-muted-foreground">{t(`admin.questionTypeHints.${qt.value}`, { defaultValue: qt.hint })}</p>
              </button>
            ))}
          </div>
        </div>

        <FormField id="qText" label={t("admin.quiz.question")} as={Textarea} rows={2} value={text} onChange={(e) => setText(e.target.value)} autoFocus />

        {isChoice && (
          <div className="space-y-2">
            <Label>
              {t("admin.quiz.answers")}{" "}
              <span className="font-normal text-muted-foreground">— {multi ? t("admin.quiz.answersMulti") : t("admin.quiz.answersSingle")}</span>
            </Label>
            {options.map((o, i) => (
              // One tile per answer: the mark on the left toggles "correct" (green when on)
              <div
                key={i}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border p-1.5 pl-2 transition-colors",
                  o.correct
                    ? "border-emerald-500/50 bg-emerald-500/8 dark:bg-emerald-500/10"
                    : "border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-900"
                )}
              >
                <button
                  type="button"
                  role={multi ? "checkbox" : "radio"}
                  aria-checked={o.correct}
                  aria-label={t("admin.quiz.markOptionCorrect", { n: i + 1 })}
                  onClick={() => setOption(i, { correct: multi ? !o.correct : true })}
                  className={cn(
                    "grid size-6 shrink-0 place-items-center border-2 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                    multi ? "rounded-md" : "rounded-full",
                    o.correct
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-neutral-300 bg-white hover:border-emerald-400 dark:border-neutral-600 dark:bg-neutral-900"
                  )}
                >
                  {o.correct && <Check className="size-3.5" strokeWidth={3} />}
                </button>
                <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-neutral-100 text-xs font-bold text-muted-foreground dark:bg-neutral-800">
                  {String.fromCharCode(65 + i)}
                </span>
                <Input
                  value={o.text}
                  onChange={(e) => setOption(i, { text: e.target.value })}
                  placeholder={t("admin.quiz.option", { n: i + 1 })}
                  className="h-9 border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent"
                />
                {o.correct && <span className="hidden shrink-0 text-xs font-semibold text-emerald-700 sm:inline dark:text-emerald-400">{t("admin.quiz.correct")}</span>}
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-8 shrink-0 text-muted-foreground hover:text-rose-600"
                  disabled={options.length <= 2}
                  onClick={() => setOptions((opts) => opts.filter((_, j) => j !== i))}
                  aria-label={t("admin.quiz.removeOption")}
                >
                  <X />
                </Button>
              </div>
            ))}
            {options.length < 6 && (
              <Button
                type="button"
                variant="bordered"
                size="sm"
                className="w-full border-dashed"
                onClick={() => setOptions((o) => [...o, blankOption()])}
              >
                <Plus /> {t("admin.quiz.addOption")}
              </Button>
            )}
          </div>
        )}

        {type === "TRUE_FALSE" && (
          <div className="space-y-2">
            <Label>{t("admin.quiz.correctAnswer")}</Label>
            <div className="grid grid-cols-2 gap-2">
              {[true, false].map((v) => (
                <button
                  key={String(v)}
                  type="button"
                  onClick={() => setTrueIsCorrect(v)}
                  aria-pressed={trueIsCorrect === v}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition-colors",
                    trueIsCorrect === v
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "border-neutral-200/80 text-muted-foreground hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50"
                  )}
                >
                  {trueIsCorrect === v && <CircleCheck className="size-4" />} {v ? t("admin.quiz.true") : t("admin.quiz.false")}
                </button>
              ))}
            </div>
          </div>
        )}

        {type === "SHORT_ANSWER" && (
          <div className="space-y-1.5">
            <FormField
              id="answerKey"
              label={t("admin.quiz.acceptedAnswersLabel")}
              as={Textarea}
              rows={3}
              placeholder={"const\nconst keyword"}
              value={answerKey}
              onChange={(e) => setAnswerKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">{t("admin.quiz.matchingHint")}</p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
          <FormField id="explanation" label={t("admin.quiz.explanation")} value={explanation} onChange={(e) => setExplanation(e.target.value)} />
          <FormField id="points" label={t("admin.quiz.points")} type="number" min={1} value={points} onChange={(e) => setPoints(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>{t("common.actions.cancel")}</Button>
          <Button type="submit" disabled={saving}>{saving && <Loader2 className="animate-spin" />} {t("admin.quiz.saveQuestion")}</Button>
        </div>
      </form>
    </Modal>
  )
}

// Avatar (or initials), name and email of the student who submitted an attempt
function StudentCell({ student }) {
  const { t } = useTranslation()
  if (!student) return <span className="text-muted-foreground">{t("admin.quiz.unknownStudent")}</span>
  const name = student.displayName || student.email || t("admin.quiz.attemptsTable.student")
  const initials = name.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("")
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      {student.avatarUrl ? (
        <img src={student.avatarUrl} alt="" className="size-8 shrink-0 rounded-full object-cover" />
      ) : (
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">{initials}</span>
      )}
      <div className="min-w-0 leading-tight">
        <p className="truncate font-medium">{name}</p>
        {student.email && student.email !== name && <p className="truncate text-xs text-muted-foreground">{student.email}</p>}
      </div>
    </div>
  )
}

function AttemptsCard({ quizId }) {
  const { t } = useTranslation()
  const [attempts, setAttempts] = useState(null)
  useEffect(() => {
    quizService.allAttempts(quizId).then(setAttempts).catch(() => setAttempts([]))
  }, [quizId])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("admin.quiz.attempts")}</CardTitle>
        <CardDescription>{t("admin.quiz.attemptsHint")}</CardDescription>
      </CardHeader>
      <CardContent>
        {attempts == null ? (
          <LoadingState variant="section" />
        ) : attempts.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("admin.quiz.noAttempts")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr className="border-b">
                  <th className="py-2 pr-4 font-medium">{t("admin.quiz.attemptsTable.student")}</th>
                  <th className="py-2 pr-4 font-medium">{t("admin.quiz.attemptsTable.date")}</th>
                  <th className="py-2 pr-4 font-medium">{t("admin.quiz.attemptsTable.attempt")}</th>
                  <th className="py-2 pr-4 font-medium">{t("admin.quiz.attemptsTable.correct")}</th>
                  <th className="py-2 pr-4 font-medium">{t("admin.quiz.attemptsTable.score")}</th>
                  <th className="py-2 font-medium">{t("admin.quiz.attemptsTable.result")}</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => (
                  <tr key={a.attemptId} className="border-b last:border-0">
                    <td className="py-2.5 pr-4">
                      <StudentCell student={a.student} />
                    </td>
                    <td className="py-2 pr-4 whitespace-nowrap">{formatDate(a.submittedAt)}</td>
                    <td className="py-2 pr-4">#{a.attemptNo}</td>
                    <td className="py-2 pr-4">{a.correctCount}/{a.totalQuestions}</td>
                    <td className="py-2 pr-4 font-medium tabular-nums">{a.score}%</td>
                    <td className="py-2">
                      <span className={cn("rounded px-2 py-0.5 text-xs font-medium", a.passed ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive")}>
                        {a.passed ? t("admin.quiz.passed") : t("admin.quiz.failed")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
