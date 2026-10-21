import { useState } from "react"
import { AlertTriangle, Trash2, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useConfirmStore } from "@/store/confirm.store"
import { cn } from "@/lib/utils"

const tones = {
  danger: { icon: Trash2, circle: "border-red-500/30 bg-red-500/15", iconClass: "text-red-500", button: "destructive" },
  warning: { icon: AlertTriangle, circle: "border-amber-500/30 bg-amber-500/15", iconClass: "text-amber-500", button: "default" },
  default: { icon: Info, circle: "border-border bg-muted", iconClass: "text-foreground", button: "default" },
}

/**
 * Confirmation modal in the same layout as the Sign out dialog:
 * header (tinted icon circle + title + subtitle) → body → footer (Cancel / action).
 * `onConfirm` may be async; the action button shows a busy state while it runs.
 */
export function ConfirmDialogView({ open, onOpenChange, title, description, body, confirmLabel = "Confirm", cancelLabel = "Cancel", tone = "danger", icon, onConfirm }) {
  const t = tones[tone] ?? tones.danger
  const Icon = icon ?? t.icon
  const [busy, setBusy] = useState(false)

  const confirmAction = async () => {
    setBusy(true)
    try {
      await onConfirm?.()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="max-w-md gap-0 rounded-[18px] p-0 sm:rounded-[18px]" showClose={false}>
        <DialogHeader className={cn("px-6 pt-5 pb-4", body && "border-b border-border")}>
          <div className="flex items-start gap-3">
            <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-full border", t.circle)}>
              <Icon className={cn("size-4", t.iconClass)} />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-[18px] font-bold text-foreground">{title}</DialogTitle>
              {description && <DialogDescription className="mt-0.5 text-[12px]">{description}</DialogDescription>}
            </div>
          </div>
        </DialogHeader>
        {body && <div className="px-6 py-4 text-[14px] leading-relaxed text-foreground/80">{body}</div>}
        <DialogFooter className={cn("px-6 pb-5", !body && "pt-1")}>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button variant={t.button} onClick={confirmAction} disabled={busy}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Mount once (App.jsx); opened through `confirm()` from @/store/confirm.store
export default function ConfirmHost() {
  const open = useConfirmStore((s) => s.open)
  const options = useConfirmStore((s) => s.options)
  const close = useConfirmStore((s) => s.close)
  if (!options) return null
  return <ConfirmDialogView {...options} open={open} onOpenChange={(o) => !o && close(false)} onConfirm={() => close(true)} />
}
