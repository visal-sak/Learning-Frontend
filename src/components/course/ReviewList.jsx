import { useState } from "react"
import { Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Stars } from "@/components/admin/AdminUI"
import { formatDate } from "@/lib/format"
import { confirm } from "@/store/confirm.store"
import { toast } from "@/lib/toast"

const initials = (name = "?") => name.split(" ").map((p) => p[0]).slice(0, 2).join("")

// `onDelete(review)` shows a delete button (admin moderation)
export function ReviewItem({ review, onDelete, showCourse, footer }) {
  const [busy, setBusy] = useState(false)
  return (
    <li className="flex gap-3 py-4">
      <Avatar className="size-9">
        {review.authorAvatarUrl && <AvatarImage src={review.authorAvatarUrl} alt="" />}
        <AvatarFallback className="bg-accent text-xs text-accent-foreground">{initials(review.authorName)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-medium">{review.authorName}</span>
          {review.mine && <span className="rounded bg-accent px-1.5 text-[10px] font-semibold uppercase text-accent-foreground">You</span>}
          <Stars value={review.rating} size="size-3.5" />
          <span className="text-xs text-muted-foreground">{formatDate(review.updatedAt ?? review.createdAt)}</span>
        </div>
        {showCourse && review.courseTitle && <p className="text-xs text-muted-foreground">on {review.courseTitle}</p>}
        {review.comment && <p className="whitespace-pre-line text-sm text-foreground/90">{review.comment}</p>}
        {review.percentCompleteWhenWritten != null && (
          <p className="text-xs text-muted-foreground">Written at {review.percentCompleteWhenWritten}% course progress</p>
        )}
        {footer}
      </div>
      {onDelete && (
        <Button
          size="icon"
          variant="ghost"
          className="size-8 shrink-0 text-destructive hover:text-destructive"
          disabled={busy}
          aria-label="Delete review"
          onClick={async () => {
            const ok = await confirm({
              title: "Delete this review?",
              description: `By ${review.authorName}`,
              body: "The review will be removed for everyone and the course rating will be recalculated.",
              confirmLabel: "Delete review",
            })
            if (!ok) return
            setBusy(true)
            try {
              await onDelete(review)
              toast.success("Review deleted")
            } catch (err) {
              toast.error("Couldn’t delete the review", err)
            } finally {
              setBusy(false)
            }
          }}
        >
          {busy ? <Loader2 className="animate-spin" /> : <Trash2 />}
        </Button>
      )}
    </li>
  )
}

export function RatingSummary({ summary }) {
  if (!summary) return null
  const total = summary.total ?? 0
  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
      <div className="text-center sm:w-36">
        <p className="text-4xl font-bold tabular-nums">{total ? Number(summary.average).toFixed(1) : "—"}</p>
        <Stars value={summary.average ?? 0} />
        <p className="mt-1 text-xs text-muted-foreground">{total} rating{total === 1 ? "" : "s"}</p>
      </div>
      <div className="flex-1 space-y-1.5">
        {[5, 4, 3, 2, 1].map((n) => {
          const count = summary.distribution?.[n] ?? summary.distribution?.[String(n)] ?? 0
          const pct = total ? (count / total) * 100 : 0
          return (
            <div key={n} className="flex items-center gap-2 text-xs">
              <span className="w-3 text-muted-foreground">{n}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-yellow-400" style={{ width: `${pct}%` }} />
              </div>
              <span className="w-8 text-right tabular-nums text-muted-foreground">{count}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
