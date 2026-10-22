import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import en from "./en"
import km from "./km"

/**
 * English / Khmer UI text.
 * - The choice is remembered in localStorage ("lang") and mirrored on <html lang>.
 * - Every API request sends it as Accept-Language (see lib/api.js), so backend messages match.
 * - Course content (titles, lessons written by instructors) is shown as written.
 */
export const LANGUAGES = [
  { code: "en", label: "English", short: "EN" },
  { code: "km", label: "ខ្មែរ", short: "ខ្មែរ" },
]

const stored = (() => {
  try {
    return localStorage.getItem("lang")
  } catch {
    return null
  }
})()

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, km: { translation: km } },
  lng: LANGUAGES.some((l) => l.code === stored) ? stored : "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false }, // React already escapes
  returnNull: false,
})

const apply = (lng) => {
  document.documentElement.lang = lng
  try {
    localStorage.setItem("lang", lng)
  } catch {
    /* storage blocked */
  }
}
apply(i18n.language)
i18n.on("languageChanged", apply)

export default i18n
