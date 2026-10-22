import { Fragment, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Loader2, Send } from "lucide-react"
import { MdAccessTimeFilled, MdDelete, MdEdit, MdStickyNote2, MdAutoAwesome, MdRefresh } from "react-icons/md"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useFetch } from "@/hooks/useFetch"
import { formatTimestamp } from "@/hooks/useVideoClock"
import { noteService } from "@/services/note.service"
import { assistantService } from "@/services/assistant.service"
import { getErrorMessage } from "@/lib/api"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"

/**
 * Notes + AI tutor under the lesson player.
 * `clock` comes from useVideoClock: notes pin to the video's current time and clicking a time seeks back to it.
 */
export default function LessonTools({ lessonId, clock, isAuthed, onLogin }) {
  const { t } = useTranslation()
  const [tab, setTab] = useState("notes")
  const tabs = [
    { key: "notes", label: t("learn.tools.notes"), icon: MdStickyNote2 },
    { key: "tutor", label: t("learn.tools.tutor"), icon: MdAutoAwesome },
  ]

  return (
    <section className="overflow-hidden rounded-2xl border bg-card">
      <div role="tablist" className="flex gap-1 border-b px-2 pt-2">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            role="tab"
            type="button"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              "-mb-px flex items-center gap-1.5 border-b-2 px-3 pb-2.5 pt-1.5 text-sm font-medium transition-colors",
              tab === key ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className={cn("size-4", tab === key && "text-primary")} /> {label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {!isAuthed ? (
          <SignInPrompt text={t(tab === "notes" ? "learn.notes.signIn" : "learn.tutor.signIn")} onLogin={onLogin} />
        ) : tab === "notes" ? (
          <NotesPanel lessonId={lessonId} clock={clock} />
        ) : (
          <TutorPanel lessonId={lessonId} />
        )}
      </div>
    </section>
  )
}

function SignInPrompt({ text, onLogin }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <p className="text-sm text-muted-foreground">{text}</p>
      <Button size="sm" onClick={onLogin}>{t("common.nav.logIn")}</Button>
    </div>
  )
}

// ---------- Notes ----------

function TimeChip({ seconds, onClick, title }) {
  const Tag = onClick ? "button" : "span"
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      title={title}
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1 rounded-md bg-primary/10 px-1.5 text-xs font-semibold tabular-nums text-primary dark:bg-primary/20",
        onClick && "transition-colors hover:bg-primary hover:text-primary-foreground"
      )}
    >
      <MdAccessTimeFilled className="size-3.5" /> {formatTimestamp(seconds)}
    </Tag>
  )
}

