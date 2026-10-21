import { useEffect, useState } from "react"
import { Plus, Trash2, Loader2, Check, CircleCheck, X, Lightbulb } from "lucide-react"
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
const toSettings = (q) => ({
  title: q?.title ?? "Final quiz",
  instructions: q?.instructions ?? "",
  passMark: q?.passMark ?? 70,
  maxAttempts: q?.maxAttempts ?? "",
  timeLimitMinutes: q?.timeLimitMinutes ?? "",
})

const numOrNull = (v) => (v === "" || v == null ? null : Number(v))

export default function QuizTab() {
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
                <CardTitle>Questions</CardTitle>
                <CardDescription>
                  {quiz.questions?.length ?? 0} questions · {quiz.totalPoints ?? 0} points total
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setQuestionModal({})}><Plus /> Add question</Button>
            </CardHeader>
            <CardContent>
              {!quiz.questions?.length ? (
                <EmptyState title="No questions yet">Add at least one question so students can take the quiz.</EmptyState>
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
  const [form, setForm] = useState(() => toSettings(quiz))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const set = (k) => (e) => {
    setSaved(false)
    setForm((f) => ({ ...f, [k]: e.target.value }))
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return setError("Title is required.")
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
      toast.success(quiz ? "Quiz settings saved" : "Quiz created")
    } catch (err) {
      setError(getErrorMessage(err, "Couldn’t save the quiz"))
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    const ok = await confirm({
      title: "Delete this quiz?",
      description: "This can’t be undone.",
      body: "All questions and every student attempt for this quiz will be permanently removed.",
      confirmLabel: "Delete quiz",
    })
    if (!ok) return
    try {
      await quizService.remove(quiz.id)
      onDeleted()
      setForm(toSettings())
      toast.success("Quiz deleted")
    } catch (err) {
      setError(getErrorMessage(err, "Couldn’t delete the quiz"))
      toast.error("Couldn’t delete the quiz", err)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{quiz ? "Quiz settings" : "Add a final quiz"}</CardTitle>
        <CardDescription>{quiz ? "Students take this quiz after the lessons." : "Test what students learned. One quiz per course."}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <FormError message={error} />
          <FormField id="quizTitle" label="Title" value={form.title} onChange={set("title")} maxLength={200} />
          <FormField id="instructions" label="Instructions" as={Textarea} rows={3} value={form.instructions} onChange={set("instructions")} />
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField id="passMark" label="Pass mark (%)" type="number" min={0} max={100} value={form.passMark} onChange={set("passMark")} />
            <FormField id="maxAttempts" label="Max attempts" type="number" min={1} placeholder="Unlimited" value={form.maxAttempts} onChange={set("maxAttempts")} />
            <FormField id="timeLimit" label="Time limit (min)" type="number" min={1} placeholder="None" value={form.timeLimitMinutes} onChange={set("timeLimitMinutes")} />
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            {saved && <span className="flex items-center gap-1 text-sm text-primary"><Check className="size-4" /> Saved</span>}
            {quiz && <Button type="button" variant="ghost" className="text-destructive hover:text-destructive" onClick={remove}><Trash2 /> Delete quiz</Button>}
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="animate-spin" />} {quiz ? "Save settings" : "Create quiz"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function QuestionItem({ index, question, onEdit, onDeleted }) {
  const [busy, setBusy] = useState(false)
  const type = questionType(question)
  const remove = async () => {
    if (!(await confirm({ title: "Delete this question?", description: question.text, confirmLabel: "Delete question" }))) return
    setBusy(true)
    try {
      await quizService.deleteQuestion(question.id)
      await onDeleted()
      toast.success("Question deleted")
    } catch (err) {
      toast.error("Couldn’t delete the question", err)
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
              {typeLabel(type)}
            </span>
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-muted-foreground dark:bg-neutral-800">
              {question.points ?? 1} pt{(question.points ?? 1) === 1 ? "" : "s"}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <Button size="icon" variant="bordered" className="size-8" onClick={onEdit} aria-label="Edit question">
            <BiSolidEditAlt className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="bordered"
            className="size-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-500/10"
            onClick={remove}
            disabled={busy}
            aria-label="Delete question"
          >
            {busy ? <Loader2 className="animate-spin" /> : <BiSolidTrash className="size-4" />}
          </Button>
        </div>
      </div>

      {/* Answer key */}
      <div className="mt-4 pl-11">
        {type === "SHORT_ANSWER" ? (
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Accepted answers</p>
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
    if (!text.trim()) return setError("Question text is required.")
    const filled = options.filter((o) => o.text.trim())
    const correctCount = filled.filter((o) => o.correct).length
    const accepted = answerKey.split("\n").map((l) => l.trim()).filter(Boolean)
    if (isChoice && filled.length < 2) return setError("Add at least two answer options.")
    if (type === "SINGLE_CHOICE" && correctCount !== 1) return setError("Mark the correct answer.")
    if (multi && correctCount < 2) return setError("Mark at least two correct answers.")
    if (type === "SHORT_ANSWER" && !accepted.length) return setError("Add at least one accepted answer.")
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
      toast.success(question ? "Question updated" : "Question added")
      await onSaved()
    } catch (err) {
      setError(getErrorMessage(err, "Couldn’t save the question"))
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={question ? "Edit question" : "New question"} className="sm:max-w-xl">
      <form onSubmit={submit} className="space-y-4">
        <FormError message={error} />

        {/* Question type */}
        <div className="space-y-2">
          <Label>Question type</Label>
          <div className="grid grid-cols-2 gap-2">
            {QUESTION_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => changeType(t.value)}
                aria-pressed={type === t.value}
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-left transition-colors",
                  type === t.value
                    ? "border-primary bg-primary/5 ring-1 ring-primary dark:bg-primary/10"
                    : "border-neutral-200/80 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50"
                )}
              >
                <p className="text-sm font-semibold">{t.label}</p>
                <p className="text-xs text-muted-foreground">{t.hint}</p>
              </button>
            ))}
          </div>
        </div>

        <FormField id="qText" label="Question" as={Textarea} rows={2} value={text} onChange={(e) => setText(e.target.value)} autoFocus />

        {isChoice && (
          <div className="space-y-2">
            <Label>
              Answers{" "}
              <span className="font-normal text-muted-foreground">— {multi ? "tick every correct one (at least two)" : "select the correct one"}</span>
            </Label>
            {options.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type={multi ? "checkbox" : "radio"}
                  name="correct"
                  checked={o.correct}
                  onChange={() => setOption(i, { correct: multi ? !o.correct : true })}
                  className="size-4 shrink-0 accent-[var(--primary)]"
                  aria-label={`Option ${i + 1} is correct`}
                />
                <Input value={o.text} onChange={(e) => setOption(i, { text: e.target.value })} placeholder={`Option ${i + 1}`} />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-8 shrink-0"
                  disabled={options.length <= 2}
                  onClick={() => setOptions((opts) => opts.filter((_, j) => j !== i))}
                  aria-label="Remove option"
                >
                  <X />
                </Button>
              </div>
            ))}
            {options.length < 6 && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setOptions((o) => [...o, blankOption()])}><Plus /> Add option</Button>
            )}
          </div>
        )}

        {type === "TRUE_FALSE" && (
          <div className="space-y-2">
            <Label>Correct answer</Label>
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
                  {trueIsCorrect === v && <CircleCheck className="size-4" />} {v ? "True" : "False"}
                </button>
              ))}
            </div>
          </div>
        )}

        {type === "SHORT_ANSWER" && (
          <div className="space-y-1.5">
            <FormField
              id="answerKey"
              label="Accepted answers (one per line)"
              as={Textarea}
              rows={3}
              placeholder={"const\nconst keyword"}
              value={answerKey}
              onChange={(e) => setAnswerKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Matching ignores capital letters and extra spaces.</p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
          <FormField id="explanation" label="Explanation (shown after submitting)" value={explanation} onChange={(e) => setExplanation(e.target.value)} />
          <FormField id="points" label="Points" type="number" min={1} value={points} onChange={(e) => setPoints(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving && <Loader2 className="animate-spin" />} Save question</Button>
        </div>
      </form>
    </Modal>
  )
}

// Avatar (or initials), name and email of the student who submitted an attempt
function StudentCell({ student }) {
  if (!student) return <span className="text-muted-foreground">Unknown student</span>
  const name = student.displayName || student.email || "Student"
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
  const [attempts, setAttempts] = useState(null)
  useEffect(() => {
    quizService.allAttempts(quizId).then(setAttempts).catch(() => setAttempts([]))
  }, [quizId])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attempts</CardTitle>
        <CardDescription>Every submission from your students.</CardDescription>
      </CardHeader>
      <CardContent>
        {attempts == null ? (
          <LoadingState className="py-6" />
        ) : attempts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No attempts yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr className="border-b">
                  <th className="py-2 pr-4 font-medium">Student</th>
                  <th className="py-2 pr-4 font-medium">Date</th>
                  <th className="py-2 pr-4 font-medium">Attempt</th>
                  <th className="py-2 pr-4 font-medium">Correct</th>
                  <th className="py-2 pr-4 font-medium">Score</th>
                  <th className="py-2 font-medium">Result</th>
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
                        {a.passed ? "Passed" : "Failed"}
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
