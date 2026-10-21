import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import AuthLayout from "@/components/auth/AuthLayout"
import FormField, { FormError } from "@/components/auth/FormField"
import { useAuthStore } from "@/store"
import { getErrorMessage } from "@/lib/api"
import { env, isManualRedirect } from "@/config/env"
import KeycloakRedirect from "@/components/auth/KeycloakRedirect"

const friendly = {
  "Invalid user credentials": "Incorrect username or password.",
  "Client not allowed for direct access grants": "Password login is disabled for this Keycloak client. Enable “Direct access grants” or set VITE_AUTH_FLOW=pkce.",
  "Invalid client or Invalid client credentials": `Keycloak client “${env.keycloak.clientId}” was not found or is not public.`,
}

function PasswordForm({ returnTo }) {
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await login(form)
      navigate(returnTo, { replace: true })
    } catch (err) {
      const msg = getErrorMessage(err, "Login failed")
      setError(friendly[msg] || msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormError message={error} />
      <FormField id="username" label="Username or email" autoComplete="username" value={form.username} onChange={onChange} autoFocus />
      <FormField id="password" label="Password" type="password" autoComplete="current-password" value={form.password} onChange={onChange} />
      <Button type="submit" className="w-full" disabled={loading || !form.username || !form.password}>
        {loading && <Loader2 className="animate-spin" />}
        Log in
      </Button>
    </form>
  )
}

// Accepts the full redirected URL (https://www.keycloak.org/app/?state=…&code=…) or just the code
function parseCode(input) {
  const value = input.trim()
  try {
    const url = new URL(value)
    // Keycloak puts the code in the query by default, or in the #fragment with response_mode=fragment
    const params = new URLSearchParams(url.search)
    new URLSearchParams(url.hash.slice(1)).forEach((v, k) => params.set(k, v))
    return { code: params.get("code"), state: params.get("state"), error: params.get("error_description") || params.get("error") }
  } catch {
    return { code: value, state: null }
  }
}

function ManualPkceLogin({ returnTo }) {
  const startLogin = useAuthStore((s) => s.startLogin)
  const completeLogin = useAuthStore((s) => s.completeLogin)
  const navigate = useNavigate()
  const [opened, setOpened] = useState(false)
  const [pasted, setPasted] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const open = async () => {
    setError("")
    setPasted("")
    await startLogin({ returnTo })
    setOpened(true)
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError("")
    const { code, state, error: kcError } = parseCode(pasted)
    if (kcError) return setError(kcError)
    if (!code) return setError("No code found. Paste the full URL from the address bar.")
    setLoading(true)
    try {
      navigate(await completeLogin({ code, state }), { replace: true })
    } catch (err) {
      const msg = getErrorMessage(err, "Login failed")
      setError(msg === "Code not valid" ? "That code was already used or expired. Open the sign-in page again." : msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <ol className="space-y-1.5 text-sm text-muted-foreground">
        <li><span className="font-medium text-foreground">1.</span> Open the sign-in page and log in.</li>
        <li><span className="font-medium text-foreground">2.</span> You’ll land on keycloak.org. Copy the whole URL from the address bar.</li>
        <li><span className="font-medium text-foreground">3.</span> Paste it below. The code expires in about a minute.</li>
      </ol>
      <Button className="w-full" variant={opened ? "outline" : "default"} onClick={open}>
        {opened ? "Open sign-in page again" : "Open sign-in page"}
      </Button>
      {opened && (
        <form onSubmit={onSubmit} className="space-y-3">
          <FormError message={error} />
          <FormField
            id="redirectUrl"
            label="Redirected URL or code"
            placeholder="https://www.keycloak.org/app/?state=…&code=…"
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            autoFocus
          />
          <Button type="submit" className="w-full" disabled={loading || !pasted.trim()}>
            {loading && <Loader2 className="animate-spin" />}
            Get token & log in
          </Button>
        </form>
      )}
    </div>
  )
}

function PkceLogin({ returnTo }) {
  const startLogin = useAuthStore((s) => s.startLogin)
  const [loading, setLoading] = useState(false)

  if (isManualRedirect) return <ManualPkceLogin returnTo={returnTo} />

  const onClick = () => {
    setLoading(true)
    startLogin({ returnTo }).catch(() => setLoading(false))
  }

  return (
    <div className="space-y-3">
      <Button className="w-full" size="lg" onClick={onClick} disabled={loading}>
        {loading && <Loader2 className="animate-spin" />}
        Continue to sign in
      </Button>
      <p className="text-center text-xs text-muted-foreground">You’ll be redirected to our secure sign-in page.</p>
    </div>
  )
}

export default function LoginPage() {
  const location = useLocation()
  const returnTo = location.state?.from?.pathname || "/"

  // Standard PKCE flow: skip our page and go straight to the Keycloak login form
  if (env.authFlow === "pkce" && !isManualRedirect) return <KeycloakRedirect returnTo={returnTo} />

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to continue learning."
      footer={
        <>
          Don’t have an account?{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">Sign up</Link>
        </>
      }
    >
      {env.authFlow === "pkce" ? <PkceLogin returnTo={returnTo} /> : <PasswordForm returnTo={returnTo} />}
    </AuthLayout>
  )
}
