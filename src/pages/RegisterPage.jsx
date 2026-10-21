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

const empty = { username: "", email: "", firstName: "", lastName: "", password: "", confirmedPassword: "" }

function validate(f) {
  const e = {}
  if (!f.firstName.trim()) e.firstName = "Required"
  if (!f.lastName.trim()) e.lastName = "Required"
  if (!f.username.trim()) e.username = "Required"
  else if (/\s/.test(f.username)) e.username = "No spaces allowed"
  if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = "Enter a valid email"
  if (f.password.length < 5) e.password = "At least 5 characters"
  if (f.confirmedPassword !== f.password) e.confirmedPassword = "Passwords don’t match"
  return e
}

// Custom form (password flow / manual-redirect mode) — posts to POST /auth/register
function CustomRegisterPage() {
  const register = useAuthStore((s) => s.register)
  const navigate = useNavigate()
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
    const v = validate(form)
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
      setError(getErrorMessage(err, "Registration failed"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start learning in under a minute."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">Log in</Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <FormError message={error} />
        <div className="grid grid-cols-2 gap-3">
          <FormField id="firstName" label="First name" autoComplete="given-name" value={form.firstName} onChange={onChange} error={errors.firstName} />
          <FormField id="lastName" label="Last name" autoComplete="family-name" value={form.lastName} onChange={onChange} error={errors.lastName} />
        </div>
        <FormField id="username" label="Username" autoComplete="username" value={form.username} onChange={onChange} error={errors.username} />
        <FormField id="email" label="Email" type="email" autoComplete="email" value={form.email} onChange={onChange} error={errors.email} />
        <FormField id="password" label="Password" type="password" autoComplete="new-password" value={form.password} onChange={onChange} error={errors.password} />
        <FormField id="confirmedPassword" label="Confirm password" type="password" autoComplete="new-password" value={form.confirmedPassword} onChange={onChange} error={errors.confirmedPassword} />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="animate-spin" />}
          Create account
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
