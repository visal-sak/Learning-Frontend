import { useState } from "react"
import { MdVerifiedUser } from "react-icons/md"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Loader2 } from "lucide-react"
import { BiSolidTrash } from "react-icons/bi"
import { RiCheckboxCircleFill } from "react-icons/ri"
import { TbFlag } from "react-icons/tb"
import { Button } from "@/components/ui/button"
import { PageHeader, Stars } from "@/components/admin/AdminUI"
import { Tag } from "@/components/admin/DataTable"
import { EmptyState, ErrorState, LoadingState } from "@/components/course/CourseBits"
import { useFetch } from "@/hooks/useFetch"
import { moderationService } from "@/services/moderation.service"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import { confirm } from "@/store/confirm.store"
import { toast } from "@/lib/toast"

export const REPORT_REASONS = {
  SPAM: { label: "Spam", className: "bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300" },
  OFFENSIVE: { label: "Offensive", className: "bg-rose-500/12 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300" },
  OFF_TOPIC: { label: "Off-topic", className: "bg-sky-500/12 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300" },
  MISLEADING: { label: "Misleading", className: "bg-violet-500/12 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300" },
  OTHER: { label: "Other", className: "bg-neutral-500/12 text-neutral-700 dark:bg-neutral-500/20 dark:text-neutral-300" },
}

// Labels resolved at render time: admin.moderation.tabs.<value>
const TABS = ["OPEN", "DISMISSED"]

export default function ModerationPage() {
  const { t } = useTranslation()
  const [status, setStatus] = useState("OPEN")
  const { data, loading, error, reload } = useFetch(() => moderationService.queue(status), [status])
  const items = data ?? []

  return (
    <>
      <PageHeader title={t("admin.moderation.title")} description={t("admin.moderation.description")} />

      <div className="mb-4 flex w-fit gap-1 rounded-xl border border-neutral-200/80 bg-neutral-100/70 p-1 dark:border-neutral-800 dark:bg-neutral-900">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setStatus(tab)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
              status === tab && "bg-white text-foreground shadow-sm dark:bg-neutral-800"
            )}
          >
            {t(`admin.moderation.tabs.${tab}`)}
            {status === tab && !loading && (
              <span className="ml-1.5 rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground tabular-nums">{items.length}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : items.length === 0 ? (
        <EmptyState icon={MdVerifiedUser} title={status === "OPEN" ? t("admin.moderation.emptyOpen") : t("admin.moderation.emptyDismissed")}>
          {status === "OPEN" ? t("admin.moderation.emptyOpenHint") : t("admin.moderation.emptyDismissedHint")}
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {items.map((r) => (
            <ReportedReview key={r.reviewId} item={r} open={status === "OPEN"} onDone={reload} />
          ))}
        </ul>
      )}
    </>
  )
}

const initialsOf = (name = "") => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "?"

function ReportedReview({ item: r, open, onDone }) {
  const { t } = useTranslation()
  const [busy, setBusy] = useState(null)

  const run = async (kind, fn, msg) => {
    setBusy(kind)
    try {
      await fn()
      toast.success(msg)
      onDone()
    } catch (err) {
      toast.error(t("admin.shared.actionFailed"), err)
      setBusy(null)
    }
  }

  const keep = () => run("keep", () => moderationService.dismiss(r.reviewId), t("admin.moderation.toast.kept"))
  const remove = async () => {
    const ok = await confirm({
      title: t("admin.moderation.removeDialog.title"),
      description: t("admin.moderation.removeDialog.description", { author: r.authorName, course: r.courseTitle }),
      body: t("admin.moderation.removeDialog.body"),
      confirmLabel: t("admin.moderation.removeReview"),
    })
    if (ok) run("remove", () => moderationService.removeReview(r.reviewId), t("admin.moderation.toast.removed"))
  }

  return (
    <li className="overflow-hidden rounded-xl border border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      {/* The review */}
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="flex items-center gap-2">
              {r.authorAvatarUrl ? (
                <img src={r.authorAvatarUrl} alt="" className="size-7 rounded-full object-cover" />
              ) : (
                <span className="grid size-7 place-items-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">{initialsOf(r.authorName)}</span>
              )}
              <span className="font-semibold">{r.authorName}</span>
            </span>
            <Stars value={r.rating} size="size-3.5" />
            <span className="text-xs text-muted-foreground">{formatDate(r.reviewedAt)}</span>
            <Link to={`/courses/${r.courseId}`} className="text-xs font-medium text-primary hover:underline">{r.courseTitle}</Link>
          </div>
          <p className={cn("whitespace-pre-line rounded-lg bg-neutral-50 px-3.5 py-2.5 text-sm dark:bg-neutral-800/50", !r.comment && "italic text-muted-foreground")}>
            {r.comment || t("admin.moderation.noComment")}
          </p>
        </div>
        {open && (
          <div className="flex shrink-0 gap-2 sm:flex-col">
            <Button size="sm" variant="bordered" disabled={!!busy} onClick={keep}>
              {busy === "keep" ? <Loader2 className="animate-spin" /> : <RiCheckboxCircleFill className="size-4 text-emerald-600 dark:text-emerald-400" />} {t("admin.moderation.keepReview")}
            </Button>
            <Button
              size="sm"
              variant="bordered"
              disabled={!!busy}
              onClick={remove}
              className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-500/10"
            >
              {busy === "remove" ? <Loader2 className="animate-spin" /> : <BiSolidTrash className="size-4" />} {t("admin.moderation.removeReview")}
            </Button>
          </div>
        )}
      </div>

      {/* Its reports */}
      <div className="border-t border-neutral-200/80 bg-neutral-50/60 px-5 py-3 dark:border-neutral-800 dark:bg-neutral-800/30">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <TbFlag className="size-3.5" /> {t("admin.moderation.reportCount", { count: r.reportCount })}
        </p>
        <ul className="space-y-2">
          {r.reports.map((rep) => (
            <li key={rep.id} className="flex flex-wrap items-start gap-x-2.5 gap-y-1 text-sm">
              <Tag className={REPORT_REASONS[rep.reason]?.className}>{t(`admin.moderation.reasons.${rep.reason}`, { defaultValue: REPORT_REASONS[rep.reason]?.label ?? rep.reason })}</Tag>
              <span className="font-medium">{rep.reporterName ?? t("admin.moderation.aStudent")}</span>
              <span className="text-xs leading-5 text-muted-foreground">{formatDate(rep.createdAt)}</span>
              {rep.details && <p className="w-full text-muted-foreground">“{rep.details}”</p>}
            </li>
          ))}
        </ul>
      </div>
    </li>
  )
}
