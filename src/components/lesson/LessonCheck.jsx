import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Check, ChevronLeft, ChevronRight, Loader2, RotateCcw, X } from "lucide-react"
import { MdQuiz, MdLightbulb } from "react-icons/md"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useFetch } from "@/hooks/useFetch"
import { lessonCheckService } from "@/services/lessonCheck.service"
import { getErrorMessage } from "@/lib/api"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import { AiExplain, AiHint, useAiHelper } from "./AiHelper"

const LETTERS = "ABCDEF"

const isAnswered = (q, v) => (Array.isArray(v) ? v.length > 0 : q.type === "SHORT_ANSWER" ? typeof v === "string" && v.trim() !== "" : v != null)

/**
 * "Check your understanding" at the end of a lesson, or (item) the whole page of a quiz item in the
 * curriculum. One question at a time, then a results review. Hidden when there are no questions.
 * onCompleted(progress) fires when a submission completed the item.
 */
export default function LessonCheck({ lessonId, item = false, onCompleted }) {
  const { t } = useTranslation()
  const { data, loading } = useFetch(() => lessonCheckService.take(lessonId).catch(() => null), [lessonId])
  const [answers, setAnswers] = useState({}) // questionId → number | number[] | string
  const [step, setStep] = useState(0)
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const helper = useAiHelper("lesson-checks", data?.questions?.length ? lessonId : null)

  const questions = data?.questions ?? []
  if (loading || !questions.length) return null

  const total = questions.length
  const q = questions[Math.min(step, total - 1)]
  const answeredCount = questions.filter((x) => isAnswered(x, answers[x.id])).length
  const last = data.myResult
  const passMark = data.passMark

  const pick = (i) =>
    setAnswers((a) => {
      if (q.type !== "MULTIPLE_CHOICE") return { ...a, [q.id]: i }
      const cur = a[q.id] ?? []
      return { ...a, [q.id]: cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i] }
    })

  const submit = async () => {
    setBusy(true)
    try {
      const payload = questions.map((x) => {
        const v = answers[x.id]
        return x.type === "SHORT_ANSWER" ? { questionId: x.id, text: v ?? "" } : { questionId: x.id, selected: v == null ? [] : [].concat(v) }
      })
      const res = await lessonCheckService.submit(lessonId, payload)
      setResult(res)
      helper.reload() // the next attempt starts with a fresh set of hints
      if (res.progress) onCompleted?.(res.progress)
    } catch (err) {
      toast.error(t("common.states.error"), getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const retry = () => {
    setAnswers({})
    setResult(null)
    setStep(0)
  }

  return (
    <section className="overflow-hidden rounded-2xl border bg-card">
      {/* header: title + progress */}
      <header className="space-y-3 border-b px-5 py-3.5">
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
            <MdQuiz className="size-[18px]" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold leading-tight">{item ? t("learn.check.itemTitle") : t("learn.check.title")}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("learn.check.subtitle", { count: total })}
              {passMark != null && item && <> · {t("learn.check.passMark", { value: passMark })}</>}
              {last && !result && <> · {t("learn.check.lastScore", { correct: last.correct, total: last.total })}</>}
            </p>
          </div>
          {!result && (
            <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold tabular-nums text-muted-foreground">
              {t("learn.check.questionOf", { n: step + 1, total })}
            </span>
          )}
        </div>
        {!result && (
          // one segment per question: filled = answered, ring = current
          <div className="flex gap-1.5" role="tablist" aria-label={t("learn.check.title")}>
            {questions.map((x, i) => (
              <button
                key={x.id}
                type="button"
                role="tab"
                aria-selected={i === step}
                aria-label={t("learn.check.questionOf", { n: i + 1, total })}
                onClick={() => setStep(i)}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  isAnswered(x, answers[x.id]) ? "bg-primary" : i === step ? "bg-primary/35" : "bg-neutral-200 dark:bg-neutral-700"
                )}
              />
            ))}
          </div>
        )}
      </header>

      {result ? (
        <Results lessonId={lessonId} helper={helper} questions={questions} answers={answers} result={result} item={item} passMark={passMark} requirePass={data.requirePass} onRetry={retry} />
      ) : (
        <>
          {/* one question */}
          <div key={q.id} className="space-y-3 px-5 py-5 animate-in fade-in-0 slide-in-from-right-2 duration-200">
            <div className="space-y-1">
              <p className="text-[15px] font-semibold leading-snug text-balance">{q.text}</p>
              {q.type === "MULTIPLE_CHOICE" && !/select all/i.test(q.text) && (
                <p className="text-xs text-muted-foreground">{t("learn.check.pickAll")}</p>
              )}
            </div>

            {q.type === "SHORT_ANSWER" ? (
              <Input
                value={answers[q.id] ?? ""}
                onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && (step < total - 1 ? setStep(step + 1) : submit())}
                placeholder={t("learn.check.typeAnswer")}
                maxLength={200}
                className="h-9"
                autoFocus
              />
            ) : (
              <div className="grid gap-1.5" role={q.type === "MULTIPLE_CHOICE" ? "group" : "radiogroup"}>
                {q.options.map((o, i) => {
                  const v = answers[q.id]
                  const selected = Array.isArray(v) ? v.includes(i) : v === i
                  const label = o.text === "True" || o.text === "False" ? t(`learn.check.${o.text.toLowerCase()}`) : o.text
                  return (
                    <button
                      key={i}
                      type="button"
                      role={q.type === "MULTIPLE_CHOICE" ? "checkbox" : "radio"}
                      aria-checked={selected}
                      onClick={() => pick(i)}
                      className={cn(
                        "group flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left text-sm transition-colors",
                        selected
                          ? "border-primary/60 bg-primary/[0.05] dark:bg-primary/15"
                          : "hover:border-primary/30 hover:bg-primary/[0.02]"
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-6 shrink-0 place-items-center text-[11px] font-semibold transition-colors",
                          q.type === "MULTIPLE_CHOICE" ? "rounded-md" : "rounded-full",
                          selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:text-foreground"
                        )}
                      >
                        {selected && q.type === "MULTIPLE_CHOICE" ? <Check className="size-3.5" strokeWidth={3} /> : LETTERS[i]}
                      </span>
                      <span className="min-w-0 flex-1">{label}</span>
                    </button>
                  )
                })}
              </div>
            )}

            <AiHint
              scope="lesson-checks"
              id={lessonId}
              questionId={q.id}
              helper={helper}
              answer={q.type === "SHORT_ANSWER" ? { text: answers[q.id] ?? "" } : { selected: answers[q.id] == null ? [] : [].concat(answers[q.id]) }}
            />
          </div>

          {/* navigation */}
          <footer className="flex items-center justify-between gap-3 border-t bg-muted/30 px-5 py-3">
            <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)} disabled={step === 0}>
              <ChevronLeft /> {t("learn.check.back")}
            </Button>
            <span className="hidden text-xs text-muted-foreground sm:inline">{t("learn.check.progress", { answered: answeredCount, total })}</span>
            {step < total - 1 ? (
              <Button size="sm" onClick={() => setStep(step + 1)}>
                {t("learn.check.next")} <ChevronRight />
              </Button>
            ) : (
              <Button size="sm" onClick={submit} disabled={busy || answeredCount === 0}>
                {busy && <Loader2 className="animate-spin" />} {t("learn.check.submit")}
              </Button>
            )}
          </footer>
        </>
      )}
    </section>
  )
}

