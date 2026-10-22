import { useEffect, useState } from "react"
import { Loader2, Star, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { FormError } from "@/components/auth/FormField"
import { LoadingState } from "@/components/course/CourseBits"
import { RatingSummary } from "@/components/course/ReviewList"
import ReportReviewDialog from "@/components/course/ReportReviewDialog"
import { TbFlag } from "react-icons/tb"
import { TwitterCard } from "@/components/ui/twitter-card"
import { reviewToTweet } from "@/lib/review-card"
import { useFetch } from "@/hooks/useFetch"
import { reviewService } from "@/services/review.service"
import { toList } from "@/services/http"
import { getErrorMessage } from "@/lib/api"
import { cn } from "@/lib/utils"
import { confirm } from "@/store/confirm.store"
import { toast } from "@/lib/toast"
import { useTranslation } from "react-i18next"

// Ratings + reviews block for the course page (all review endpoints need a logged-in user)
export default function CourseReviews({ courseId, canReview }) {
  const [page, setPage] = useState(0)
  const { t } = useTranslation()
  const summary = useFetch(() => reviewService.summary(courseId), [courseId])
  const list = useFetch(() => reviewService.byCourse(courseId, { page, size: 5, sort: "createdAt,desc" }), [courseId, page])
  const reviews = toList(list.data)
  const [reporting, setReporting] = useState(null) // review being reported
  const [reported, setReported] = useState(() => new Set()) // reported this session

  const refresh = () => {
    summary.reload()
    list.reload()
  }

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-semibold">{t("site.reviews.title")}</h2>

      {summary.loading && !summary.data ? <LoadingState variant="section" /> : summary.data && <RatingSummary summary={summary.data} />}

      {canReview && <MyReview courseId={courseId} onChange={refresh} />}

      {list.loading && !list.data ? (
        <LoadingState variant="section" />
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">{canReview ? t("site.reviews.noneFirst") : t("site.reviews.none")}</p>
      ) : (
        <>
          <ul className="space-y-3">
            {reviews.map((r) => (
              <li key={r.id}>
                <TwitterCard
                  {...reviewToTweet(r)}
                  context={r.mine ? t("site.reviews.yours") : r.percentCompleteWhenWritten != null ? t("site.reviews.writtenAt", { percent: r.percentCompleteWhenWritten }) : null}
                />
                {!r.mine && (
                  <div className="mt-1.5 flex justify-end">
                    {reported.has(r.id) ? (
                      <span className="text-xs text-muted-foreground">{t("site.reviews.reported")}</span>
                    ) : (
                      <button
                        onClick={() => setReporting(r)}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-rose-600 dark:hover:text-rose-400"
                      >
                        <TbFlag className="size-3.5" /> {t("site.reviews.report")}
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
          {list.data?.totalPages > 1 && (
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>{t("site.reviews.newer")}</Button>
              <span className="text-sm text-muted-foreground">{t("site.shared.pageOf", { page: page + 1, total: list.data.totalPages })}</span>
              <Button variant="outline" size="sm" disabled={list.data.last} onClick={() => setPage((p) => p + 1)}>{t("site.reviews.older")}</Button>
            </div>
          )}
        </>
      )}
      {reporting && (
        <ReportReviewDialog
          review={reporting}
          onClose={() => setReporting(null)}
          onReported={(id) => {
            setReported((s) => new Set(s).add(id))
            setReporting(null)
          }}
        />
      )}
    </section>
  )
}

function MyReview({ courseId, onChange }) {
  const [existing, setExisting] = useState(undefined) // undefined = loading, null = none
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const { t } = useTranslation()

  useEffect(() => {
    reviewService
      .mine(courseId)
      .then((r) => {
        setExisting(r ?? null)
        setRating(r?.rating ?? 0)
        setComment(r?.comment ?? "")
      })
      .catch(() => setExisting(null)) // 404 → no review yet
  }, [courseId])

  const save = async (e) => {
    e.preventDefault()
    if (!rating) return setError(t("site.reviews.pickRating"))
    setError("")
    setSaving(true)
    try {
      setExisting(await reviewService.save(courseId, { rating, comment: comment.trim() }))
      onChange()
      toast.success(existing ? t("site.reviews.updated") : t("site.reviews.posted"), t("site.reviews.thanks"))
    } catch (err) {
      setError(getErrorMessage(err, t("site.reviews.saveFailed")))
      toast.error(t("site.reviews.saveFailed"), err)
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!(await confirm({ title: t("site.reviews.deleteTitle"), description: t("site.reviews.deleteText"), confirmLabel: t("site.reviews.deleteConfirm") }))) return
    try {
      await reviewService.deleteMine(courseId)
      setExisting(null)
      setRating(0)
      setComment("")
      onChange()
      toast.success(t("site.reviews.deleted"))
    } catch (err) {
      setError(getErrorMessage(err, t("site.reviews.deleteFailed")))
      toast.error(t("site.reviews.deleteFailed"), err)
    }
  }

  if (existing === undefined) return null

  return (
    <Card className="gap-0 py-0">
      <CardContent className="p-4">
        <form onSubmit={save} className="space-y-3">
          <p className="text-sm font-medium">{existing ? t("site.reviews.yours") : t("site.reviews.rate")}</p>
          <FormError message={error} />
          <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} onMouseEnter={() => setHover(n)} aria-label={t("site.reviews.stars", { count: n })}>
                <Star className={cn("size-7 transition-colors", n <= (hover || rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40")} />
              </button>
            ))}
          </div>
          <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} maxLength={1000} placeholder={t("site.reviews.placeholder")} />
          <div className="flex justify-end gap-2">
            {existing && (
              <Button type="button" variant="ghost" className="text-destructive hover:text-destructive" onClick={remove}><Trash2 /> {t("common.actions.delete")}</Button>
            )}
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="animate-spin" />} {existing ? t("site.reviews.update") : t("site.reviews.post")}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
