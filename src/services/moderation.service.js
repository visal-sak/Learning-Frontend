import { del, get, post } from "./http"

export const moderationService = {
  // Any signed-in user — reason: SPAM | OFFENSIVE | OFF_TOPIC | MISLEADING | OTHER
  reportReview: (reviewId, { reason, details }) => post(`/reviews/${reviewId}/report`, { reason, details }),

  // Admin — ReportedReviewResponse[] (grouped by review), status: OPEN | DISMISSED
  queue: (status = "OPEN") => get("/moderation/reviews", { status }),
  summary: () => get("/moderation/summary"),
  dismiss: (reviewId) => post(`/moderation/reviews/${reviewId}/dismiss`),
  removeReview: (reviewId) => del(`/moderation/reviews/${reviewId}`),
}
