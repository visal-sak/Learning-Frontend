import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { aiHelperService } from "@/services/aiHelper.service"
import { getErrorMessage } from "@/lib/api"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import { BunnyAvatar, BunnyBubble } from "@/components/ai/Bunny"

const lang = (i18n) => ((i18n.resolvedLanguage || i18n.language) === "km" ? "km" : "en")

/**
 * What the AI helper may do in this quiz right now (hints left on this attempt, explanations on/off).
 * Returns null while loading or when unavailable. reload() after submitting starts a fresh attempt.
 */
export function useAiHelper(scope, id) {
  const [status, setStatus] = useState(null)
  const [hints, setHints] = useState({}) // questionId → [hint…] for the current attempt
  const reload = useCallback(() => {
    if (!id) return
    setHints({})
    aiHelperService.status(scope, id).then(setStatus).catch(() => setStatus(null))
  }, [scope, id])
  useEffect(() => {
    reload()
  }, [reload])
  const addHint = (questionId, hint, hintsUsed, hintsLeft) => {
    setHints((h) => ({ ...h, [questionId]: [...(h[questionId] ?? []), hint] }))
    setStatus((s) => (s ? { ...s, hintsUsed, hintsLeft } : s))
  }
  return { status, reload, hints, addHint }
}

// "Ask Bunny" pill: bunny face + label + optional count
function AskBunnyButton({ onClick, disabled, children, count }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group inline-flex h-8 items-center gap-2 rounded-full border border-primary/20 bg-background py-0 pl-1 pr-3 text-xs font-semibold text-primary shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-all hover:-translate-y-px hover:border-primary/40 hover:bg-primary/[0.05] disabled:pointer-events-none disabled:opacity-50"
    >
      <BunnyAvatar size={24} className="transition-transform group-hover:rotate-[-8deg]" />
      {children}
      {count != null && <span className="rounded-full bg-primary/10 px-1.5 py-px text-[10px] font-semibold tabular-nums">{count}</span>}
    </button>
  )
}

/** "Ask Bunny for a hint" for one question while answering; hints given so far stay as chat bubbles. */
export function AiHint({ scope, id, questionId, answer, helper }) {
  const { t, i18n } = useTranslation()
  const [busy, setBusy] = useState(false)
  const s = helper.status
  const hints = helper.hints[questionId] ?? []
  if (!s?.hintsEnabled) return null

  const ask = async () => {
    setBusy(true)
    try {
      const res = await aiHelperService.hint(scope, id, questionId, answer ?? {}, hints, lang(i18n))
      helper.addHint(questionId, res.hint, res.hintsUsed, res.hintsLeft)
    } catch (err) {
      toast.error(t("learn.ai.hintFailed"), getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const left = s.hintsLeft ?? 0
  return (
    <div className="space-y-2.5 pt-1">
      {hints.map((h, i) => (
        <BunnyBubble key={i} label={t("learn.ai.hintN", { n: i + 1 })}>{h}</BunnyBubble>
      ))}
      {busy && <BunnyBubble thinking label={t("learn.ai.hintN", { n: hints.length + 1 })} />}
      <div className="flex flex-wrap items-center gap-2">
        <AskBunnyButton onClick={ask} disabled={busy || left <= 0} count={`${left}/${s.hintsPerAttempt}`}>
          {left > 0 ? t("learn.ai.askHint") : t("learn.ai.noHints")}
        </AskBunnyButton>
        {s.extraHints > 0 && (
          <span className="rounded-full bg-emerald-500/12 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
            {t("learn.ai.extraForLesson", { count: s.extraHints })}
          </span>
        )}
        {s.hintPenalty > 0 && <span className="text-[11px] text-muted-foreground">{t("learn.ai.penalty", { value: s.hintPenalty })}</span>}
      </div>
    </div>
  )
}

/** "Explain my answer" for one question after the quiz was submitted. */
export function AiExplain({ scope, id, questionId, answer, helper, className }) {
  const { t, i18n } = useTranslation()
  const [text, setText] = useState(null)
  const [busy, setBusy] = useState(false)
  if (!helper.status?.explainEnabled) return null

  const ask = async () => {
    setBusy(true)
    try {
      const res = await aiHelperService.explain(scope, id, questionId, answer, lang(i18n))
      setText(res.explanation)
    } catch (err) {
      toast.error(t("learn.ai.explainFailed"), getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (busy) return <BunnyBubble thinking tone="explain" label={t("learn.ai.explainTitle")} className={className} />
  if (text) {
    return (
      <BunnyBubble tone="explain" label={t("learn.ai.explainTitle")} className={className}>
        {text}
      </BunnyBubble>
    )
  }
  return (
    <div className={cn(className)}>
      <AskBunnyButton onClick={ask}>{t("learn.ai.explain")}</AskBunnyButton>
    </div>
  )
}
