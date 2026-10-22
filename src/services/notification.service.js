import { get, post } from "./http"

// In-app notifications (the bell). Live updates come from /my/notifications/stream (see NotificationBell).
// NotificationResponse { id, type, title, body, link, read, createdAt }
export const notificationService = {
  list: (limit = 20) => get("/my/notifications", { limit }),
  unreadCount: () => get("/my/notifications/unread-count"), // { unread }
  markRead: (id) => post(`/my/notifications/${id}/read`),
  markAllRead: () => post("/my/notifications/read-all"),
}
