import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { ChevronUp, ChevronDown, Trash2, Loader2, Upload } from "lucide-react"
import { MdTitle, MdNotes, MdLightbulb, MdCode, MdImage, MdHorizontalRule, MdFormatListBulleted, MdFormatQuote, MdTableChart } from "react-icons/md"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { NativeSelect } from "@/components/ui/native-select"
import CodeEditor from "./CodeEditor"
import LessonBlocks from "./LessonBlocks"
import { CODE_LANGUAGES, RUNNABLE } from "./code"
import { mediaService } from "@/services/media.service"
import { getErrorMessage } from "@/lib/api"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"

const TYPES = [
  { type: "heading", icon: MdTitle, make: () => ({ type: "heading", level: 2, text: "" }) },
  { type: "paragraph", icon: MdNotes, make: () => ({ type: "paragraph", text: "" }) },
  { type: "callout", icon: MdLightbulb, make: () => ({ type: "callout", variant: "tip", text: "" }) },
  { type: "code", icon: MdCode, make: () => ({ type: "code", language: "html", code: "", runnable: true }) },
  { type: "list", icon: MdFormatListBulleted, make: () => ({ type: "list", ordered: false, items: [""] }) },
  { type: "quote", icon: MdFormatQuote, make: () => ({ type: "quote", text: "", caption: "" }) },
  { type: "table", icon: MdTableChart, make: () => ({ type: "table", rows: [["", ""], ["", ""], ["", ""]] }) },
  { type: "image", icon: MdImage, make: () => ({ type: "image", url: "", caption: "" }) },
  { type: "divider", icon: MdHorizontalRule, make: () => ({ type: "divider" }) },
]
const iconOf = (type) => TYPES.find((x) => x.type === type)?.icon ?? MdNotes

// Drop empty blocks before saving (an image without a URL, a paragraph with no text…)
export const cleanBlocks = (blocks) =>
  blocks
    .map((b) =>
      b.type === "list" ? { ...b, items: (b.items ?? []).map((x) => x.trim()).filter(Boolean) }
        : b.type === "table" ? { ...b, rows: (b.rows ?? []).filter((r) => r.some((c) => c.trim())) }
          : b.type === "code" ? webParts(b)
          : b
    )
    .filter((b) =>
      b.type === "divider" ? true
        : b.type === "image" ? !!b.url?.trim()
          : b.type === "code" ? !!b.code?.trim()
            : b.type === "list" ? b.items.length > 0
              : b.type === "table" ? b.rows.length > 0
                : !!b.text?.trim()
    )

const PART_OF = { html: "html", css: "css", javascript: "js" }
const webParts = (b) => {
  const out = { ...b, html: null, css: null, js: null }
  if (!RUNNABLE.has(b.language)) return out
  for (const k of ["html", "css", "js"]) if (k !== PART_OF[b.language] && b[k]?.trim()) out[k] = b[k]
  return out
}

