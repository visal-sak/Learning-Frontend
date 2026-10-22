import { useEffect, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import Loader from "@/components/ui/loader"
import { Button } from "@/components/ui/button"
import AuthLayout from "@/components/auth/AuthLayout"
import { FormError } from "@/components/auth/FormField"
import { useAuthStore } from "@/store"
import { getErrorMessage } from "@/lib/api"
import { useTranslation } from "react-i18next"

export default function AuthCallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const completeLogin = useAuthStore((s) => s.completeLogin)
  const code = params.get("code")
  const urlError = params.get("error_description") || params.get("error") || (!code && t("site.auth.errors.missingCode"))
  const [exchangeError, setExchangeError] = useState("")
  const error = urlError || exchangeError

  useEffect(() => {
    if (urlError) return
    completeLogin({ code, state: params.get("state") })
      .then((returnTo) => navigate(returnTo, { replace: true }))
      .catch((err) => setExchangeError(getErrorMessage(err, t("site.auth.loginFailed"))))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, urlError, params, completeLogin, navigate])

  if (!error) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader size="xs" title={t("site.auth.callback.signingIn")} subtitle={t("site.auth.callback.settingUp")} />
      </div>
    )
  }

  return (
    <AuthLayout title={t("site.auth.callback.failed")}>
      <FormError message={error} />
      <Button asChild className="w-full">
        <Link to="/login">{t("site.auth.callback.backToLogin")}</Link>
      </Button>
    </AuthLayout>
  )
}
