const e = import.meta.env

export const env = {
  apiBaseUrl: e.VITE_API_BASE_URL || "/api/v1",
  authFlow: e.VITE_AUTH_FLOW === "password" ? "password" : "pkce",
  keycloak: {
    url: (e.VITE_KEYCLOAK_URL || "").replace(/\/$/, ""),
    browserUrl: (e.VITE_KEYCLOAK_BROWSER_URL || "http://localhost:1401").replace(/\/$/, ""),
    realm: e.VITE_KEYCLOAK_REALM || "elearning",
    clientId: e.VITE_KEYCLOAK_CLIENT_ID || "postman-app",
  },
}

const oidcPath = `/realms/${env.keycloak.realm}/protocol/openid-connect`

// XHR calls (token/logout) — relative in dev so they go through the Vite proxy
export const keycloakOidcUrl = `${env.keycloak.url}${oidcPath}`
// Full-page navigations (login page)
export const keycloakBrowserOidcUrl = `${env.keycloak.browserUrl}${oidcPath}`
export const redirectUri = e.VITE_KEYCLOAK_REDIRECT_URI || `${window.location.origin}/auth/callback`
// Redirect lands outside this app (e.g. https://www.keycloak.org/app/) → user pastes the code back
export const isManualRedirect = new URL(redirectUri).origin !== window.location.origin
