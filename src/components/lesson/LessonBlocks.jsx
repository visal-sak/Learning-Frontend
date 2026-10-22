import { Fragment, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Check, Copy, Quote } from "lucide-react"
import { MdLightbulb, MdInfo, MdWarning } from "react-icons/md"
import TryItEditor, { PLAYGROUND_TABS } from "./TryItEditor"
import { RUNNABLE, detectLanguage, highlight, languageLabel, playgroundParts } from "./code"
import { cn } from "@/lib/utils"

/** Renders a lesson page built from blocks (see LessonBlock on the backend). */
export default function LessonBlocks({ blocks = [], className }) {
  if (!blocks.length) return null
  return (
    <article className={cn("space-y-5", className)}>
      {blocks.map((b, i) => (
        <Block key={i} block={b} />
      ))}
    </article>
  )
}

function Block({ block: b }) {
  switch (b.type) {
    case "heading":
      return b.level === 3 ? (
        <h3 className="pt-2 text-lg font-semibold tracking-tight">{b.text}</h3>
      ) : (
        <h2 className="border-b pb-2 pt-4 text-xl font-bold tracking-tight first:pt-0">{b.text}</h2>
      )
    case "paragraph":
      return <p className="whitespace-pre-line leading-relaxed text-foreground/85"><Inline text={b.text ?? ""} /></p>
    case "callout":
      return <Callout variant={b.variant} text={b.text} />
    case "code":
      return <CodeBlock block={b} />
    case "image":
      return b.url ? (
        <figure className="space-y-2">
          <img src={b.url} alt={b.caption ?? ""} loading="lazy" className="w-full rounded-xl border bg-muted object-contain" />
          {b.caption && <figcaption className="text-center text-sm text-muted-foreground">{b.caption}</figcaption>}
        </figure>
      ) : null
    case "divider":
      return <hr className="border-dashed" />
    case "list":
      return <List items={b.items ?? []} ordered={b.ordered} />
    case "quote":
      return <BlockQuote text={b.text} by={b.caption} />
    case "table":
      return <Table rows={b.rows ?? []} />
    default:
      return null
  }
}

const CALLOUTS = {
  tip: { icon: MdLightbulb, box: "border-primary bg-primary/[0.06] dark:bg-primary/10", icn: "text-primary" },
  note: { icon: MdInfo, box: "border-sky-500 bg-sky-500/[0.07]", icn: "text-sky-700 dark:text-sky-400" },
  warning: { icon: MdWarning, box: "border-amber-500 bg-amber-500/[0.08]", icn: "text-amber-700 dark:text-amber-400" },
}

function Callout({ variant = "tip", text }) {
  const { t } = useTranslation()
  const c = CALLOUTS[variant] ?? CALLOUTS.tip
  const Icon = c.icon
  return (
    <aside className={cn("flex gap-3 rounded-xl border-l-4 p-4", c.box)}>
      <Icon className={cn("mt-0.5 size-5 shrink-0", c.icn)} />
      <div className="min-w-0 space-y-1 text-sm leading-relaxed">
        <p className={cn("font-semibold", c.icn)}>{t(`learn.blocks.${variant}`)}</p>
        <p className="whitespace-pre-line text-foreground/85"><Inline text={text ?? ""} /></p>
      </div>
    </aside>
  )
}

// Bullets are small navy dots; numbered lists use navy number bubbles
function List({ items, ordered }) {
  const Tag = ordered ? "ol" : "ul"
  return (
    <Tag className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 leading-relaxed text-foreground/85">
          {ordered ? (
            <span className="mt-px grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold tabular-nums text-primary-foreground">{i + 1}</span>
          ) : (
            // fixed-width marker slot so the soft halo never spills past the text edge
            <span className="grid h-[1.625em] w-5 shrink-0 place-items-center" aria-hidden>
              <span className="size-2 rounded-full bg-primary shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_15%,transparent)]" />
            </span>
          )}
          <span className="min-w-0"><Inline text={item} /></span>
        </li>
      ))}
    </Tag>
  )
}

