import { useEffect, useRef, useState } from "react"
import { X, Upload, Loader2, ImageOff } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { mediaService } from "@/services/media.service"
import { getErrorMessage } from "@/lib/api"
import { cn } from "@/lib/utils"

export function PageHeader({ title, description, children }) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  )
}

export function StatCard({ icon: Icon, label, value, hint, color = "text-primary" }) {
  return (
    <Card className="gap-0 py-0">
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{value ?? "—"}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        {Icon && (
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary">
            <Icon className={cn("size-5", color)} />
          </span>
        )}
      </CardContent>
    </Card>
  )
}

// Lightweight modal: closes on Esc / backdrop click
export function Modal({ open, onClose, title, children, className }) {
  const { t } = useTranslation()
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === "Escape" && onClose()
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div role="dialog" aria-modal="true" className={cn("relative max-h-[90vh] w-full overflow-y-auto rounded-t-xl border bg-background p-6 shadow-xl sm:max-w-lg sm:rounded-xl", className)}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button variant="ghost" size="icon" className="size-8" onClick={onClose} aria-label={t("common.actions.close")}><X /></Button>
        </div>
        {children}
      </div>
    </div>
  )
}

// Uploads to POST /medias and returns the public URI
export function ImageUpload({ value, onChange, className }) {
  const { t } = useTranslation()
  const input = useRef(null)
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState("")

  const onFile = async (file) => {
    if (!file) return
    setError("")
    setProgress(0)
    try {
      const media = await mediaService.upload(file, setProgress)
      onChange(media.uri)
    } catch (err) {
      setError(getErrorMessage(err, t("admin.ui.uploadFailed")))
    } finally {
      setProgress(null)
      if (input.current) input.current.value = ""
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative grid aspect-[16/10] place-items-center overflow-hidden rounded-xl border border-dashed border-neutral-300 bg-[#f5f5f5] dark:border-neutral-700 dark:bg-neutral-800">
        {value ? (
          <img src={value} alt="" className="size-full object-contain p-3 mix-blend-multiply dark:mix-blend-normal" />
        ) : (
          <ImageOff className="size-8 text-muted-foreground" />
        )}
        {progress != null && (
          <div className="absolute inset-0 grid place-items-center bg-background/70 text-sm font-medium">
            <span className="flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> {progress}%</span>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="bordered" size="sm" onClick={() => input.current?.click()} disabled={progress != null}>
          <Upload /> {value ? t("admin.ui.replace") : t("admin.ui.uploadImage")}
        </Button>
        {value && (
          <Button type="button" variant="bordered" size="sm" onClick={() => onChange("")} className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-500/10">{t("common.actions.remove")}</Button>
        )}
      </div>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

export function Stars({ value = 0, size = "size-4" }) {
  const { t } = useTranslation()
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={t("admin.ui.starsOutOf", { value })}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} viewBox="0 0 20 20" className={cn(size, n <= Math.round(value) ? "fill-yellow-400" : "fill-muted-foreground/30")}>
          <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9z" />
        </svg>
      ))}
    </span>
  )
}

