import { create } from "zustand"
import { persist } from "zustand/middleware"
import { configureApi } from "@/lib/api"
import { decodeJwt } from "@/lib/jwt"
import { cookieAuthStorage } from "@/lib/cookie-storage"
import { authService } from "@/services/auth.service"
import { userService } from "@/services/user.service"
import { createPkcePair, randomString } from "@/lib/pkce"
import { env, isManualRedirect } from "@/config/env"

const EXPIRY_SKEW_MS = 30_000
const PKCE_KEY = "pkce"
let callbackPromise = null

const initialState = {
  accessToken: null,
  refreshToken: null,
  expiresAt: 0, // ms epoch
  claims: null, // decoded access token (name, email, roles…)
  user: null, // GET /users/me
  isLoadingUser: false,
}

function tokensToState(t) {
  const claims = decodeJwt(t.access_token)
  return {
    accessToken: t.access_token,
    refreshToken: t.refresh_token,
    expiresAt: Date.now() + t.expires_in * 1000,
    claims,
  }
}

let refreshPromise = null

// Other open tabs hear about a sign-out and drop their in-memory session too
const authChannel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("autumn-auth") : null

// Everything tied to the signed-in user. Device preferences (theme, admin sidebar collapsed) stay.
function clearSessionData() {
  useAuthStore.persist.clearStorage() // auth_at / auth_rt / auth_exp cookies
  try {
    sessionStorage.clear() // unfinished PKCE login (verifier, state, return path)
    Object.keys(localStorage)
      .filter((key) => key === "auth" || key.startsWith("quiz:")) // old token store, admin quiz ids
      .forEach((key) => localStorage.removeItem(key))
  } catch {
    /* storage blocked — nothing to clear */
  }
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      isAuthenticated: () => !!get().accessToken,
      roles: () => get().claims?.realm_access?.roles ?? [],
      hasRole: (role) => get().roles().includes(role),

      // Password flow (custom form)
      login: async (credentials) => {
        const tokens = await authService.login(credentials)
        set(tokensToState(tokens))
        await get().fetchMe().catch(() => {})
      },

      // PKCE flow, step 1 (GET /auth): send the user to the Keycloak login page.
      // With an external redirect URI (e.g. keycloak.org/app) it opens in a new tab and
      // the user pastes the redirected URL back into the login page.
      startLogin: async ({ returnTo = "/", loginHint, action } = {}) => {
        const { verifier, challenge } = await createPkcePair()
        const state = randomString(16)
        sessionStorage.setItem(PKCE_KEY, JSON.stringify({ verifier, state, returnTo }))
        const url = authService.buildAuthorizeUrl({ challenge, state, loginHint, action })
        if (isManualRedirect && window.open(url, "_blank")) return
        window.location.assign(url)
      },

      // PKCE flow, step 2 (POST /token): exchange the code for tokens. Returns the path to go back to.
      completeLogin: ({ code, state }) => {
        // StrictMode runs effects twice; a code can only be exchanged once
        if (callbackPromise?.code === code) return callbackPromise.promise
        const promise = (async () => {
          const saved = JSON.parse(sessionStorage.getItem(PKCE_KEY) || "null")
          if (!saved) throw new Error("Login session expired. Click “Open sign-in page” again.")
          if (state && saved.state !== state) throw new Error("This code belongs to an older login attempt. Please sign in again.")
          const tokens = await authService.exchangeCode({ code, verifier: saved.verifier })
          sessionStorage.removeItem(PKCE_KEY)
          set(tokensToState(tokens))
          await get().fetchMe().catch(() => {})
          return saved.returnTo || "/"
        })()
        callbackPromise = { code, promise }
        return promise
      },

      register: async (payload) => {
        await authService.register(payload)
        if (env.authFlow === "pkce") {
          // Manual mode: the register page sends the user to /login to finish
          if (!isManualRedirect) await get().startLogin({ loginHint: payload.username })
        } else {
          await get().login({ username: payload.username, password: payload.password })
        }
      },

      // Sign out everywhere: this tab, other open tabs, and the Keycloak SSO session
      logout: async () => {
        const { refreshToken } = get()
        refreshPromise = null
        callbackPromise = null
        set(initialState)
        clearSessionData()
        authChannel?.postMessage("logout")
        // Ends the session on Keycloak too, so the next sign-in asks for the password again
        if (refreshToken) await authService.logout(refreshToken).catch(() => {})
      },

      // Single-flight token refresh; returns the new access token or null
      refresh: () => {
        if (refreshPromise) return refreshPromise
        const { refreshToken } = get()
        if (!refreshToken) return Promise.resolve(null)
        refreshPromise = authService
          .refresh(refreshToken)
          .then((t) => {
            set(tokensToState(t))
            return t.access_token
          })
          .catch(() => {
            set(initialState)
            return null
          })
          .finally(() => {
            refreshPromise = null
          })
        return refreshPromise
      },

      getValidAccessToken: async () => {
        const { accessToken, expiresAt } = get()
        if (!accessToken) return null
        if (Date.now() < expiresAt - EXPIRY_SKEW_MS) return accessToken
        return get().refresh()
      },

      fetchMe: async () => {
        set({ isLoadingUser: true })
        try {
          const user = await userService.getMe()
          set({ user })
          return user
        } finally {
          set({ isLoadingUser: false })
        }
      },

      updateMe: async (payload) => {
        const updated = await userService.updateMe(payload)
        set((s) => ({ user: { ...s.user, ...payload, ...(updated && typeof updated === "object" ? updated : {}) } }))
        return updated
      },
    }),
    {
      name: "auth",
      // Session lives in cookies (not localStorage); claims are re-decoded and the profile re-fetched on load
      storage: cookieAuthStorage,
      partialize: (s) => ({
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        expiresAt: s.expiresAt,
      }),
    }
  )
)

authChannel?.addEventListener("message", (e) => {
  if (e.data === "logout") useAuthStore.setState(initialState)
})

// Wire the axios instance to the store
configureApi({
  getAccessToken: () => useAuthStore.getState().getValidAccessToken(),
  refresh: () => useAuthStore.getState().refresh(),
  onAuthFailure: () => useAuthStore.setState(initialState),
})

// Convenience: display info merged from /users/me and the token
export function selectDisplayUser(s) {
  const c = s.claims ?? {}
  const u = s.user ?? {}
  const name = u.displayName || c.name || [c.given_name, c.family_name].filter(Boolean).join(" ") || c.preferred_username || ""
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("")
  return {
    name,
    initials: initials || "U",
    email: u.email || c.email,
    username: u.username || c.preferred_username,
    avatarUrl: u.avatarUrl,
  }
}
