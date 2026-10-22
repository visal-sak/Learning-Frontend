import { del, get, post } from "./http"

// Extra Bunny AI help per student per lesson (admins: any course; instructors: their own)
// AiAccessGrantResponse { id, userId, studentName, email, lessonId, lessonTitle, extraQuestions, extraHints, note, grantedByName, createdAt }
export const aiAccessService = {
  forCourse: (courseId) => get("/manage/ai-access", { courseId }),
  // { lessonId, userIds: [], extraQuestions, extraHints, note, sendEmail }
  grant: (payload) => post("/manage/ai-access", payload),
  revoke: (id) => del(`/manage/ai-access/${id}`),
}
