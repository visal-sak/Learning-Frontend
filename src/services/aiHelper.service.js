import { get, post } from "./http"

// AI helper inside quizzes. scope = "lesson-checks" (id = lessonId) or "quizzes" (id = final quiz id)
// status → { configured, hintsEnabled, hintsPerAttempt, hintsUsed, hintsLeft, explainEnabled, hintPenalty }
export const aiHelperService = {
  status: (scope, id) => get(`/ai-helper/${scope}/${id}`),
  // → { hint, hintsUsed, hintsLeft }
  // answer: the student's current choice (same shape as explain); previousHints: hints already shown for this question
  hint: (scope, id, questionId, answer, previousHints, language) =>
    post(`/ai-helper/${scope}/${id}/hint`, { questionId, ...answer, previousHints, language }),
  // answer: { selected: [index…] } (lesson quiz) | { selectedOptionIds: [id…] } (final quiz) | { text }
  explain: (scope, id, questionId, answer, language) => post(`/ai-helper/${scope}/${id}/explain`, { questionId, ...answer, language }),
}
