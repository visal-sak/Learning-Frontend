import { del, get, put } from "./http"

export const reviewService = {
  // PageResponse<ReviewResponse>
  byCourse: (courseId, params) => get(`/courses/${courseId}/reviews`, params),
  // RatingSummaryResponse { average, total, distribution: { "5": n, ... } }
  summary: (courseId) => get(`/courses/${courseId}/reviews/summary`),
  mine: (courseId) => get(`/courses/${courseId}/reviews/mine`),
  // { rating 1-5, comment }
  save: (courseId, payload) => put(`/courses/${courseId}/reviews/mine`, payload),
  deleteMine: (courseId) => del(`/courses/${courseId}/reviews/mine`),
  // Instructor: reviews left on my courses (paged)
  forInstructor: (params) => get("/my/reviews", params),
  // Admin moderation
  deleteAny: (reviewId) => del(`/reviews/${reviewId}`),
}
