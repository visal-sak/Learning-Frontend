import { get, post } from "./http"

export const assistantService = {
  // { enabled } — false when the server has no AI API key configured
  status: () => get("/assistant/status"),
  // messages: [{ role: "user" | "assistant", content }] (oldest first, ending with the question), language: "en" | "km"
  ask: (lessonId, messages, language) => post(`/lessons/${lessonId}/assistant`, { messages, language }),
}
