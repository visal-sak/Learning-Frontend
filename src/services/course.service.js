import { del, get, patch, post, put } from "./http"

export { toList } from "./http"
export { contentService } from "./content.service"
export { enrollmentService } from "./enrollment.service"

export const courseService = {
  // Public search → PageResponse<CourseSummary>. Params: { q, categoryId, level, page, size, sort }
  list: (params) => get("/courses", params),
  // CourseDetailResponse (sections, enrolled, editable, percentComplete, reviewNote)
  get: (id) => get(`/courses/${id}`),
  getBySlug: (slug) => get(`/courses/slug/${slug}`),
  // Public curriculum → SectionResponse[]
  curriculum: (id) => get(`/courses/${id}/curriculum`),

  // Instructor / Admin
  mine: () => get("/courses/mine"),
  // CreateCourseRequest { title*, categoryId*, summary, description, thumbnailUrl, level }
  create: (payload) => post("/courses", payload),
  update: (id, payload) => put(`/courses/${id}`, payload),
  remove: (id) => del(`/courses/${id}`),
  // status: DRAFT | PENDING_REVIEW | PUBLISHED | REJECTED | ARCHIVED
  changeStatus: (id, status, note) => patch(`/courses/${id}/status`, { status, note }),
  pendingReview: () => get("/courses/pending-review"),
}
