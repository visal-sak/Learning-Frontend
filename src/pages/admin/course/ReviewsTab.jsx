import { useState } from "react"
import { MdRateReview } from "react-icons/md"
import { useTranslation } from "react-i18next"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EmptyState, ErrorState, LoadingState } from "@/components/course/CourseBits"
import { RatingSummary, ReviewItem } from "@/components/course/ReviewList"
import { useCourse } from "./useCourse"
import { useFetch } from "@/hooks/useFetch"
import { useRoles } from "@/hooks/useRoles"
import { reviewService } from "@/services/review.service"
import { toList } from "@/services/http"

export default function ReviewsTab() {
  const { t } = useTranslation()
  const { course } = useCourse()
  const { isAdmin } = useRoles()
  const [page, setPage] = useState(0)
  const summary = useFetch(() => reviewService.summary(course.id), [course.id])
  const list = useFetch(() => reviewService.byCourse(course.id, { page, size: 10, sort: "createdAt,desc" }), [course.id, page])
  const reviews = toList(list.data)

  const onDelete = async (r) => {
    await reviewService.deleteAny(r.id)
    list.reload()
    summary.reload()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="py-2">
          {summary.loading ? <LoadingState variant="section" /> : summary.error ? <ErrorState error={summary.error} onRetry={summary.reload} className="py-6" /> : <RatingSummary summary={summary.data} />}
        </CardContent>
      </Card>

      {list.loading && !list.data ? (
        <LoadingState />
      ) : list.error ? (
        <ErrorState error={list.error} onRetry={list.reload} />
      ) : reviews.length === 0 ? (
        <EmptyState icon={MdRateReview} title={t("admin.reviews.empty")}>{t("admin.reviewsTab.emptyHint")}</EmptyState>
      ) : (
        <>
          <ul className="divide-y rounded-xl border glass px-4">
            {reviews.map((r) => <ReviewItem key={r.id} review={r} onDelete={isAdmin ? onDelete : undefined} />)}
          </ul>
          {list.data?.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>{t("admin.shared.previous")}</Button>
              <span className="text-sm text-muted-foreground">{t("admin.shared.pageOf", { page: page + 1, total: list.data.totalPages })}</span>
              <Button variant="outline" size="sm" disabled={list.data.last} onClick={() => setPage((p) => p + 1)}>{t("admin.shared.next")}</Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