// Score ring + every question with what was right, and why
function Results({ lessonId, helper, questions, answers, result, item, passMark, requirePass, onRetry }) {
  const { t } = useTranslation()
  const byId = Object.fromEntries((result.results ?? []).map((r) => [r.questionId, r]))
  const pct = result.scorePercent ?? Math.round((result.correct / result.total) * 100)
  const good = item ? result.passed : result.correct === result.total
  const R = 30
  const C = 2 * Math.PI * R

  const message = item
    ? result.passed
      ? t("learn.check.itemPassed", { score: pct })
      : requirePass
        ? t("learn.check.itemFailedRequired", { score: pct, value: passMark })
        : t("learn.check.itemFailed", { score: pct, value: passMark })
    : good ? t("learn.check.allRight") : t("learn.check.score", { correct: result.correct, total: result.total })

  return (
    <div className="animate-in fade-in-0 duration-200">
      <div className="flex flex-col items-center gap-4 px-5 py-6 text-center sm:flex-row sm:text-left">
        <div className="relative grid size-20 shrink-0 place-items-center">
          <svg viewBox="0 0 72 72" className="absolute inset-0 -rotate-90">
            <circle cx="36" cy="36" r={R} fill="none" strokeWidth="7" className="stroke-neutral-200 dark:stroke-neutral-700" />
            <circle
              cx="36" cy="36" r={R} fill="none" strokeWidth="7" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)}
              className={cn("transition-[stroke-dashoffset] duration-700", good ? "stroke-emerald-500" : "stroke-primary")}
            />
          </svg>
          <span className="text-lg font-bold tabular-nums">{pct}%</span>
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-base font-semibold">{t("learn.check.resultTitle", { correct: result.correct, total: result.total })}</p>
          <p className={cn("text-sm", good ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground")}>{message}</p>
        </div>
        <Button variant="bordered" size="sm" onClick={onRetry} className="shrink-0">
          <RotateCcw /> {t("learn.check.retry")}
        </Button>
      </div>

      <ol className="divide-y border-t">
        {questions.map((q, qi) => {
          const r = byId[q.id] ?? {}
          const v = answers[q.id]
          return (
            <li key={q.id} className="space-y-2.5 px-5 py-4">
              <div className="flex gap-3">
                <span className={cn("grid size-6 shrink-0 place-items-center rounded-full text-white", r.correct ? "bg-emerald-500" : "bg-rose-500")}>
                  {r.correct ? <Check className="size-3.5" strokeWidth={3} /> : <X className="size-3.5" strokeWidth={3} />}
                </span>
                <p className="min-w-0 flex-1 font-medium leading-snug">
                  <span className="text-muted-foreground">{qi + 1}. </span>{q.text}
                </p>
              </div>

              {q.type === "SHORT_ANSWER" ? (
                <div className="space-y-1 pl-9 text-sm">
                  <p>
                    <span className="text-muted-foreground">{t("learn.check.yourAnswer")}: </span>
                    <span className={cn("font-medium", r.correct ? "text-emerald-700 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>{v?.trim() || "—"}</span>
                  </p>
                  {!r.correct && r.acceptedAnswers?.length > 0 && (
                    <p><span className="text-muted-foreground">{t("learn.check.accepted")}: </span><span className="font-medium">{r.acceptedAnswers.join(", ")}</span></p>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5 pl-9">
                  {q.options.map((o, i) => {
                    const picked = Array.isArray(v) ? v.includes(i) : v === i
                    const right = r.correctOptions?.includes(i)
                    if (!picked && !right) return null
                    const label = o.text === "True" || o.text === "False" ? t(`learn.check.${o.text.toLowerCase()}`) : o.text
                    return (
                      <span
                        key={i}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-sm",
                          right ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300" : "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300"
                        )}
                      >
                        <span className="font-semibold">{LETTERS[i]}</span> {label}
                        {right ? <Check className="size-3.5" /> : <X className="size-3.5" />}
                      </span>
                    )
                  })}
                </div>
              )}

              {r.explanation && (
                <p className="ml-9 flex gap-2 rounded-lg bg-amber-500/[0.08] px-3 py-2 text-sm text-foreground/80">
                  <MdLightbulb className="mt-0.5 size-4 shrink-0 text-amber-500" />
                  <span>{r.explanation}</span>
                </p>
              )}
              <div className="ml-9">
                <AiExplain
                  scope="lesson-checks"
                  id={lessonId}
                  questionId={q.id}
                  helper={helper}
                  answer={q.type === "SHORT_ANSWER" ? { text: v ?? "" } : { selected: v == null ? [] : [].concat(v) }}
                />
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
