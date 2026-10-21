import { useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/admin/AdminUI"
import { EmptyState, ErrorState, LoadingState } from "@/components/course/CourseBits"
import { ReviewItem } from "@/components/course/ReviewList"
import { useFetch } from "@/hooks/useFetch"
import { useRoles } from "@/hooks/useRoles"
import { reviewService } from "@/services/review.service"
import { toList } from "@/services/http"

export default function InstructorReviewsPage() {
  const { isAdmin } = useRoles()
  const [page, setPage] = useState(0)
  const { data, loading, error, reload } = useFetch(() => reviewService.forInstructor({ page, size: 15, sort: "createdAt,desc" }), [page])
  const reviews = toList(data)

  return (
    <>
      <PageHeader title="Student reviews" description="What students are saying about your courses." />
      {loading && !data ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : reviews.length === 0 ? (
        <EmptyState title="No reviews yet">Reviews from enrolled students will show up here.</EmptyState>
      ) : (
        <>
          <ul className="divide-y rounded-xl border glass px-4">
            {reviews.map((r) => (
              <ReviewItem
                key={r.id}
                review={r}
                onDelete={isAdmin ? async () => { await reviewService.deleteAny(r.id); reload() } : undefined}
                footer={
                  <Link to={`/admin/courses/${r.courseId}/reviews`} className="text-xs text-primary hover:underline">
                    View all reviews for this course →
                  </Link>
                }
              />
            ))}
          </ul>
          {data?.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <span className="text-sm text-muted-foreground">Page {page + 1} of {data.totalPages}</span>
              <Button variant="outline" size="sm" disabled={data.last} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          )}
        </>
      )}
    </>
  )
}
