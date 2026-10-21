import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeft, Clock, Trophy, XCircle, CheckCircle2, Loader2, RotateCcw, ListChecks, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FormError } from "@/components/auth/FormField"
import { LoadingState } from "@/components/course/CourseBits"
import { quizService } from "@/services/quiz.service"
import { getErrorMessage } from "@/lib/api"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import { confirm } from "@/store/confirm.store"
import { toast } from "@/lib/toast"

export default function QuizPage() {
  const { id: courseId } = useParams()
  const [quiz, setQuiz] = useState(null)
  const [attempts, setAttempts] = useState([])
  const [loadError, setLoadError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stage, setStage] = useState("intro") // intro | taking | result
  const [result, setResult] = useState(null)

  // Fetch the quiz (for the next attempt) and my previous attempts
  const fetchQuiz = useCallback(async () => {
    try {
      const q = await quizService.take(courseId)
      const past = await quizService.myAttempts(q.id).catch(() => [])
      setQuiz(q)
      setAttempts(past)
      setLoadError(null)
    } catch (err) {
      setLoadError(err)
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    fetchQuiz()
  }, [fetchQuiz])

  const load = () => {
    setLoading(true)
    return fetchQuiz()
  }

  const back = (
    <Link to={`/courses/${courseId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="size-4" /> Back to course
    </Link>
  )

  if (loading) return <LoadingState className="py-32" />

  if (loadError) {
    const status = loadError.response?.status
    return (
      <div className="mx-auto max-w-xl space-y-6 px-4 py-16 text-center sm:px-6">
        <ListChecks className="mx-auto size-10 text-muted-foreground" />
        <h1 className="text-xl font-semibold">{status === 404 ? "This course has no quiz yet" : "You can’t take this quiz right now"}</h1>
        <p className="text-sm text-muted-foreground">{status === 404 ? "Check back later." : getErrorMessage(loadError)}</p>
        {back}
      </div>
    )
  }

  const attemptsLeft = quiz.maxAttempts ? quiz.maxAttempts - (quiz.attemptNo - 1) : null

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6">
      {back}
      {stage === "intro" && (
        <Intro quiz={quiz} attempts={attempts} attemptsLeft={attemptsLeft} onStart={() => setStage("taking")} />
      )}
      {stage === "taking" && (
        <Taking
          quiz={quiz}
          onSubmitted={(r) => {
            setResult(r)
            setStage("result")
            setAttempts((a) => [r, ...a])
          }}
        />
      )}
      {stage === "result" && result && (
        <Result
          result={result}
          canRetry={attemptsLeft == null || attemptsLeft > 1}
          onRetry={async () => {
            await load()
            setStage("intro")
          }}
        />
      )}
    </div>
  )
}

function Intro({ quiz, attempts, attemptsLeft, onStart }) {
  const best = attempts.reduce((m, a) => Math.max(m, a.score ?? 0), 0)
  const passed = attempts.some((a) => a.passed)
  return (
    <>
      <Card>
        <CardContent className="space-y-5 py-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{quiz.title}</h1>
            {quiz.instructions && <p className="mt-2 whitespace-pre-line text-muted-foreground">{quiz.instructions}</p>}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Fact icon={ListChecks} label="Questions" value={quiz.questions?.length ?? 0} />
            <Fact icon={Target} label="Pass mark" value={`${quiz.passMark ?? 0}%`} />
            <Fact icon={Clock} label="Time limit" value={quiz.timeLimitMinutes ? `${quiz.timeLimitMinutes} min` : "None"} />
          </div>
          <div className="flex flex-col items-start justify-between gap-3 border-t pt-5 sm:flex-row sm:items-center">
            <p className="text-sm text-muted-foreground">
              Attempt #{quiz.attemptNo}
              {quiz.maxAttempts ? ` of ${quiz.maxAttempts}` : ""}
              {passed && <span className="ml-2 text-primary">· Passed (best {best}%)</span>}
            </p>
            <Button size="lg" onClick={onStart} disabled={attemptsLeft != null && attemptsLeft <= 0 || !quiz.questions?.length}>
              {attempts.length ? "Start new attempt" : "Start quiz"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {attempts.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">Your attempts</h2>
          <ul className="divide-y rounded-xl border glass text-sm">
            {attempts.map((a) => (
              <li key={a.attemptId} className="flex items-center gap-3 px-4 py-3">
                <span className="w-16 text-muted-foreground">#{a.attemptNo}</span>
                <span className="flex-1 text-muted-foreground">{formatDate(a.submittedAt)}</span>
                <span className="tabular-nums">{a.correctCount}/{a.totalQuestions}</span>
                <span className="w-12 text-right font-medium tabular-nums">{a.score}%</span>
                <span className={cn("w-16 text-right text-xs font-medium", a.passed ? "text-primary" : "text-destructive")}>{a.passed ? "Passed" : "Failed"}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}

function Fact({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-background/40 p-3">
      <Icon className="size-5 text-primary" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-semibold">{value}</p>
      </div>
    </div>
  )
}

function Taking({ quiz, onSubmitted }) {
  const [answers, setAnswers] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [secondsLeft, setSecondsLeft] = useState(quiz.timeLimitMinutes ? quiz.timeLimitMinutes * 60 : null)
  const questions = useMemo(() => quiz.questions ?? [], [quiz.questions])
  const answered = Object.keys(answers).length

  const submit = useCallback(
    async (force = false) => {
      if (!force && answered < questions.length) {
        const ok = await confirm({
          title: "Submit with unanswered questions?",
          description: `You answered ${answered} of ${questions.length}.`,
          body: "Unanswered questions are marked as incorrect.",
          confirmLabel: "Submit anyway",
          cancelLabel: "Keep answering",
          tone: "warning",
        })
        if (!ok) return
      }
      setError("")
      setSubmitting(true)
      try {
        const payload = questions.map((q) => ({ questionId: q.id, selectedOptionId: answers[q.id] ?? null }))
        const result = await quizService.submit(quiz.id, payload)
        onSubmitted(result)
        if (result?.passed) toast.success("Quiz passed!", `You scored ${result.score}%`)
        else if (result) toast.warning("Not passed this time", `You scored ${result.score}% — pass mark is ${result.passMark}%`)
      } catch (err) {
        setError(getErrorMessage(err, "Couldn’t submit your answers"))
        toast.error("Couldn’t submit your answers", err)
        setSubmitting(false)
      }
    },
    [answered, answers, onSubmitted, questions, quiz.id]
  )

  // Countdown; auto-submit when time runs out
  useEffect(() => {
    if (secondsLeft == null || submitting) return
    const t = setTimeout(() => {
      if (secondsLeft <= 1) submit(true)
      else setSecondsLeft(secondsLeft - 1)
    }, 1000)
    return () => clearTimeout(t)
  }, [secondsLeft, submit, submitting])

  return (
    <div className="space-y-6">
      <div className="sticky top-14 z-30 -mx-4 flex items-center justify-between gap-4 border-b bg-background/90 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-lg sm:border">
        <p className="font-medium">{quiz.title}</p>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">{answered}/{questions.length} answered</span>
          {secondsLeft != null && (
            <span className={cn("flex items-center gap-1 font-mono tabular-nums", secondsLeft < 60 && "text-destructive")}>
              <Clock className="size-4" /> {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}
            </span>
          )}
        </div>
      </div>

      <ol className="space-y-4">
        {questions.map((q, i) => (
          <li key={q.id}>
            <Card>
              <CardContent className="space-y-3 py-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium"><span className="mr-2 text-muted-foreground">{i + 1}.</span>{q.text}</p>
                  <span className="shrink-0 text-xs text-muted-foreground">{q.points ?? 1} pt</span>
                </div>
                <div className="space-y-2">
                  {q.options?.map((o) => (
                    <label
                      key={o.id}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors hover:bg-accent/50",
                        answers[q.id] === o.id && "border-primary bg-primary/10"
                      )}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        checked={answers[q.id] === o.id}
                        onChange={() => setAnswers((a) => ({ ...a, [q.id]: o.id }))}
                        className="size-4 accent-[var(--primary)]"
                      />
                      {o.text}
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>

      <FormError message={error} />
      <div className="flex justify-end">
        <Button size="lg" onClick={() => submit(false)} disabled={submitting}>
          {submitting && <Loader2 className="animate-spin" />} Submit answers
        </Button>
      </div>
    </div>
  )
}

function Result({ result, canRetry, onRetry }) {
  const [retrying, setRetrying] = useState(false)
  return (
    <div className="space-y-6">
      <Card className={cn("border-2", result.passed ? "border-primary/40" : "border-destructive/40")}>
        <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
          {result.passed ? <Trophy className="size-12 text-primary" /> : <XCircle className="size-12 text-destructive" />}
          <h1 className="text-2xl font-semibold">{result.passed ? "You passed!" : "Not quite there yet"}</h1>
          <p className="text-5xl font-bold tabular-nums">{result.score}%</p>
          <p className="text-sm text-muted-foreground">
            {result.correctCount} of {result.totalQuestions} correct · pass mark {result.passMark}% · attempt #{result.attemptNo}
          </p>
          {canRetry && !result.passed && (
            <Button
              variant="outline"
              onClick={async () => {
                setRetrying(true)
                await onRetry()
              }}
              disabled={retrying}
            >
              {retrying ? <Loader2 className="animate-spin" /> : <RotateCcw />} Try again
            </Button>
          )}
        </CardContent>
      </Card>

      {result.questions?.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Review your answers</h2>
          {result.questions.map((q, i) => (
            <Card key={q.questionId} className="gap-0 py-0">
              <CardContent className="space-y-2 p-4">
                <p className="flex items-start gap-2 font-medium">
                  {q.correct ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" /> : <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" />}
                  <span><span className="mr-1 text-muted-foreground">{i + 1}.</span>{q.text}</span>
                </p>
                <div className="space-y-1 pl-7 text-sm">
                  <p>
                    <span className="text-muted-foreground">Your answer: </span>
                    <span className={q.correct ? "text-primary" : "text-destructive"}>{q.selectedOptionText ?? "No answer"}</span>
                  </p>
                  {!q.correct && q.correctOptionText && (
                    <p><span className="text-muted-foreground">Correct answer: </span><span className="text-primary">{q.correctOptionText}</span></p>
                  )}
                  {q.explanation && <p className="text-muted-foreground">💡 {q.explanation}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
