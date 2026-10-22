import { get, post, put } from "./http"

// Lesson checks — a short quiz at the end of a lesson (separate from the course's final quiz)
export const lessonCheckService = {
  // Student: { lessonId, questions[{ id, type, text, options[{ text }] }], myResult { correct, total, scorePercent, attempts, answeredAt } | null }
  take: (lessonId) => get(`/lessons/${lessonId}/check`),
  // answers: [{ questionId, selected: [optionIndex…], text }] → { correct, total, scorePercent, results[{ questionId, correct, correctOptions, acceptedAnswers, explanation }] }
  submit: (lessonId, answers) => post(`/lessons/${lessonId}/check`, { answers }),
  // Instructor / admin: questions with answer keys
  forEditing: (lessonId) => get(`/lessons/${lessonId}/check/edit`),
  // questions: [{ id?, type, text, explanation, options[{ text, correct }], acceptedAnswers[] }] — [] removes the check
  // passMark: % needed to pass (null = any submission counts)
  save: (lessonId, questions, passMark = null) => put(`/lessons/${lessonId}/check`, { questions, passMark }),
}
