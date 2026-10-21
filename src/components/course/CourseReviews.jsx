import { useEffect, useState } from "react"
import { Loader2, Star, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { FormError } from "@/components/auth/FormField"
import { LoadingState } from "@/components/course/CourseBits"
import { RatingSummary } from "@/components/course/ReviewList"
import { TwitterCard } from "@/components/ui/twitter-card"
import { reviewToTweet } from "@/lib/review-card"
import { useFetch } from "@/hooks/useFetch"
import { reviewService } from "@/services/review.service"
import { toList } from "@/services/http"
import { getErrorMessage } from "@/lib/api"
import { cn } from "@/lib/utils"
import { confirm } from "@/store/confirm.store"
import { toast } from "@/lib/toast"

// Ratings + reviews block for the course page (all review endpoints need a logged-in user)
export default function CourseReviews({ courseId, canReview }) {
  const [page, setPage] = useState(0)
  const summary = useFetch(() => reviewService.summary(courseId), [courseId])
  const list = useFetch(() => reviewService.byCourse(courseId, { page, size: 5, sort: "createdAt,desc" }), [courseId, page])
  const reviews = toList(list.data)

  const refresh = () => {
    summary.reload()
    list.reload()
  }

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-semibold">Student reviews</h2>

      {summary.loading && !summary.data ? <LoadingState className="py-6" /> : summary.data && <RatingSummary summary={summary.data} />}

      {canReview && <MyReview courseId={courseId} onChange={refresh} />}

      {list.loading && !list.data ? (
        <LoadingState className="py-6" />
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reviews yet{canReview ? " — be the first!" : "."}</p>
      ) : (
        <>
          <ul className="space-y-3">
            {reviews.map((r) => (
              <li key={r.id}>
                <TwitterCard
                  {...reviewToTweet(r)}
                  context={r.mine ? "Your review" : r.percentCompleteWhenWritten != null ? `Written at ${r.percentCompleteWhenWritten}% progress` : null}
                />
              </li>
            ))}
          </ul>
          {list.data?.totalPages > 1 && (
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Newer</Button>
              <span className="text-sm text-muted-foreground">Page {page + 1} of {list.data.totalPages}</span>
              <Button variant="outline" size="sm" disabled={list.data.last} onClick={() => setPage((p) => p + 1)}>Older</Button>
            </div>
          )}
        </>
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
    if (!rating) return setError("Pick a star rating.")
    setError("")
    setSaving(true)
    try {
      setExisting(await reviewService.save(courseId, { rating, comment: comment.trim() }))
      onChange()
      toast.success(existing ? "Review updated" : "Review posted", "Thanks for sharing your feedback!")
    } catch (err) {
      setError(getErrorMessage(err, "Couldn’t save your review"))
      toast.error("Couldn’t save your review", err)
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!(await confirm({ title: "Delete your review?", description: "Your rating and comment will be removed.", confirmLabel: "Delete review" }))) return
    try {
      await reviewService.deleteMine(courseId)
      setExisting(null)
      setRating(0)
      setComment("")
      onChange()
      toast.success("Review deleted")
    } catch (err) {
      setError(getErrorMessage(err, "Couldn’t delete your review"))
      toast.error("Couldn’t delete your review", err)
    }
  }

  if (existing === undefined) return null

  return (
    <Card className="gap-0 py-0">
      <CardContent className="p-4">
        <form onSubmit={save} className="space-y-3">
          <p className="text-sm font-medium">{existing ? "Your review" : "Rate this course"}</p>
          <FormError message={error} />
          <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} onMouseEnter={() => setHover(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`}>
                <Star className={cn("size-7 transition-colors", n <= (hover || rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40")} />
              </button>
            ))}
          </div>
          <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} maxLength={1000} placeholder="What did you like? What could be better? (optional)" />
          <div className="flex justify-end gap-2">
            {existing && (
              <Button type="button" variant="ghost" className="text-destructive hover:text-destructive" onClick={remove}><Trash2 /> Delete</Button>
            )}
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="animate-spin" />} {existing ? "Update review" : "Post review"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
