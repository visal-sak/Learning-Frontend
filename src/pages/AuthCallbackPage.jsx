import { useEffect, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import AuthLayout from "@/components/auth/AuthLayout"
import { FormError } from "@/components/auth/FormField"
import { useAuthStore } from "@/store"
import { getErrorMessage } from "@/lib/api"

export default function AuthCallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const completeLogin = useAuthStore((s) => s.completeLogin)
  const code = params.get("code")
  const urlError = params.get("error_description") || params.get("error") || (!code && "Missing authorization code.")
  const [exchangeError, setExchangeError] = useState("")
  const error = urlError || exchangeError

  useEffect(() => {
    if (urlError) return
    completeLogin({ code, state: params.get("state") })
      .then((returnTo) => navigate(returnTo, { replace: true }))
      .catch((err) => setExchangeError(getErrorMessage(err, "Login failed")))
  }, [code, urlError, params, completeLogin, navigate])

  if (!error) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Signing you in…
        </div>
      </div>
    )
  }

  return (
    <AuthLayout title="Couldn’t sign you in">
      <FormError message={error} />
      <Button asChild className="w-full">
        <Link to="/login">Back to login</Link>
      </Button>
    </AuthLayout>
  )
}