function NotesPanel({ lessonId, clock }) {
  const { t } = useTranslation()
  const { data, loading, error, reload } = useFetch(() => noteService.forLesson(lessonId), [lessonId])
  const [notes, setNotes] = useState(null)
  const list = notes ?? data ?? []
  useEffect(() => setNotes(null), [data])

  const [body, setBody] = useState("")
  const [pin, setPin] = useState(true) // attach the current video time
  const [now, setNow] = useState(0)
  const [busy, setBusy] = useState(false)

  // Keep the "Pin to 4:32" label in step with the video while typing
  const { hasVideo, getTime } = clock
  useEffect(() => {
    if (!hasVideo) return
    const tick = () => setNow(getTime() ?? 0)
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [hasVideo, getTime])

  const add = async (e) => {
    e?.preventDefault()
    const text = body.trim()
    if (!text) return
    setBusy(true)
    try {
      const timestampSeconds = clock.hasVideo && pin ? clock.getTime() ?? 0 : null
      const created = await noteService.create({ lessonId, timestampSeconds, body: text })
      setNotes(sortNotes([...list, created]))
      setBody("")
    } catch (err) {
      toast.error(t("common.states.error"), getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const save = async (note, text) => {
    const updated = await noteService.update(note.id, { lessonId, timestampSeconds: note.timestampSeconds, body: text })
    setNotes(list.map((n) => (n.id === note.id ? updated : n)))
  }

  const remove = async (note) => {
    const before = list
    setNotes(list.filter((n) => n.id !== note.id))
    try {
      await noteService.remove(note.id)
      toast.success(t("learn.notes.deleted"))
    } catch (err) {
      setNotes(before)
      toast.error(t("common.states.error"), getErrorMessage(err))
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={add} className="rounded-xl border bg-background focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/30">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === "Enter" && add()}
          placeholder={t("learn.notes.placeholder")}
          maxLength={2000}
          className="min-h-20 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
        <div className="flex items-center justify-between gap-2 border-t px-2 py-2">
          {clock.hasVideo ? (
            <label className="flex cursor-pointer select-none items-center gap-2 text-xs text-muted-foreground">
              <Checkbox size="sm" checked={pin} onChange={setPin} />
              {t("learn.notes.attachTime", { time: formatTimestamp(now) })}
            </label>
          ) : (
            <span className="text-xs text-muted-foreground">{t("learn.notes.noVideo")}</span>
          )}
          <Button type="submit" size="sm" disabled={busy || !body.trim()}>
            {busy && <Loader2 className="animate-spin" />} {t("learn.notes.add")}
          </Button>
        </div>
      </form>

      {loading && !notes ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> {t("common.states.loading")}</p>
      ) : error ? (
        <p className="text-sm text-destructive">
          {getErrorMessage(error)} <button className="underline" onClick={reload}>{t("common.actions.retry")}</button>
        </p>
      ) : list.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">{t("learn.notes.empty")}</p>
      ) : (
        <ul className="space-y-2">
          {list.map((n) => (
            <NoteItem key={n.id} note={n} clock={clock} onSave={save} onRemove={remove} />
          ))}
        </ul>
      )}
    </div>
  )
}

const sortNotes = (notes) =>
  [...notes].sort((a, b) => {
    if (a.timestampSeconds == null) return b.timestampSeconds == null ? 0 : 1
    if (b.timestampSeconds == null) return -1
    return a.timestampSeconds - b.timestampSeconds
  })

function NoteItem({ note, clock, onSave, onRemove }) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(note.body)
  const [busy, setBusy] = useState(false)
  const time = note.timestampSeconds

  const submit = async () => {
    if (!text.trim()) return
    setBusy(true)
    try {
      await onSave(note, text.trim())
      setEditing(false)
    } catch (err) {
      toast.error(t("common.states.error"), getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <li className="group flex gap-3 rounded-xl border bg-background p-3">
      <div className="pt-0.5">
        {time != null ? (
          <TimeChip
            seconds={time}
            title={t("learn.notes.jump", { time: formatTimestamp(time) })}
            onClick={clock.hasVideo ? () => clock.seek(time) : undefined}
          />
        ) : (
          <span className="inline-flex h-6 items-center rounded-md bg-muted px-1.5 text-xs text-muted-foreground">{t("learn.notes.noTime")}</span>
        )}
      </div>
      {editing ? (
        <div className="flex-1 space-y-2">
          <Textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} autoFocus className="min-h-16" />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => { setText(note.body); setEditing(false) }}>{t("common.actions.cancel")}</Button>
            <Button size="sm" onClick={submit} disabled={busy || !text.trim()}>
              {busy && <Loader2 className="animate-spin" />} {t("common.actions.save")}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <p className="min-w-0 flex-1 whitespace-pre-line break-words text-sm leading-relaxed">{note.body}</p>
          <div className="flex shrink-0 items-start gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
            <Button size="icon" variant="ghost" className="size-7" onClick={() => setEditing(true)} aria-label={t("common.actions.edit")}>
              <MdEdit className="size-4" />
            </Button>
            <Button size="icon" variant="ghost" className="size-7 hover:text-destructive" onClick={() => onRemove(note)} aria-label={t("common.actions.delete")}>
              <MdDelete className="size-4" />
            </Button>
          </div>
        </>
      )}
    </li>
  )
}

// ---------- AI tutor ----------

function TutorPanel({ lessonId }) {
  const { t, i18n } = useTranslation()
  const { data: status, loading: statusLoading } = useFetch(() => assistantService.status(), [])
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const endRef = useRef(null)

  // A new lesson starts a fresh conversation
  useEffect(() => {
    setMessages([])
    setError("")
  }, [lessonId])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [messages, busy])

  const ask = async (question) => {
    const text = (question ?? input).trim()
    if (!text || busy) return
    const history = [...messages, { role: "user", content: text }]
    setMessages(history)
    setInput("")
    setError("")
    setBusy(true)
    try {
      const lang = (i18n.resolvedLanguage || i18n.language) === "km" ? "km" : "en"
      const { reply } = await assistantService.ask(lessonId, history.slice(-20), lang)
      setMessages([...history, { role: "assistant", content: reply }])
    } catch (err) {
      setError(getErrorMessage(err, t("learn.tutor.error")))
    } finally {
      setBusy(false)
    }
  }

  if (statusLoading) {
    return <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> {t("common.states.loading")}</p>
  }
  if (!status?.enabled) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <span className="grid size-10 place-items-center rounded-full bg-muted"><MdAutoAwesome className="size-5 text-muted-foreground" /></span>
        <p className="max-w-sm text-sm text-muted-foreground">{t("learn.tutor.disabled")}</p>
      </div>
    )
  }

  const suggestions = ["summarize", "example", "quiz"].map((k) => t(`learn.tutor.suggestions.${k}`))

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs text-muted-foreground">{t("learn.tutor.subtitle")}</p>
        {messages.length > 0 && (
          <Button size="sm" variant="ghost" className="h-7 shrink-0 text-xs" onClick={() => { setMessages([]); setError("") }}>
            <MdRefresh className="size-4" /> {t("learn.tutor.clear")}
          </Button>
        )}
      </div>

      {messages.length === 0 ? (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => ask(s)}
              className="rounded-full border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
            >
              {s}
            </button>
          ))}
        </div>
      ) : (
        <div className="max-h-[28rem] space-y-3 overflow-y-auto pr-1">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start gap-2")}>
              {m.role === "assistant" && (
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                  <MdAutoAwesome className="size-3.5" />
                </span>
              )}
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                  m.role === "user" ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-muted"
                )}
              >
                {m.role === "user" ? <p className="whitespace-pre-line">{m.content}</p> : <RichText text={m.content} />}
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="grid size-7 place-items-center rounded-full bg-primary text-primary-foreground"><MdAutoAwesome className="size-3.5" /></span>
              <Loader2 className="size-4 animate-spin" /> {t("learn.tutor.thinking")}
            </div>
          )}
          <div ref={endRef} />
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <form
        onSubmit={(e) => { e.preventDefault(); ask() }}
        className="flex items-end gap-2 rounded-xl border bg-background p-1.5 focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/30"
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask() }
          }}
          placeholder={t("learn.tutor.placeholder")}
          maxLength={4000}
          rows={1}
          className="max-h-40 min-h-9 resize-none border-0 bg-transparent py-1.5 shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
        <Button type="submit" size="icon" className="shrink-0" disabled={busy || !input.trim()} aria-label={t("learn.tutor.send")}>
          {busy ? <Loader2 className="animate-spin" /> : <Send />}
        </Button>
      </form>
    </div>
  )
}

