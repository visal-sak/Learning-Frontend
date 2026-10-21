import { del, get, post, put } from "./http"

export const quizService = {
  // Student — QuizTakeResponse (no correct answers)
  take: (courseId) => get(`/courses/${courseId}/quiz/take`),
  // answers: [{ questionId, selectedOptionId }] → AttemptResultResponse
  submit: (quizId, answers) => post(`/quizzes/${quizId}/attempts`, { answers }),
  myAttempts: (quizId) => get(`/quizzes/${quizId}/my-attempts`),

  // Instructor — { courseId*, title*, instructions, passMark, maxAttempts, timeLimitMinutes }
  create: (payload) => post("/quizzes", payload),
  update: (id, payload) => put(`/quizzes/${id}`, payload),
  remove: (id) => del(`/quizzes/${id}`),
  // QuizDetailResponse (with correct answers)
  forEditing: (id) => get(`/quizzes/${id}/edit`),
  allAttempts: (id) => get(`/quizzes/${id}/attempts`),

  // Questions — { quizId, text*, explanation, points, options: [{ id?, text*, correct }] (2–6) }
  addQuestion: (payload) => post("/questions", payload),
  updateQuestion: (id, payload) => put(`/questions/${id}`, payload),
  deleteQuestion: (id) => del(`/questions/${id}`),
}
