import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import AuthLayout from "@/components/auth/AuthLayout"
import FormField, { FormError } from "@/components/auth/FormField"
import { useAuthStore } from "@/store"
import { getErrorMessage } from "@/lib/api"
import { env, isManualRedirect } from "@/config/env"
import KeycloakRedirect from "@/components/auth/KeycloakRedirect"
import { useTranslation } from "react-i18next"

const empty = { username: "", email: "", firstName: "", lastName: "", password: "", confirmedPassword: "" }

// `t` translates the messages (site.auth.validation.*)
function validate(f, t) {
  const e = {}
  if (!f.firstName.trim()) e.firstName = t("site.auth.validation.required")
  if (!f.lastName.trim()) e.lastName = t("site.auth.validation.required")
  if (!f.username.trim()) e.username = t("site.auth.validation.required")
  else if (/\s/.test(f.username)) e.username = t("site.auth.validation.noSpaces")
  if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = t("site.auth.validation.email")
  if (f.password.length < 5) e.password = t("site.auth.validation.passwordLength")
  if (f.confirmedPassword !== f.password) e.confirmedPassword = t("site.auth.validation.passwordMatch")
  return e
}

// Custom form (password flow / manual-redirect mode) — posts to POST /auth/register
function CustomRegisterPage() {
  const register = useAuthStore((s) => s.register)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    if (errors[name]) setErrors((x) => ({ ...x, [name]: undefined }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError("")
    const v = validate(form, t)
    setErrors(v)
    if (Object.keys(v).length) return
    setLoading(true)
    try {
      await register({ ...form, username: form.username.trim(), email: form.email.trim() })
      // In PKCE mode the browser is already being redirected to Keycloak
      if (env.authFlow === "password") navigate("/", { replace: true })
      else if (isManualRedirect) navigate("/login", { replace: true })
    } catch (err) {
      // Account was created but auto-login failed: let them log in manually
      if (err?.config?.url?.includes("/protocol/openid-connect/token")) {
        navigate("/login", { replace: true })
        return
      }
      setError(getErrorMessage(err, t("site.auth.errors.registerFailed")))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title={t("site.auth.register.title")}
      subtitle={t("site.auth.register.subtitle")}
      footer={
        <>
          {t("site.auth.register.haveAccount")}{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">{t("common.nav.logIn")}</Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <FormError message={error} />
        <div className="grid grid-cols-2 gap-3">
          <FormField id="firstName" label={t("site.auth.fields.firstName")} autoComplete="given-name" value={form.firstName} onChange={onChange} error={errors.firstName} />
          <FormField id="lastName" label={t("site.auth.fields.lastName")} autoComplete="family-name" value={form.lastName} onChange={onChange} error={errors.lastName} />
        </div>
        <FormField id="username" label={t("site.auth.fields.username")} autoComplete="username" value={form.username} onChange={onChange} error={errors.username} />
        <FormField id="email" label={t("site.auth.fields.email")} type="email" autoComplete="email" value={form.email} onChange={onChange} error={errors.email} />
        <FormField id="password" label={t("site.auth.fields.password")} type="password" autoComplete="new-password" value={form.password} onChange={onChange} error={errors.password} />
        <FormField id="confirmedPassword" label={t("site.auth.fields.confirmPassword")} type="password" autoComplete="new-password" value={form.confirmedPassword} onChange={onChange} error={errors.confirmedPassword} />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="animate-spin" />}
          {t("site.auth.register.submit")}
        </Button>
      </form>
    </AuthLayout>
  )
}

export default function RegisterPage() {
  // Standard PKCE flow: go straight to the Keycloak sign-up form
  if (env.authFlow === "pkce" && !isManualRedirect) return <KeycloakRedirect action="register" />
  return <CustomRegisterPage />
}
