import axios from "axios"
import { env } from "@/config/env"
import i18n from "@/i18n"

export const api = axios.create({
  baseURL: env.apiBaseUrl,
  headers: { "Content-Type": "application/json" },
})

// The auth store registers these at startup (avoids a circular import).
let handlers = {
  getAccessToken: async () => null,
  refresh: async () => null,
  onAuthFailure: () => {},
}

export function configureApi(h) {
  handlers = { ...handlers, ...h }
}

api.interceptors.request.use(async (config) => {
  const token = await handlers.getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  // Backend messages come back in the UI language (English / Khmer)
  config.headers["Accept-Language"] = i18n.language || "en"
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true
      const token = await handlers.refresh().catch(() => null)
      if (token) {
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      }
      handlers.onAuthFailure()
    }
    return Promise.reject(error)
  }
)

// Backends often wrap payloads as { data: ... } — accept both shapes.
export const unwrap = (res) => res.data?.data ?? res.data

export function getErrorMessage(err, fallback = "Something went wrong") {
  const d = err?.response?.data
  if (typeof d === "string" && d) return d
  return d?.error_description || d?.message || d?.error || err?.message || fallback
}
