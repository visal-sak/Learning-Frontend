import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, Loader2, Check, CircleCheck, Circle, X } from "lucide-react"
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
import { confirm } from "@/store/confirm.store"
import { toast } from "@/lib/toast"

// There is no "quiz by course" endpoint for editors: remember the id locally, fall back to the student "take" endpoint
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
                <ol className="space-y-4">
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
  return (
    <li className="rounded-lg border p-4">
      <div className="flex items-start gap-3">
        <span className="text-sm font-semibold text-muted-foreground">{index + 1}.</span>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="font-medium">{question.text}</p>
          <ul className="space-y-1">
            {question.options?.map((o) => (
              <li key={o.id} className={cn("flex items-center gap-2 text-sm", o.correct ? "text-primary" : "text-muted-foreground")}>
                {o.correct ? <CircleCheck className="size-4" /> : <Circle className="size-4" />} {o.text}
              </li>
            ))}
          </ul>
          {question.explanation && <p className="text-xs text-muted-foreground">💡 {question.explanation}</p>}
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">{question.points ?? 1} pt</span>
        <div className="flex shrink-0">
          <Button size="icon" variant="ghost" className="size-8" onClick={onEdit} aria-label="Edit question"><Pencil /></Button>
          <Button size="icon" variant="ghost" className="size-8 text-destructive hover:text-destructive" onClick={remove} disabled={busy} aria-label="Delete question">
            {busy ? <Loader2 className="animate-spin" /> : <Trash2 />}
          </Button>
        </div>
      </div>
    </li>
  )
}

const blankOption = () => ({ text: "", correct: false })

function QuestionModal({ quizId, question, onClose, onSaved }) {
  const [text, setText] = useState(question?.text ?? "")
  const [explanation, setExplanation] = useState(question?.explanation ?? "")
  const [points, setPoints] = useState(question?.points ?? 1)
  const [options, setOptions] = useState(() =>
    question?.options?.length ? question.options.map((o) => ({ id: o.id, text: o.text, correct: !!o.correct })) : [{ ...blankOption(), correct: true }, blankOption()]
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const setOption = (i, patch) => setOptions((opts) => opts.map((o, j) => (j === i ? { ...o, ...patch } : patch.correct ? { ...o, correct: false } : o)))

  const submit = async (e) => {
    e.preventDefault()
    const filled = options.filter((o) => o.text.trim())
    if (!text.trim()) return setError("Question text is required.")
    if (filled.length < 2) return setError("Add at least two answer options.")
    if (!filled.some((o) => o.correct)) return setError("Mark the correct answer.")
    setError("")
    setSaving(true)
    const payload = {
      quizId,
      text: text.trim(),
      explanation: explanation.trim() || null,
      points: Number(points) || 1,
      options: filled.map((o) => ({ ...(o.id && { id: o.id }), text: o.text.trim(), correct: o.correct })),
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
        <FormField id="qText" label="Question" as={Textarea} rows={2} value={text} onChange={(e) => setText(e.target.value)} autoFocus />
        <div className="space-y-2">
          <Label>Answers <span className="font-normal text-muted-foreground">— select the correct one</span></Label>
          {options.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                name="correct"
                checked={o.correct}
                onChange={() => setOption(i, { correct: true })}
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
                    <td className="py-2 pr-4">{formatDate(a.submittedAt)}</td>
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