// Light formatting for tutor replies: ``` code blocks, `inline code`, **bold**, and bullet lines
function RichText({ text }) {
  const parts = text.split(/```[\w-]*\n?/)
  return (
    <div className="space-y-2">
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <pre key={i} className="overflow-x-auto rounded-lg bg-neutral-900 p-3 text-xs leading-relaxed text-neutral-100">
            <code>{part.replace(/\n$/, "")}</code>
          </pre>
        ) : (
          part
            .split(/\n{2,}/)
            .filter((p) => p.trim())
            .map((p, j) => (
              <p key={`${i}-${j}`} className="whitespace-pre-line">
                <Inline text={p.replace(/^#{1,6}\s+/gm, "")} />
              </p>
            ))
        )
      )}
    </div>
  )
}

function Inline({ text }) {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/).map((s, i) =>
    s.startsWith("`") && s.endsWith("`") && s.length > 2 ? (
      <code key={i} className="rounded bg-background/70 px-1 py-0.5 font-mono text-[0.85em]">{s.slice(1, -1)}</code>
    ) : s.startsWith("**") && s.endsWith("**") && s.length > 4 ? (
      <strong key={i}>{s.slice(2, -2)}</strong>
    ) : (
      <Fragment key={i}>{s}</Fragment>
    )
  )
}
