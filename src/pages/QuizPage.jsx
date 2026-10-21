import { useCallback, useEffect, useMemo, useState } from "react"
import { HiCheckCircle } from "react-icons/hi"
import { BiSolidXCircle } from "react-icons/bi"
import { RiCheckboxCircleFill } from "react-icons/ri"
import { WiDirectionLeft } from "react-icons/wi"
import { Link, useParams } from "react-router-dom"
import { ArrowRight, Clock, Trophy, Loader2, RotateCcw, ListChecks, Target, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FormError } from "@/components/auth/FormField"
import { LoadingState } from "@/components/course/CourseBits"
import { quizService } from "@/services/quiz.service"
import { getErrorMessage } from "@/lib/api"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import { StatCard } from "@/components/StatCard"
import { isAnswered, questionType, toSubmitAnswer } from "@/lib/quiz"
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
      <WiDirectionLeft className="size-5" /> Back to course
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
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10 sm:px-6">
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

// White card used across the quiz screens (matches the course page cards)
const QUIZ_CARD = "rounded-2xl border border-neutral-200/80 bg-white shadow-[0_8px_30px_-12px_rgb(0_0_0/0.12)] dark:border-neutral-800 dark:bg-neutral-900"

function Intro({ quiz, attempts, attemptsLeft, onStart }) {
  const best = attempts.reduce((m, a) => Math.max(m, a.score ?? 0), 0)
  const passed = attempts.some((a) => a.passed)
  const used = (quiz.attemptNo ?? 1) - 1
  const outOfAttempts = attemptsLeft != null && attemptsLeft <= 0
  const card = QUIZ_CARD

  return (
    <>
      {/* One card: about the quiz, its numbers and the start action */}
      <section className={card}>
        <div className="p-6 sm:p-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/12 px-2.5 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">
            <ListChecks className="size-3.5" /> Final quiz
          </span>
          <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{quiz.title}</h1>
          {quiz.instructions && <p className="mt-2 max-w-2xl whitespace-pre-line font-medium text-muted-foreground">{quiz.instructions}</p>}

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard variant="inset" icon={ListChecks} tone="sky" label="Questions" subtitle="In this quiz" value={quiz.questions?.length ?? 0} />
            <StatCard variant="inset" icon={Target} tone="green" label="Pass mark" subtitle="Score needed" value={`${quiz.passMark ?? 0}%`} />
            <StatCard
              variant="inset"
              icon={Clock}
              tone="amber"
              label="Time limit"
              subtitle="Per attempt"
              value={quiz.timeLimitMinutes ? `${quiz.timeLimitMinutes} min` : "None"}
            />
            <StatCard
              variant="inset"
              icon={RotateCcw}
              tone="violet"
              label="Attempts"
              subtitle="Used so far"
              value={quiz.maxAttempts ? `${used} / ${quiz.maxAttempts}` : used}
              detail={attemptsLeft != null ? (attemptsLeft > 0 ? `${attemptsLeft} left` : "No attempts left") : "Unlimited"}
              detailTone={attemptsLeft != null && attemptsLeft <= 0 ? "down" : "muted"}
            />
          </div>

          <div className="mt-6 flex flex-col gap-4 border-t border-neutral-200/80 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">
            <p className="text-sm text-muted-foreground">
              {outOfAttempts
                ? "You have used all your attempts."
                : passed
                  ? <span className="font-medium text-emerald-600 dark:text-emerald-400">You passed — best score {best}%. You can try again to improve it.</span>
                  : attempts.length
                    ? `Best score so far: ${best}%. You need ${quiz.passMark ?? 0}% to pass.`
                    : "Ready when you are. The timer starts when you begin."}
            </p>
            <Button size="lg" onClick={onStart} disabled={outOfAttempts || !quiz.questions?.length}>
              {attempts.length ? <><RotateCcw /> Start new attempt</> : <>Start quiz <ArrowRight /></>}
            </Button>
          </div>
        </div>
      </section>

      {/* Past attempts in their own table card */}
      {attempts.length > 0 && (
        <section className={cn(card, "overflow-hidden")}>
          <h2 className="bg-neutral-50 px-6 py-3 text-[15px] font-bold sm:px-8 dark:bg-neutral-800/40">Your attempts</h2>
          <ul className="divide-y divide-neutral-200/80 border-t border-neutral-200/80 text-sm dark:divide-neutral-800 dark:border-neutral-800">
            {attempts.map((a) => (
              <li key={a.attemptId} className="flex items-center gap-4 px-6 py-3 sm:px-8">
                <span className="w-10 font-medium text-muted-foreground">#{a.attemptNo}</span>
                <span className="flex-1 text-muted-foreground">{formatDate(a.submittedAt)}</span>
                <span className="hidden tabular-nums text-muted-foreground sm:inline">{a.correctCount}/{a.totalQuestions} correct</span>
                <span className="w-12 text-right font-semibold tabular-nums">{a.score}%</span>
                <span
                  className={cn(
                    "w-16 rounded-full px-2 py-0.5 text-center text-xs font-semibold",
                    a.passed
                      ? "bg-emerald-500/12 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                      : "bg-rose-500/12 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300"
                  )}
                >
                  {a.passed ? "Passed" : "Failed"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}

function Taking({ quiz, onSubmitted }) {
  const [answers, setAnswers] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [secondsLeft, setSecondsLeft] = useState(quiz.timeLimitMinutes ? quiz.timeLimitMinutes * 60 : null)
  const questions = useMemo(() => quiz.questions ?? [], [quiz.questions])
  const answered = questions.filter((q) => isAnswered(questionType(q), answers[q.id])).length

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
        const payload = questions.map((q) => toSubmitAnswer(q, answers[q.id]))
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

  const progress = questions.length ? Math.round((answered / questions.length) * 100) : 0
  const lowTime = secondsLeft != null && secondsLeft < 60

  return (
    <div className="space-y-5">
      {/* Sticky header: quiz name, progress and the countdown stay in view while scrolling questions */}
      <div className={cn(QUIZ_CARD, "sticky top-16 z-30 px-5 py-4 sm:px-6")}>
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Final quiz</p>
            <p className="truncate text-[15px] font-bold">{quiz.title}</p>
          </div>
          {secondsLeft != null && (
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold tabular-nums",
                lowTime
                  ? "bg-rose-500/12 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300"
                  : "bg-amber-500/12 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
              )}
            >
              <Clock className="size-4" /> {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}
            </span>
          )}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
            <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${progress}%` }} />
          </div>
          <span className="shrink-0 text-xs font-medium text-muted-foreground tabular-nums">
            {answered}/{questions.length} answered
          </span>
        </div>
      </div>

      <ol className="space-y-4">
        {questions.map((q, i) => {
          const type = questionType(q)
          const done = isAnswered(type, answers[q.id])
          return (
            <li key={q.id} className={cn(QUIZ_CARD, "p-5 sm:p-6")}>
              <div className="flex items-center justify-between gap-3">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                    Question {i + 1} of {questions.length}
                  </span>
                  {type === "MULTIPLE_CHOICE" && <span className="text-xs font-medium text-muted-foreground">Select all that apply</span>}
                </span>
                <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  {done && (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <HiCheckCircle className="size-4" /> Answered
                    </span>
                  )}
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 dark:bg-neutral-800">{q.points ?? 1} pt</span>
                </span>
              </div>
              <p className="mt-3 text-lg font-semibold leading-snug">{q.text}</p>

              <QuestionInput question={q} type={type} value={answers[q.id]} onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))} />
            </li>
          )
        })}
      </ol>

      <FormError message={error} />
      <div className={cn(QUIZ_CARD, "flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6")}>
        <p className="text-sm text-muted-foreground">
          {answered === questions.length
            ? "All questions answered — ready to submit."
            : `${questions.length - answered} question${questions.length - answered === 1 ? "" : "s"} left unanswered.`}
        </p>
        <Button size="lg" onClick={() => submit(false)} disabled={submitting}>
          {submitting && <Loader2 className="animate-spin" />} Submit answers
        </Button>
      </div>
    </div>
  )
}

// One answer control per question type
function QuestionInput({ question, type, value, onChange }) {
  if (type === "SHORT_ANSWER") {
    return (
      <div className="mt-4">
        <Input
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your answer"
          aria-label="Your answer"
          className="h-11 rounded-xl text-sm"
        />
        <p className="mt-1.5 text-xs text-muted-foreground">Capital letters and extra spaces don’t matter.</p>
      </div>
    )
  }

  const multi = type === "MULTIPLE_CHOICE"
  const picked = multi ? value ?? [] : value
  const isPicked = (id) => (multi ? picked.includes(id) : picked === id)
  const toggle = (id) => onChange(multi ? (isPicked(id) ? picked.filter((x) => x !== id) : [...picked, id]) : id)

  return (
    <div className={cn("mt-4 grid gap-2.5", type === "TRUE_FALSE" && "sm:grid-cols-2")}>
      {question.options?.map((o, oi) => {
        const selected = isPicked(o.id)
        return (
          <label
            key={o.id}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 text-sm font-medium transition-colors",
              "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/50",
              selected
                ? "border-primary bg-primary/5 dark:bg-primary/10"
                : "border-neutral-200/80 hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:border-neutral-700 dark:hover:bg-neutral-800/50"
            )}
          >
            {/* native input kept for keyboard + screen readers; the tile is the visual */}
            <input
              type={multi ? "checkbox" : "radio"}
              name={question.id}
              checked={selected}
              onChange={() => toggle(o.id)}
              className="sr-only"
            />
            <span
              className={cn(
                "grid size-8 shrink-0 place-items-center text-xs font-bold transition-colors",
                multi ? "rounded-md" : "rounded-lg",
                selected ? "bg-primary text-primary-foreground" : "bg-neutral-100 text-muted-foreground dark:bg-neutral-800"
              )}
            >
              {multi && selected ? <HiCheckCircle className="size-4" /> : type === "TRUE_FALSE" ? (o.text === "True" ? "T" : "F") : String.fromCharCode(65 + oi)}
            </span>
            <span className="flex-1">{o.text}</span>
            {selected && <HiCheckCircle className="size-5 shrink-0 text-primary" />}
          </label>
        )
      })}
    </div>
  )
}

// Score ring: the arc fills to the score, coloured by pass/fail
function ScoreRing({ score, passed }) {
  const r = 52
  const c = 2 * Math.PI * r
  return (
    <div className="relative grid size-36 shrink-0 place-items-center">
      <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="10" className="stroke-neutral-200 dark:stroke-neutral-800" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(Math.max(score, 0), 100) / 100)}
          className={cn("transition-[stroke-dashoffset] duration-700", passed ? "stroke-emerald-500" : "stroke-rose-500")}
        />
      </svg>
      <div className="text-center">
        <p className="text-3xl font-bold tabular-nums tracking-tight">{score}%</p>
        <p className="text-xs font-medium text-muted-foreground">your score</p>
      </div>
    </div>
  )
}

function Result({ result, canRetry, onRetry }) {
  const { id: courseId } = useParams()
  const [retrying, setRetrying] = useState(false)
  const passed = result.passed
  const chip = "rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-muted-foreground dark:bg-neutral-800"

  return (
    <div className="space-y-5">
      {/* Score card */}
      <section className={cn(QUIZ_CARD, "flex flex-col items-center gap-6 p-6 text-center sm:flex-row sm:p-8 sm:text-left")}>
        <ScoreRing score={result.score ?? 0} passed={passed} />
        <div className="min-w-0 flex-1">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
              passed
                ? "bg-emerald-500/12 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                : "bg-rose-500/12 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300"
            )}
          >
            {passed ? <Trophy className="size-3.5" /> : <BiSolidXCircle className="size-3.5" />} {passed ? "Passed" : "Not passed"}
          </span>
          <h1 className="mt-3 text-2xl font-bold tracking-tight">{passed ? "Great job — you passed!" : "Not quite there yet"}</h1>
          <p className="mt-1 font-medium text-muted-foreground">
            {passed
              ? "You reached the pass mark for this course quiz."
              : `You need ${result.passMark}% to pass. Review the answers below and try again.`}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
            <span className={chip}>{result.correctCount} of {result.totalQuestions} correct</span>
            <span className={chip}>Pass mark {result.passMark}%</span>
            <span className={chip}>Attempt #{result.attemptNo}</span>
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-2 sm:justify-start">
            {canRetry && !passed && (
              <Button
                size="lg"
                onClick={async () => {
                  setRetrying(true)
                  await onRetry()
                }}
                disabled={retrying}
              >
                {retrying ? <Loader2 className="animate-spin" /> : <RotateCcw />} Try again
              </Button>
            )}
            <Button size="lg" variant="outline" asChild>
              <Link to={`/courses/${courseId}`}>Back to course</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Answer review */}
      {result.questions?.length > 0 && (
        <section className={cn(QUIZ_CARD, "overflow-hidden")}>
          <h2 className="bg-neutral-50 px-6 py-3 text-[15px] font-bold sm:px-8 dark:bg-neutral-800/40">Review your answers</h2>
          <ol className="divide-y divide-neutral-200/80 border-t border-neutral-200/80 dark:divide-neutral-800 dark:border-neutral-800">
            {result.questions.map((q, i) => (
              <li key={q.questionId} className="flex gap-4 px-6 py-5 sm:px-8">
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-lg text-xs font-bold",
                    q.correct
                      ? "bg-emerald-500/12 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                      : "bg-rose-500/12 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300"
                  )}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold leading-snug">{q.text}</p>
                    <span className={cn("shrink-0 text-xs font-semibold", q.correct ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                      {q.correct ? "Correct" : "Incorrect"}
                    </span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <AnswerBox
                      label={q.type === "MULTIPLE_CHOICE" ? "Your answers" : "Your answer"}
                      text={q.selectedOptionText ?? "No answer"}
                      good={q.correct}
                    />
                    {!q.correct && q.correctOptionText && (
                      <AnswerBox
                        label={q.type === "MULTIPLE_CHOICE" ? "Correct answers" : q.type === "SHORT_ANSWER" ? "Accepted answers" : "Correct answer"}
                        text={q.correctOptionText}
                        good
                      />
                    )}
                  </div>
                  {q.explanation && (
                    <p className="flex gap-2 rounded-xl bg-amber-500/10 px-3.5 py-2.5 text-sm text-amber-900 dark:text-amber-200">
                      <Lightbulb className="mt-0.5 size-4 shrink-0" /> {q.explanation}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  )
}

function AnswerBox({ label, text, good }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm",
        good
          ? "border-emerald-500/30 bg-emerald-500/8 dark:bg-emerald-500/10"
          : "border-rose-500/30 bg-rose-500/8 dark:bg-rose-500/10"
      )}
    >
      {good ? (
        <RiCheckboxCircleFill className="size-[18px] shrink-0 text-emerald-600 dark:text-emerald-400" />
      ) : (
        <BiSolidXCircle className="size-[18px] shrink-0 text-rose-600 dark:text-rose-400" />
      )}
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium">{text}</p>
      </div>
    </div>
  )
}
