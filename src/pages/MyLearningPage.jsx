import { Link } from "react-router-dom"
import { EmptyState, ErrorState, LoadingState } from "@/components/course/CourseBits"
import { EnrollmentList } from "@/components/sections/ContinueLearning"
import { normalizeEnrollment } from "@/lib/format"
import { useFetch } from "@/hooks/useFetch"
import { enrollmentService, toList } from "@/services/course.service"

export default function MyLearningPage() {
  const { data, loading, error, reload } = useFetch(() => enrollmentService.mine(), [])
  const items = toList(data).map(normalizeEnrollment)

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">My learning</h1>
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : items.length === 0 ? (
        <EmptyState title="You haven’t enrolled in a course yet">
          <Link to="/courses" className="text-primary hover:underline">Browse courses</Link>
        </EmptyState>
      ) : (
        <EnrollmentList items={items} />
      )}
    </div>
  )
}
