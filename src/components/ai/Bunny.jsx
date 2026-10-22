import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { Inline } from "@/components/lesson/LessonBlocks"

/**
 * Bunny AI — the face of every AI feature (lesson tutor, quiz hints, "Explain my answer").
 * Inline SVG so it scales crisply; `thinking` wiggles the ears.
 */
export function BunnyAvatar({ size = 32, thinking = false, className }) {
  return (
    <span
      className={cn("relative inline-grid shrink-0 place-items-center rounded-full bg-primary/10 ring-1 ring-primary/15 dark:bg-primary/20", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 64 64" style={{ width: size * 0.86, height: size * 0.86 }} className="overflow-visible">
        {/* ears */}
        <g className={cn("origin-[24px_30px]", thinking && "animate-[bunny-ear-l_0.9s_ease-in-out_infinite]")}>
          <ellipse cx="22" cy="15" rx="6.5" ry="15" fill="#fff" stroke="var(--primary)" strokeWidth="2.2" transform="rotate(-12 22 15)" />
          <ellipse cx="22" cy="16" rx="3" ry="10" fill="#f9a8d4" transform="rotate(-12 22 16)" />
        </g>
        <g className={cn("origin-[40px_30px]", thinking && "animate-[bunny-ear-r_0.9s_ease-in-out_infinite]")}>
          <ellipse cx="42" cy="15" rx="6.5" ry="15" fill="#fff" stroke="var(--primary)" strokeWidth="2.2" transform="rotate(12 42 15)" />
          <ellipse cx="42" cy="16" rx="3" ry="10" fill="#f9a8d4" transform="rotate(12 42 16)" />
        </g>
        {/* head */}
        <circle cx="32" cy="40" r="18" fill="#fff" stroke="var(--primary)" strokeWidth="2.2" />
        {/* eyes */}
        <circle cx="25.5" cy="38" r="2.6" fill="#1f2340" />
        <circle cx="38.5" cy="38" r="2.6" fill="#1f2340" />
        <circle cx="26.3" cy="37.1" r="0.9" fill="#fff" />
        <circle cx="39.3" cy="37.1" r="0.9" fill="#fff" />
        {/* cheeks */}
        <ellipse cx="21" cy="45" rx="3" ry="2" fill="#fbcfe8" />
        <ellipse cx="43" cy="45" rx="3" ry="2" fill="#fbcfe8" />
        {/* nose + mouth */}
        <path d="M30 43.5 h4 l-2 2.3 z" fill="#ec4899" />
        <path d="M32 45.8 v1.6 M32 47.4 q-2.2 2 -4 0.4 M32 47.4 q2.2 2 4 0.4" fill="none" stroke="#1f2340" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    </span>
  )
}

/** Three bouncing dots — "Bunny is typing". */
export function TypingDots({ className }) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)} aria-hidden>
      {[0, 1, 2].map((i) => (
        <span key={i} className="size-1.5 animate-[bunny-dot_1.2s_ease-in-out_infinite] rounded-full bg-primary/70" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </span>
  )
}

/**
 * A Bunny AI speech bubble: avatar, "Bunny AI" + label (e.g. "Hint 1"), then the message.
 * Pass `thinking` (no children) for the waiting state.
 */
export function BunnyBubble({ label, thinking = false, tone = "default", children, className }) {
  const { t } = useTranslation()
  return (
    <div className={cn("flex items-start gap-2.5 animate-in fade-in-0 slide-in-from-bottom-1 duration-300", className)}>
      <BunnyAvatar size={32} thinking={thinking} className="mt-0.5" />
      <div
        className={cn(
          "relative min-w-0 flex-1 rounded-2xl rounded-tl-md border px-3.5 py-2.5 text-sm leading-relaxed shadow-[0_1px_2px_rgb(0_0_0/0.04)]",
          tone === "explain" ? "border-sky-500/20 bg-sky-500/[0.06] dark:bg-sky-500/10" : "border-primary/15 bg-primary/[0.04] dark:bg-primary/10"
        )}
      >
        <p className="mb-0.5 flex items-center gap-1.5 text-[11px] font-semibold text-primary">
          {t("learn.ai.bunny")}
          {label && <span className="rounded-full bg-primary/10 px-1.5 py-px text-[10px] font-medium">{label}</span>}
        </p>
        {thinking ? (
          <span className="flex items-center gap-2 py-1 text-xs text-muted-foreground">
            <TypingDots /> {t("learn.ai.thinking")}
          </span>
        ) : (
          <div className="min-w-0 whitespace-pre-line text-foreground/90">
            {/* AI text: render `code` and **bold** */}
            {typeof children === "string" ? <Inline text={children.replace(/\\n/g, "\n")} /> : children}
          </div>
        )}
      </div>
    </div>
  )
}