function BlockQuote({ text, by }) {
  return (
    <figure className="relative rounded-xl border-l-4 border-primary bg-primary/[0.04] py-4 pl-12 pr-5 dark:bg-primary/10">
      <Quote className="absolute left-4 top-4 size-5 fill-primary/20 text-primary" />
      <blockquote className="whitespace-pre-line text-lg font-medium italic leading-relaxed">
        <Inline text={text ?? ""} />
      </blockquote>
      {by && <figcaption className="mt-2 text-sm text-muted-foreground">— {by}</figcaption>}
    </figure>
  )
}

// First row is the header
function Table({ rows }) {
  if (!rows.length) return null
  const [head, ...body] = rows
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-left text-sm">
        <thead className="bg-primary text-primary-foreground">
          <tr>{head.map((c, i) => <th key={i} className="px-4 py-2.5 font-semibold">{c}</th>)}</tr>
        </thead>
        <tbody className="divide-y">
          {body.map((r, i) => (
            <tr key={i} className="even:bg-muted/40">
              {head.map((_, j) => <td key={j} className="px-4 py-2.5 align-top text-foreground/85"><Inline text={r[j] ?? ""} /></td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// W3Schools-like example box: file tabs, highlighted code, copy, and "Try it Yourself »"
export function CodeBlock({ block }) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)
  const lang = detectLanguage(block.code ?? "", block.language)
  const playground = useMemo(() => (RUNNABLE.has(lang) ? playgroundParts(block) : null), [block, lang])
  // own code first, then any HTML / CSS / JS parts saved with it
  const files = playground
    ? PLAYGROUND_TABS.filter((x) => x.key === playground.main || (x.key !== playground.main && block[x.key]?.trim()))
    : []
  const [view, setView] = useState(null)
  const shown = files.find((f) => f.key === view) ?? files[0]
  const code = !shown || shown.key === playground?.main ? block.code ?? "" : block[shown.key]
  const codeLang = shown?.lang ?? lang
  const canRun = block.runnable && !!playground

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-muted/40">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-sm font-semibold">{t("learn.blocks.example")}</span>
          {files.length > 1 ? (
            <div className="flex gap-0.5 rounded-md bg-background p-0.5">
              {files.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setView(f.key)}
                  className={cn("rounded px-2 py-0.5 text-xs font-medium", shown?.key === f.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
                >
                  {f.label}
                </button>
              ))}
            </div>
          ) : (
            codeLang && <span className="rounded bg-background px-1.5 py-0.5 text-xs font-medium text-muted-foreground">{languageLabel(codeLang)}</span>
          )}
        </div>
        <button type="button" onClick={copy} className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {t(copied ? "learn.blocks.copied" : "learn.blocks.copy")}
        </button>
      </div>
      <div className="p-3">
        <pre className="code-surface overflow-x-auto rounded-lg border-l-4 border-primary px-4 py-3 font-mono text-[13px] leading-6">
          <code dangerouslySetInnerHTML={{ __html: highlight(code, codeLang) }} />
        </pre>
        {canRun && (
          <>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="mt-3 inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t("learn.blocks.tryIt")}
            </button>
            <TryItEditor open={open} onOpenChange={setOpen} parts={playground.parts} main={playground.main} />
          </>
        )}
      </div>
    </div>
  )
}

// **bold**, `code` and [text](https://…) — everything else stays plain text (no HTML injection)
export function Inline({ text }) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\((?:https?:\/\/|\/)[^)\s]+\))/).map((s, i) => {
    if (/^\*\*[^*]+\*\*$/.test(s)) return <strong key={i} className="font-semibold text-foreground">{s.slice(2, -2)}</strong>
    if (/^`[^`]+`$/.test(s)) return <code key={i} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-primary">{s.slice(1, -1)}</code>
    const link = s.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/)
    if (link) {
      const external = /^https?:/.test(link[2])
      return (
        <a key={i} href={link[2]} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} className="font-medium text-primary underline underline-offset-2">
          {link[1]}
        </a>
      )
    }
    return <Fragment key={i}>{s}</Fragment>
  })
}