/** Blog-style lesson builder: a list of typed blocks with write / preview modes. */
export default function BlockEditor({ value, onChange }) {
  const { t } = useTranslation()
  const [mode, setMode] = useState("write")
  // stable keys for React while blocks move around
  const keys = useRef([])
  while (keys.current.length < value.length) keys.current.push(Math.random().toString(36).slice(2))

  const update = (i, patch) => onChange(value.map((b, j) => (j === i ? { ...b, ...patch } : b)))
  const add = (make) => {
    keys.current.push(Math.random().toString(36).slice(2))
    onChange([...value, make()])
  }
  const remove = (i) => {
    keys.current.splice(i, 1)
    onChange(value.filter((_, j) => j !== i))
  }
  const move = (i, dir) => {
    const next = [...value]
    const j = i + dir
    ;[next[i], next[j]] = [next[j], next[i]]
    ;[keys.current[i], keys.current[j]] = [keys.current[j], keys.current[i]]
    onChange(next)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{t("learn.editor.content")}</p>
          <p className="text-xs text-muted-foreground">{t("learn.editor.contentHint")}</p>
        </div>
        <div className="inline-flex shrink-0 rounded-lg bg-muted p-0.5">
          {["write", "preview"].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn("h-7 rounded-md px-3 text-xs font-medium", mode === m ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              {t(`learn.editor.${m}`)}
            </button>
          ))}
        </div>
      </div>

      {mode === "preview" ? (
        <div className="rounded-xl border p-5">
          {cleanBlocks(value).length ? <LessonBlocks blocks={cleanBlocks(value)} /> : <p className="text-center text-sm text-muted-foreground">{t("learn.editor.empty")}</p>}
        </div>
      ) : (
        <>
          {value.length === 0 && <p className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">{t("learn.editor.empty")}</p>}
          <ol className="space-y-2">
            {value.map((b, i) => {
              const Icon = iconOf(b.type)
              return (
                <li key={keys.current[i]} className="group rounded-xl border bg-card">
                  <div className="flex items-center gap-2 border-b px-3 py-1.5">
                    <Icon className="size-4 text-primary" />
                    <span className="mr-auto text-xs font-semibold text-muted-foreground">{t(`learn.editor.types.${b.type}`)}</span>
                    <BlockOptions block={b} onChange={(p) => update(i, p)} />
                    <Btn label={t("learn.editor.moveUp")} disabled={i === 0} onClick={() => move(i, -1)}><ChevronUp /></Btn>
                    <Btn label={t("learn.editor.moveDown")} disabled={i === value.length - 1} onClick={() => move(i, 1)}><ChevronDown /></Btn>
                    <Btn label={t("learn.editor.remove")} className="hover:text-destructive" onClick={() => remove(i)}><Trash2 /></Btn>
                  </div>
                  {b.type !== "divider" && (
                    <div className="p-3">
                      <BlockBody block={b} onChange={(p) => update(i, p)} />
                    </div>
                  )}
                </li>
              )
            })}
          </ol>

          {/* add bar */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-dashed p-2">
            <span className="px-1 text-xs font-medium text-muted-foreground">{t("learn.editor.add")}:</span>
            {TYPES.map(({ type, icon: Icon, make }) => (
              <button
                key={type}
                type="button"
                onClick={() => add(make)}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border bg-background px-2.5 text-xs font-medium transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
              >
                <Icon className="size-4" /> {t(`learn.editor.types.${type}`)}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function Btn({ label, className, children, ...props }) {
  return (
    <Button type="button" size="icon" variant="ghost" className={cn("size-7 text-muted-foreground", className)} aria-label={label} title={label} {...props}>
      {children}
    </Button>
  )
}

// Small per-type settings shown in the block's header row
function BlockOptions({ block: b, onChange }) {
  const { t } = useTranslation()
  const pill = (active) => cn("h-6 rounded-md px-2 text-[11px] font-medium", active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")
  if (b.type === "heading") {
    return (
      <div className="flex gap-0.5">
        {[2, 3].map((l) => (
          <button key={l} type="button" className={pill(b.level === l)} onClick={() => onChange({ level: l })}>{t(`learn.editor.level.${l}`)}</button>
        ))}
      </div>
    )
  }
  if (b.type === "callout") {
    return (
      <div className="flex gap-0.5">
        {["tip", "note", "warning"].map((v) => (
          <button key={v} type="button" className={pill(b.variant === v)} onClick={() => onChange({ variant: v })}>{t(`learn.blocks.${v}`)}</button>
        ))}
      </div>
    )
  }
  if (b.type === "list") {
    return (
      <div className="flex gap-0.5">
        {[false, true].map((o) => (
          <button key={String(o)} type="button" className={pill(!!b.ordered === o)} onClick={() => onChange({ ordered: o })}>
            {t(o ? "learn.editor.numbered" : "learn.editor.bullets")}
          </button>
        ))}
      </div>
    )
  }
  if (b.type === "code") {
    return (
      <NativeSelect
        value={b.language ?? ""}
        onChange={(e) => onChange({ language: e.target.value, runnable: RUNNABLE.has(e.target.value) ? b.runnable : false })}
        className="h-7 w-36 text-xs"
        aria-label="Language"
      >
        {CODE_LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
      </NativeSelect>
    )
  }
  return null
}

function BlockBody({ block: b, onChange }) {
  const { t } = useTranslation()
  switch (b.type) {
    case "heading":
      return (
        <Input
          value={b.text ?? ""}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder={t("learn.editor.headingPh")}
          className={cn("border-0 px-1 font-semibold shadow-none focus-visible:ring-0 dark:bg-transparent", b.level === 3 ? "text-base" : "text-lg")}
        />
      )
    case "paragraph":
    case "callout":
      return (
        <Textarea
          value={b.text ?? ""}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder={t(b.type === "paragraph" ? "learn.editor.paragraphPh" : "learn.editor.calloutPh")}
          className="min-h-16 border-0 px-1 shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
      )
    case "code":
      return (
        <div className="space-y-2">
          {RUNNABLE.has(b.language) ? (
            <WebCodeBody block={b} onChange={onChange} />
          ) : (
            <CodeEditor value={b.code ?? ""} onChange={(code) => onChange({ code })} language={b.language} placeholder={t("learn.editor.codePh")} className="max-h-96 rounded-lg border" minHeight={120} />
          )}
          {RUNNABLE.has(b.language) && (
            <label className="flex cursor-pointer items-center gap-2 text-xs">
              <Checkbox size="sm" checked={b.runnable} onChange={(v) => onChange({ runnable: v })} />
              <span className="font-medium">{t("learn.editor.runnable")}</span>
              <span className="text-muted-foreground">— {t("learn.editor.runnableHint")}</span>
            </label>
          )}
        </div>
      )
    case "image":
      return <ImageBody block={b} onChange={onChange} />
    case "list":
      return (
        <Textarea
          value={(b.items ?? []).join("\n")}
          onChange={(e) => onChange({ items: e.target.value.split("\n") })}
          placeholder={t("learn.editor.listPh")}
          className="min-h-20 border-0 px-1 shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
      )
    case "quote":
      return (
        <div className="space-y-2">
          <Textarea
            value={b.text ?? ""}
            onChange={(e) => onChange({ text: e.target.value })}
            placeholder={t("learn.editor.quotePh")}
            className="min-h-16 border-0 px-1 italic shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
          <Input value={b.caption ?? ""} onChange={(e) => onChange({ caption: e.target.value })} placeholder={t("learn.editor.quoteBy")} maxLength={300} className="h-8 text-xs" />
        </div>
      )
    case "table":
      return <TableBody rows={b.rows ?? []} onChange={(rows) => onChange({ rows })} />
    default:
      return null
  }
}

// HTML / CSS / JS tabs for a web example. The picked language's tab edits `code`; the other two are
// optional extra parts (`html`, `css`, `js`) that "Try it Yourself" loads together.
const WEB_TABS = [
  { key: "html", lang: "html", label: "HTML" },
  { key: "css", lang: "css", label: "CSS" },
  { key: "js", lang: "javascript", label: "JavaScript" },
]

function WebCodeBody({ block: b, onChange }) {
  const { t } = useTranslation()
  const mainKey = WEB_TABS.find((x) => x.lang === b.language)?.key ?? "html"
  const [tab, setTab] = useState(mainKey)
  const current = WEB_TABS.find((x) => x.key === tab) ?? WEB_TABS[0]
  const isMain = current.key === mainKey
  const value = isMain ? b.code ?? "" : b[current.key] ?? ""
  const has = (x) => (x.key === mainKey ? b.code : b[x.key])?.trim()

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="flex items-center gap-0.5 border-b bg-muted/40 px-1.5 pt-1">
        {WEB_TABS.map((x) => (
          <button
            key={x.key}
            type="button"
            onClick={() => setTab(x.key)}
            className={cn(
              "-mb-px flex items-center gap-1.5 rounded-t-md border border-b-0 px-2.5 py-1 text-xs font-semibold",
              tab === x.key ? "border-border bg-background text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {x.label}
            {x.key === mainKey ? (
              <span className="rounded bg-primary/10 px-1 text-[10px] font-medium text-primary">{t("learn.editor.mainPart")}</span>
            ) : has(x) ? (
              <span className="size-1.5 rounded-full bg-primary" />
            ) : null}
          </button>
        ))}
        <span className="ml-auto hidden pb-1 pr-1 text-[11px] text-muted-foreground sm:inline">{t("learn.editor.partsHint")}</span>
      </div>
      <CodeEditor
        key={current.key}
        value={value}
        onChange={(v) => onChange(isMain ? { code: v } : { [current.key]: v })}
        language={current.lang}
        placeholder={isMain ? t("learn.editor.codePh") : t("learn.editor.partPh", { part: current.label })}
        className="max-h-96"
        minHeight={120}
      />
    </div>
  )
}

// Spreadsheet-like grid; the first row is the header
function TableBody({ rows, onChange }) {
  const { t } = useTranslation()
  const cols = Math.max(1, ...rows.map((r) => r.length))
  const setCell = (i, j, v) => onChange(rows.map((r, ri) => (ri === i ? Array.from({ length: cols }, (_, cj) => (cj === j ? v : r[cj] ?? "")) : r)))
  const addRow = () => onChange([...rows, Array(cols).fill("")])
  const addCol = () => cols < 12 && onChange(rows.map((r) => [...r, ""]))
  const removeRow = (i) => rows.length > 1 && onChange(rows.filter((_, ri) => ri !== i))
  const removeCol = (j) => cols > 1 && onChange(rows.map((r) => r.filter((_, cj) => cj !== j)))

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className={cn("border-b last:border-b-0", i === 0 && "bg-primary/[0.06]")}>
                {Array.from({ length: cols }, (_, j) => (
                  <td key={j} className="min-w-28 border-r p-0 last:border-r-0">
                    <input
                      value={r[j] ?? ""}
                      onChange={(e) => setCell(i, j, e.target.value)}
                      placeholder={i === 0 ? t("learn.editor.headerCell") : ""}
                      maxLength={500}
                      className={cn("h-9 w-full bg-transparent px-2.5 outline-none focus:bg-primary/5", i === 0 && "font-semibold")}
                    />
                  </td>
                ))}
                <td className="w-8 p-0 text-center">
                  <Btn label={t("learn.editor.removeRow")} disabled={rows.length <= 1} className="hover:text-destructive" onClick={() => removeRow(i)}><Trash2 /></Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={addRow} disabled={rows.length >= 50}>+ {t("learn.editor.addRow")}</Button>
        <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={addCol} disabled={cols >= 12}>+ {t("learn.editor.addColumn")}</Button>
        <Button type="button" size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={() => removeCol(cols - 1)} disabled={cols <= 1}>− {t("learn.editor.removeColumn")}</Button>
      </div>
    </div>
  )
}

function ImageBody({ block: b, onChange }) {
  const { t } = useTranslation()
  const input = useRef(null)
  const [progress, setProgress] = useState(null)

  const upload = async (file) => {
    if (!file) return
    setProgress(0)
    try {
      const media = await mediaService.upload(file, setProgress)
      onChange({ url: media.uri })
    } catch (err) {
      toast.error(t("learn.editor.uploadFailed"), getErrorMessage(err))
    } finally {
      setProgress(null)
    }
  }

  return (
    <div className="space-y-2">
      {b.url && <img src={b.url} alt="" className="max-h-56 w-full rounded-lg border bg-muted object-contain" />}
      <div className="flex gap-2">
        <Input value={b.url ?? ""} onChange={(e) => onChange({ url: e.target.value })} placeholder={t("learn.editor.imageUrl")} className="h-8 text-xs" />
        <Button type="button" size="sm" variant="outline" onClick={() => input.current?.click()} disabled={progress != null} className="shrink-0">
          {progress != null ? <><Loader2 className="animate-spin" /> {progress}%</> : <><Upload /> {t("learn.editor.imageUpload")}</>}
        </Button>
        <input ref={input} type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} />
      </div>
      <Input value={b.caption ?? ""} onChange={(e) => onChange({ caption: e.target.value })} placeholder={t("learn.editor.caption")} maxLength={300} className="h-8 text-xs" />
    </div>
  )
}
