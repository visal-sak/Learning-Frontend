import { decodeJwt } from "@/lib/jwt"

/**
 * zustand `persist` storage that keeps the session in cookies instead of localStorage.
 *
 * Each value gets its own cookie (a browser cookie holds ~4 KB, a Keycloak token is 1–2 KB):
 *   auth_at  — access token
 *   auth_rt  — refresh token
 *   auth_exp — access-token expiry (ms epoch)
 * Claims and the /users/me profile are not stored: claims are decoded from the access token
 * on load and the profile is re-fetched by App on start-up.
 *
 * Cookies are SameSite=Strict, Path=/, Secure on https, and live as long as the refresh token
 * (its `exp` claim), so closing the browser keeps you signed in until the Keycloak session ends.
 * They are written from JS, so they cannot be HttpOnly — that needs the backend to set them.
 */
const KEYS = { accessToken: "auth_at", refreshToken: "auth_rt", expiresAt: "auth_exp" }

function readCookie(name) {
  const hit = document.cookie.split("; ").find((c) => c.startsWith(name + "="))
  return hit ? decodeURIComponent(hit.slice(name.length + 1)) : null
}

function writeCookie(name, value, maxAgeSec) {
  const parts = [`${name}=${encodeURIComponent(value)}`, "Path=/", "SameSite=Strict"]
  if (maxAgeSec != null) parts.push(`Max-Age=${Math.max(0, Math.floor(maxAgeSec))}`)
  if (window.location.protocol === "https:") parts.push("Secure")
  document.cookie = parts.join("; ")
}

const deleteCookie = (name) => writeCookie(name, "", 0)

export const cookieAuthStorage = {
  getItem: () => {
    const accessToken = readCookie(KEYS.accessToken)
    const refreshToken = readCookie(KEYS.refreshToken)
    if (!accessToken && !refreshToken) return null
    return {
      state: {
        accessToken,
        refreshToken,
        expiresAt: Number(readCookie(KEYS.expiresAt)) || 0,
        claims: accessToken ? decodeJwt(accessToken) : null,
      },
      version: 0,
    }
  },

  setItem: (_name, { state }) => {
    if (!state.accessToken && !state.refreshToken) {
      Object.values(KEYS).forEach(deleteCookie)
      return
    }
    // Keep all three cookies for the refresh token's lifetime; an expired access token is
    // swapped for a new one through the refresh token (see getValidAccessToken)
    const refreshExp = decodeJwt(state.refreshToken)?.exp
    const maxAge = refreshExp ? refreshExp - Date.now() / 1000 : undefined // undefined → session cookie
    writeCookie(KEYS.accessToken, state.accessToken ?? "", maxAge)
    writeCookie(KEYS.refreshToken, state.refreshToken ?? "", maxAge)
    writeCookie(KEYS.expiresAt, String(state.expiresAt ?? 0), maxAge)
  },

  removeItem: () => Object.values(KEYS).forEach(deleteCookie),
}

// One-time migration: sessions used to be saved in localStorage under "auth".
// Move an existing session into the cookies (so nobody is signed out), then delete it.
try {
  const old = JSON.parse(localStorage.getItem("auth") || "null")?.state
  if (old?.refreshToken && !readCookie(KEYS.refreshToken)) cookieAuthStorage.setItem("auth", { state: old })
  localStorage.removeItem("auth")
} catch {
  /* storage blocked or unreadable — nothing to migrate */
}
