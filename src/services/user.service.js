import { get, put } from "./http"

export const userService = {
  getMe: () => get("/users/me"),
  // UpdateProfileRequest { displayName*, headline, bio, avatarUrl, gender, facebookProfile, telegramProfile }
  updateMe: (payload) => put("/users/me", payload),
  getById: (id) => get(`/users/${id}`),
  // PublicProfileResponse { id, displayName, headline, avatarUrl }
  publicProfile: (id) => get(`/users/${id}/profile`),
  // { url } — where to change the password (Keycloak account console)
  passwordChangeLocation: () => get("/users/me/password"),
}
