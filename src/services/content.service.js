import { del, get, patch, post, put } from "./http"

export const contentService = {
  // Sections
  createSection: (courseId, title) => post("/sections", { courseId, title }),
  updateSection: (id, title) => put(`/sections/${id}`, { title }),
  deleteSection: (id) => del(`/sections/${id}`),
  reorderSections: (courseId, orderedIds) => patch(`/courses/${courseId}/sections/order`, { orderedIds }),

  // Lessons — { sectionId*, title*, content, videoUrl, durationMinutes, preview }
  // → LessonContentResponse { ..., completed, files[], nextLessonId }
  getLesson: (id) => get(`/lessons/${id}`),
  createLesson: (payload) => post("/lessons", payload),
  updateLesson: (id, payload) => put(`/lessons/${id}`, payload),
  deleteLesson: (id) => del(`/lessons/${id}`),
  reorderLessons: (sectionId, orderedIds) => patch(`/sections/${sectionId}/lessons/order`, { orderedIds }),
  deleteLessonFile: (fileId) => del(`/lesson-files/${fileId}`),
}
