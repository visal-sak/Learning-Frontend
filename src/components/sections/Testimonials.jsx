import { Link } from "react-router-dom"
import { TwitterCard } from "@/components/ui/twitter-card"
import { reviewToTweet } from "@/lib/review-card"
import { LoadingState } from "@/components/course/CourseBits"
import { useFetch } from "@/hooks/useFetch"
import { useAuthStore } from "@/store"
import { courseService } from "@/services/course.service"
import { reviewService } from "@/services/review.service"
import { toList } from "@/services/http"

const MAX = 3

// Best real reviews across published courses: 3★+ with a comment, preferring one per author
// (if there are too few distinct authors, more reviews from the same people fill the remaining slots)
async function loadTopReviews() {
  const courses = toList(await courseService.list({ size: 12 }))
  const fetchFor = (c) =>
    reviewService
      .byCourse(c.id, { size: 5, sort: "rating,desc" })
      .then((page) => toList(page).map((r) => ({ ...r, courseId: c.id, courseTitle: c.title })))

  // Probe one course first: if reviews need a login we stop here instead of firing N failing requests
  if (!courses.length) return []
  const first = await Promise.allSettled([fetchFor(courses[0])])
  if (first[0].status === "rejected" && [401, 403].includes(first[0].reason?.response?.status)) return []
  const results = [...first, ...(await Promise.allSettled(courses.slice(1).map(fetchFor)))]
  const ranked = results
    .flatMap((r) => (r.status === "fulfilled" ? r.value : []))
    .filter((r) => r.rating >= 3 && r.comment?.trim())
    .sort((a, b) => b.rating - a.rating || (b.comment.length > 40) - (a.comment.length > 40))
  const seen = new Set()
  const unique = ranked.filter((r) => (seen.has(r.authorId) ? false : seen.add(r.authorId)))
  return [...unique, ...ranked.filter((r) => !unique.includes(r))].slice(0, MAX)
}


export default function Testimonials() {
  // Review endpoints currently require a login — refetch when the session changes
  const isAuthed = useAuthStore((s) => !!s.accessToken)
  const { data: reviews, loading } = useFetch(loadTopReviews, [isAuthed])

  // No real reviews to show (or not allowed to read them) → hide rather than show placeholders
  if (!loading && !reviews?.length) return null

  return (
    <section id="reviews" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-bold tracking-tight">Loved by learners</h2>
        <p className="mt-2 text-muted-foreground">Real reviews from students on our courses.</p>
      </div>
      {loading ? (
        <LoadingState />
      ) : (
        // centred row: 1–2 reviews sit in the middle instead of hugging the left column
        <div className="flex flex-wrap justify-center gap-6">
          {reviews.map((r) => (
            <TwitterCard
              key={r.id}
              {...reviewToTweet(r)}
              className="w-full md:w-[calc((100%-3rem)/3)]"
              context={
                <Link to={`/courses/${r.courseId}`} className="hover:text-primary hover:underline">
                  on {r.courseTitle}
                </Link>
              }
            />
          ))}
        </div>
      )}
    </section>
  )
}
