import { useTranslation } from "react-i18next"
import { Check, ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { LANGUAGES } from "@/i18n"
import { cn } from "@/lib/utils"

// Inline SVG flags — emoji flags don't render on Windows
function FlagGB({ className }) {
  return (
    <svg viewBox="0 0 60 30" className={className} aria-hidden>
      <clipPath id="gb-s"><path d="M0,0 v30 h60 v-30 z" /></clipPath>
      <clipPath id="gb-t"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" /></clipPath>
      <g clipPath="url(#gb-s)">
        <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
        <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#gb-t)" stroke="#C8102E" strokeWidth="4" />
        <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  )
}

function FlagKH({ className }) {
  return (
    <svg viewBox="0 0 60 40" className={className} aria-hidden>
      <rect width="60" height="40" fill="#032EA1" />
      <rect y="10" width="60" height="20" fill="#E00025" />
      {/* Angkor Wat, simplified */}
      <g fill="#fff">
        <rect x="17" y="25" width="26" height="2" />
        <rect x="19" y="21" width="22" height="4" />
        <path d="M28 21 L30 13 L32 21 Z" />
        <path d="M23 21 L24.5 16 L26 21 Z" />
        <path d="M34 21 L35.5 16 L37 21 Z" />
        <path d="M19.5 21 L20.5 18 L21.5 21 Z" />
        <path d="M38.5 21 L39.5 18 L40.5 21 Z" />
      </g>
    </svg>
  )
}

const FLAGS = { en: FlagGB, km: FlagKH }

export function Flag({ code, className }) {
  const F = FLAGS[code] ?? FlagGB
  return <F className={cn("h-3.5 w-5 shrink-0 overflow-hidden rounded-[3px] shadow-[0_0_0_1px_rgb(0_0_0/0.08)]", className)} />
}

// Flag dropdown in the navbar / admin header — switches the whole UI (and backend messages)
export default function LanguageSwitch({ className }) {
  const { i18n, t } = useTranslation()
  const current = LANGUAGES.find((l) => l.code === (i18n.resolvedLanguage || i18n.language)) ?? LANGUAGES[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("common.language.switchTo")}
          className={cn(
            "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 data-[state=open]:bg-accent data-[state=open]:text-foreground",
            className
          )}
        >
          <Flag code={current.code} />
          <span>{current.short}</span>
          <ChevronDown className="size-3.5 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {LANGUAGES.map((l) => {
          const active = l.code === current.code
          return (
            <DropdownMenuItem key={l.code} onSelect={() => !active && i18n.changeLanguage(l.code)} className={cn("gap-2.5", active && "font-medium text-foreground")}>
              <Flag code={l.code} />
              <span className="flex-1">{l.label}</span>
              {active && <Check className="text-primary" />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
