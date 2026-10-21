import { get } from "./http"

export const reportService = {
  // Admin — PlatformStatsResponse
  platform: () => get("/reports/platform"),
  // Instructor — InstructorStatsResponse
  myTeaching: () => get("/reports/my-teaching"),
  // TopCourseResponse[] { courseId, title, thumbnailUrl, enrollmentCount, averageRating, reviewCount, ... }
  topCourses: (limit = 5) => get("/reports/top-courses", { limit }),
  topRated: (limit = 5) => get("/reports/top-rated", { limit }),
}
