import { del, get, put } from "./http"

export const bookmarkService = {
  // BookmarkResponse[] { lessonId, lessonTitle, durationMinutes, sectionTitle, courseId, courseTitle, courseThumbnailUrl, createdAt }
  mine: () => get("/my/bookmarks"),
  add: (lessonId) => put(`/my/bookmarks/${lessonId}`),
  remove: (lessonId) => del(`/my/bookmarks/${lessonId}`),
}
