import EditorModule from "react-simple-code-editor"
import { highlight } from "./code"
import { cn } from "@/lib/utils"

// CommonJS package: the dev server hands back { default: Editor }, the build hands back Editor
const Editor = EditorModule.default ?? EditorModule

// Editable code with syntax colours, line numbers and Tab-to-indent (shared by "Try it Yourself" and the lesson editor)
export default function CodeEditor({ value, onChange, language, className, minHeight = 160, placeholder, onRun, lineNumbers = true }) {
  const lines = Math.max(1, (value ?? "").split("\n").length)
  return (
    <div className={cn("code-surface overflow-auto font-mono text-[13px] leading-6", className)}>
      <div className="flex min-h-full">
        {lineNumbers && (
          <div aria-hidden className="sticky left-0 shrink-0 select-none border-r border-black/5 bg-inherit py-[14px] pl-3 pr-2.5 text-right text-neutral-400 tabular-nums dark:border-white/10 dark:text-neutral-600">
            {Array.from({ length: lines }, (_, i) => <div key={i}>{i + 1}</div>)}
          </div>
        )}
        <Editor
          value={value}
          onValueChange={onChange}
          highlight={(code) => highlight(code, language)}
          padding={14}
          tabSize={2}
          insertSpaces
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (onRun && (e.ctrlKey || e.metaKey) && e.key === "Enter") {
              e.preventDefault()
              onRun()
            }
          }}
          textareaClassName="outline-none"
          className="min-w-0 flex-1"
          style={{ minHeight, fontFamily: "inherit" }}
        />
      </div>
    </div>
  )
}
