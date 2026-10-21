import axios from "axios"
import { api, unwrap } from "@/lib/api"
import { env, keycloakOidcUrl, keycloakBrowserOidcUrl, redirectUri } from "@/config/env"

const form = (data) => new URLSearchParams({ client_id: env.keycloak.clientId, ...data })
const formHeaders = { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
const postToken = (data) => axios.post(`${keycloakOidcUrl}/token`, form(data), formHeaders).then((r) => r.data)

export const authService = {
  // Standard flow + PKCE: URL of the Keycloak login page
  buildAuthorizeUrl: ({ challenge, state, loginHint, action }) => {
    const params = new URLSearchParams({
      client_id: env.keycloak.clientId,
      response_type: "code",
      redirect_uri: redirectUri,
      scope: "openid profile email",
      code_challenge: challenge,
      code_challenge_method: "S256",
      state,
    })
    if (loginHint) params.set("login_hint", loginHint)
    // Keycloak's own registration page
    const path = action === "register" ? "registrations" : "auth"
    return `${keycloakBrowserOidcUrl}/${path}?${params}`
  },

  exchangeCode: ({ code, verifier }) =>
    postToken({ grant_type: "authorization_code", code, code_verifier: verifier, redirect_uri: redirectUri }),

  // Resource Owner Password grant — requires "Direct access grants" on the client
  login: ({ username, password }) => postToken({ grant_type: "password", username, password, scope: "openid profile email" }),

  refresh: (refreshToken) => postToken({ grant_type: "refresh_token", refresh_token: refreshToken }),

  logout: (refreshToken) => axios.post(`${keycloakOidcUrl}/logout`, form({ refresh_token: refreshToken }), formHeaders),

  // { username, email, firstName, lastName, password, confirmedPassword }
  register: (payload) => api.post("/auth/register", payload).then(unwrap),
}
