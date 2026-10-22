import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Play, RotateCcw, X, MousePointerClick } from "lucide-react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { Button } from "@/components/ui/button"
import CodeEditor from "./CodeEditor"
import { buildPlaygroundDoc } from "./code"
import { cn } from "@/lib/utils"

export const PLAYGROUND_TABS = [
  { key: "html", label: "HTML", lang: "html" },
  { key: "css", label: "CSS", lang: "css" },
  { key: "js", label: "JavaScript", lang: "javascript" },
]

/**
 * W3Schools / CodePen-style playground: HTML, CSS and JS tabs on the left, live result on the right.
 * The result runs in a sandboxed iframe without allow-same-origin, so lesson code
 * can't read the student's session, cookies or this page.
 */
export default function TryItEditor({ open, onOpenChange, parts: initial, main = "html" }) {
  const { t } = useTranslation()
  const [parts, setParts] = useState(initial)
  const [tab, setTab] = useState(main)
  const [doc, setDoc] = useState(null) // nothing runs until the student presses Run
  const [runId, setRunId] = useState(0) // remounts the iframe so every run starts clean
  const [logs, setLogs] = useState([])
  const frameRef = useRef(null)

  const run = (p = parts) => {
    setLogs([])
    setDoc(buildPlaygroundDoc(p))
    setRunId((n) => n + 1)
  }

  useEffect(() => {
    if (!open) return
    setParts(initial)
    setTab(main)
    setDoc(null)
    setLogs([])
  }, [open, initial, main])

  // console.* output from the sandbox
  useEffect(() => {
    const onMessage = (e) => {
      if (e.source !== frameRef.current?.contentWindow || !e.data?.__tryit) return
      setLogs((l) => [...l.slice(-199), { level: e.data.level, text: String(e.data.text) }])
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [])

  const reset = () => {
    setParts(initial)
    setDoc(null)
    setLogs([])
  }

  // A tab shows when it has code, is the example's own language, is open, or is HTML (always there)
  const visible = PLAYGROUND_TABS.filter((x) => x.key === main || x.key === tab || x.key === "html" || parts[x.key]?.trim())
  const hidden = PLAYGROUND_TABS.filter((x) => !visible.includes(x))
  const current = PLAYGROUND_TABS.find((x) => x.key === tab) ?? PLAYGROUND_TABS[0]
  const showConsole = !!parts.js?.trim() || logs.length > 0

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[100000] bg-black/60 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed inset-2 z-[100001] flex flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl sm:inset-6 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
          aria-describedby={undefined}
        >
          {/* toolbar */}
          <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2 sm:px-4">
            <DialogPrimitive.Title className="mr-auto text-sm font-semibold">{t("learn.tryIt.title")}</DialogPrimitive.Title>
            <Button size="sm" variant="ghost" onClick={reset}><RotateCcw /> {t("learn.tryIt.reset")}</Button>
            <button
              type="button"
              onClick={() => run()}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Play className="size-3.5 fill-current" /> {t("learn.tryIt.run")}
            </button>
            <DialogPrimitive.Close asChild>
              <Button size="icon" variant="ghost" className="size-8" aria-label={t("common.actions.close")}><X /></Button>
            </DialogPrimitive.Close>
          </div>

          <div className="grid min-h-0 flex-1 grid-rows-2 lg:grid-cols-2 lg:grid-rows-1">
            {/* code: one tab per file */}
            <div className="flex min-h-0 flex-col border-b lg:border-r lg:border-b-0">
              <div role="tablist" className="flex shrink-0 items-end gap-0.5 border-b bg-muted/40 px-2 pt-1.5">
                {visible.map((x) => (
                  <button
                    key={x.key}
                    role="tab"
                    type="button"
                    aria-selected={tab === x.key}
                    onClick={() => setTab(x.key)}
                    className={cn(
                      "-mb-px rounded-t-lg border border-b-0 px-3 py-1.5 text-xs font-semibold transition-colors",
                      tab === x.key ? "border-border bg-background text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {x.label}
                  </button>
                ))}
                {hidden.map((x) => (
                  <button
                    key={x.key}
                    type="button"
                    onClick={() => setTab(x.key)}
                    className="mb-1 ml-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-background hover:text-foreground"
                  >
                    + {x.label}
                  </button>
                ))}
                <span className="mb-1.5 ml-auto hidden pr-2 text-[11px] text-muted-foreground md:inline">{t("learn.tryIt.hint")}</span>
              </div>
              <CodeEditor
                key={current.key}
                value={parts[current.key] ?? ""}
                onChange={(v) => setParts((p) => ({ ...p, [current.key]: v }))}
                language={current.lang}
                onRun={() => run()}
                className="min-h-0 flex-1"
                minHeight="100%"
              />
            </div>

            {/* result (+ console) */}
            <div className="flex min-h-0 flex-col">
              <div className="shrink-0 border-b bg-muted/40 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t("learn.tryIt.result")}</div>
              {doc == null ? (
                <button
                  type="button"
                  onClick={() => run()}
                  className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 bg-muted/20 text-center text-sm text-muted-foreground transition-colors hover:bg-primary/5"
                >
                  <span className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
                    <MousePointerClick className="size-6" />
                  </span>
                  {t("learn.tryIt.empty")}
                </button>
              ) : (
                <iframe
                  key={runId}
                  ref={frameRef}
                  title={t("learn.tryIt.result")}
                  srcDoc={doc}
                  sandbox="allow-scripts allow-modals allow-forms"
                  className="min-h-0 w-full flex-1 bg-white"
                />
              )}
              {showConsole && (
                <div className="flex h-40 shrink-0 flex-col border-t bg-neutral-950 text-neutral-100">
                  <div className="flex items-center justify-between px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
                    {t("learn.tryIt.console")}
                    <button type="button" className="font-medium normal-case hover:text-white" onClick={() => setLogs([])}>{t("learn.tryIt.clear")}</button>
                  </div>
                  <div className="flex-1 overflow-auto px-3 pb-2 font-mono text-xs leading-5">
                    {logs.length === 0 ? (
                      <p className="text-neutral-500">{t("learn.tryIt.noOutput")}</p>
                    ) : (
                      logs.map((l, i) => (
                        <pre
                          key={i}
                          className={cn("whitespace-pre-wrap border-b border-white/5 py-0.5", l.level === "error" && "text-red-400", l.level === "warn" && "text-amber-300")}
                        >
                          {l.text}
                        </pre>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
