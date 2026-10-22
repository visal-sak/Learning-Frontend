import { useState } from "react"
import { Loader2 } from "lucide-react"
import { TbFlag } from "react-icons/tb"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Modal } from "@/components/admin/AdminUI"
import { FormError } from "@/components/auth/FormField"
import { moderationService } from "@/services/moderation.service"
import { getErrorMessage } from "@/lib/api"
import { cn } from "@/lib/utils"
import { toast } from "@/lib/toast"
import { useTranslation } from "react-i18next"

// label/hint: site.report.reasons.<value>.*
const REASONS = ["SPAM", "OFFENSIVE", "OFF_TOPIC", "MISLEADING", "OTHER"]

// Students flag a review for an admin to look at; one report per review per person
export default function ReportReviewDialog({ review, onClose, onReported }) {
  const { t } = useTranslation()
  const [reason, setReason] = useState(null)
  const [details, setDetails] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")

  const submit = async (e) => {
    e.preventDefault()
    if (!reason) return setError(t("site.report.chooseReason"))
    setError("")
    setSending(true)
    try {
      await moderationService.reportReview(review.id, { reason, details: details.trim() || null })
      toast.success(t("site.report.thanks"), t("site.report.thanksText"))
      onReported(review.id)
    } catch (err) {
      setError(getErrorMessage(err, t("site.report.failed")))
      setSending(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={t("site.report.title")} className="sm:max-w-md">
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-muted-foreground">{review.authorName ? t("site.report.questionNamed", { name: review.authorName }) : t("site.report.question")}</p>
        <FormError message={error} />
        <div className="grid gap-2">
          {REASONS.map((value) => (
            <label
              key={value}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/50",
                reason === value
                  ? "border-primary bg-primary/5 dark:bg-primary/10"
                  : "border-neutral-200/80 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50"
              )}
            >
              <input type="radio" name="reason" className="sr-only" checked={reason === value} onChange={() => setReason(value)} />
              <span className={cn("size-4 shrink-0 rounded-full border-2", reason === value ? "border-primary bg-primary ring-2 ring-inset ring-white dark:ring-neutral-900" : "border-neutral-300 dark:border-neutral-600")} />
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{t(`site.report.reasons.${value}.label`)}</span>
                <span className="block text-xs text-muted-foreground">{t(`site.report.reasons.${value}.hint`)}</span>
              </span>
            </label>
          ))}
        </div>
        <Textarea rows={2} maxLength={500} value={details} onChange={(e) => setDetails(e.target.value)} placeholder={t("site.report.detailsPlaceholder")} aria-label={t("site.report.details")} />
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>{t("common.actions.cancel")}</Button>
          <Button type="submit" disabled={sending}>
            {sending ? <Loader2 className="animate-spin" /> : <TbFlag />} {t("site.report.send")}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
