import { get, post } from "./http"

export const assistantService = {
  // { enabled } — false when the server has no AI API key configured
  status: () => get("/assistant/status"),
  // { enabled, limit, used, left } — Bunny AI questions left for this lesson (3 per lesson)
  lessonStatus: (lessonId) => get(`/lessons/${lessonId}/assistant`),
  // messages: [{ role: "user" | "assistant", content }] (oldest first, ending with the question), language: "en" | "km"
  ask: (lessonId, messages, language) => post(`/lessons/${lessonId}/assistant`, { messages, language }),
}
