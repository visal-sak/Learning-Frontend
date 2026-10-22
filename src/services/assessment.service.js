import { get } from "./http"

export const assessmentService = {
  // Instructor (own courses) / Admin (all) — AssessmentSummaryResponse[]
  list: () => get("/assessments"),
  // AssessmentDetailResponse { summary, distribution[], questions[], students[] }
  detail: (courseId) => get(`/assessments/${courseId}`),
}
