import { del, get, post, put } from "./http"

export const noteService = {
  // NoteResponse[] { id, lessonId, lessonTitle, courseId, courseTitle, timestampSeconds, body, createdAt, updatedAt }
  forLesson: (lessonId) => get("/my/notes", { lessonId }),
  mine: () => get("/my/notes"),
  // { lessonId, timestampSeconds (optional), body }
  create: (payload) => post("/my/notes", payload),
  update: (id, payload) => put(`/my/notes/${id}`, payload),
  remove: (id) => del(`/my/notes/${id}`),
}
