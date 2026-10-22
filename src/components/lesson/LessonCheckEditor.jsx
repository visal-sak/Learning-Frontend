import { useTranslation } from "react-i18next"
import { Check, Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react"
import { MdQuiz } from "react-icons/md"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { NativeSelect } from "@/components/ui/native-select"
import { QUESTION_TYPES } from "@/lib/quiz"
import { cn } from "@/lib/utils"

const blank = (type = "SINGLE_CHOICE") => ({
  type,
  text: "",
  explanation: "",
  options: type === "TRUE_FALSE" ? [{ text: "True", correct: true }, { text: "False", correct: false }]
    : type === "SHORT_ANSWER" ? []
      : [{ text: "", correct: true }, { text: "", correct: false }],
  acceptedAnswers: type === "SHORT_ANSWER" ? [""] : [],
})

// Drop untouched questions before saving
export const cleanCheck = (questions) =>
  questions
    .filter((q) => q.text.trim())
    .map((q) => ({
      ...q,
      text: q.text.trim(),
      options: q.type === "SHORT_ANSWER" ? [] : q.options.filter((o) => o.text.trim()),
      acceptedAnswers: q.type === "SHORT_ANSWER" ? q.acceptedAnswers.map((a) => a.trim()).filter(Boolean) : [],
    }))

/** Instructor editor for the lesson's quiz questions (saved together with the lesson). */
export default function LessonCheckEditor({ value, onChange }) {
  const { t } = useTranslation()
  const update = (i, patch) => onChange(value.map((q, j) => (j === i ? { ...q, ...patch } : q)))
  const move = (i, dir) => {
    const next = [...value]
    ;[next[i], next[i + dir]] = [next[i + dir], next[i]]
    onChange(next)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-medium"><MdQuiz className="size-4 text-primary" /> {t("learn.checkEditor.title")}</p>
          <p className="text-xs text-muted-foreground">{t("learn.checkEditor.hint")}</p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={() => onChange([...value, blank()])} disabled={value.length >= 30}>
          <Plus /> {t("learn.checkEditor.add")}
        </Button>
      </div>

      {value.length === 0 && <p className="rounded-xl border border-dashed px-4 py-5 text-center text-sm text-muted-foreground">{t("learn.checkEditor.empty")}</p>}

      <ol className="space-y-2">
        {value.map((q, i) => (
          <li key={q.id ?? `new-${i}`} className="rounded-xl border bg-card">
            <div className="flex items-center gap-2 border-b px-3 py-1.5">
              <span className="grid size-6 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{i + 1}</span>
              <NativeSelect
                value={q.type}
                onChange={(e) => update(i, { ...blank(e.target.value), text: q.text, explanation: q.explanation })}
                className="h-7 w-44 text-xs"
                aria-label={t("learn.checkEditor.type")}
              >
                {QUESTION_TYPES.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
              </NativeSelect>
              <span className="flex-1" />
              <IconBtn label={t("learn.editor.moveUp")} disabled={i === 0} onClick={() => move(i, -1)}><ChevronUp /></IconBtn>
              <IconBtn label={t("learn.editor.moveDown")} disabled={i === value.length - 1} onClick={() => move(i, 1)}><ChevronDown /></IconBtn>
              <IconBtn label={t("common.actions.delete")} className="hover:text-destructive" onClick={() => onChange(value.filter((_, j) => j !== i))}><Trash2 /></IconBtn>
            </div>

            <div className="space-y-3 p-3">
              <Input value={q.text} onChange={(e) => update(i, { text: e.target.value })} placeholder={t("learn.checkEditor.questionPh")} maxLength={1000} className="font-medium" />

              {q.type === "SHORT_ANSWER" ? (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">{t("learn.checkEditor.accepted")}</p>
                  {q.acceptedAnswers.map((a, ai) => (
                    <div key={ai} className="flex gap-2">
                      <Input value={a} maxLength={200} className="h-8 text-sm" placeholder={t("learn.checkEditor.answerPh")}
                        onChange={(e) => update(i, { acceptedAnswers: q.acceptedAnswers.map((x, xi) => (xi === ai ? e.target.value : x)) })} />
                      <IconBtn label={t("common.actions.remove")} disabled={q.acceptedAnswers.length <= 1} onClick={() => update(i, { acceptedAnswers: q.acceptedAnswers.filter((_, xi) => xi !== ai) })}><Trash2 /></IconBtn>
                    </div>
                  ))}
                  {q.acceptedAnswers.length < 10 && (
                    <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={() => update(i, { acceptedAnswers: [...q.acceptedAnswers, ""] })}><Plus /> {t("learn.checkEditor.addAnswer")}</Button>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">{t(q.type === "MULTIPLE_CHOICE" ? "learn.checkEditor.markAll" : "learn.checkEditor.markOne")}</p>
                  {q.options.map((o, oi) => {
                    const multi = q.type === "MULTIPLE_CHOICE"
                    const setCorrect = () =>
                      update(i, { options: q.options.map((x, xi) => ({ ...x, correct: multi ? (xi === oi ? !x.correct : x.correct) : xi === oi })) })
                    return (
                      <div key={oi} className={cn("flex items-center gap-2 rounded-lg border p-1 pl-1.5", o.correct && "border-emerald-500/50 bg-emerald-500/[0.06]")}>
                        <button
                          type="button"
                          role={multi ? "checkbox" : "radio"}
                          aria-checked={!!o.correct}
                          onClick={setCorrect}
                          className={cn(
                            "grid size-5 shrink-0 place-items-center border-2",
                            multi ? "rounded-[5px]" : "rounded-full",
                            o.correct ? "border-emerald-500 bg-emerald-500 text-white" : "border-neutral-300 hover:border-emerald-400 dark:border-neutral-600"
                          )}
                        >
                          {o.correct && <Check className="size-3" strokeWidth={3.5} />}
                        </button>
                        {q.type === "TRUE_FALSE" ? (
                          <span className="px-2 py-1 text-sm">{t(`learn.check.${o.text.toLowerCase()}`)}</span>
                        ) : (
                          <Input value={o.text} maxLength={500} placeholder={t("learn.checkEditor.optionPh", { n: oi + 1 })}
                            onChange={(e) => update(i, { options: q.options.map((x, xi) => (xi === oi ? { ...x, text: e.target.value } : x)) })}
                            className="h-8 border-0 bg-transparent text-sm shadow-none focus-visible:ring-0 dark:bg-transparent" />
                        )}
                        {q.type !== "TRUE_FALSE" && (
                          <IconBtn label={t("common.actions.remove")} disabled={q.options.length <= 2} onClick={() => update(i, { options: q.options.filter((_, xi) => xi !== oi) })}><Trash2 /></IconBtn>
                        )}
                      </div>
                    )
                  })}
                  {q.type !== "TRUE_FALSE" && q.options.length < 6 && (
                    <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={() => update(i, { options: [...q.options, { text: "", correct: false }] })}><Plus /> {t("learn.checkEditor.addOption")}</Button>
                  )}
                </div>
              )}

              <Textarea value={q.explanation ?? ""} onChange={(e) => update(i, { explanation: e.target.value })} placeholder={t("learn.checkEditor.explanationPh")} maxLength={2000} className="min-h-14 text-sm" />
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

function IconBtn({ label, className, children, ...props }) {
  return (
    <Button type="button" size="icon" variant="ghost" className={cn("size-7 text-muted-foreground", className)} aria-label={label} title={label} {...props}>
      {children}
    </Button>
  )
}
