import { useEffect, useRef, useState } from "react"
import { GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/store"
import { getErrorMessage } from "@/lib/api"
import { useTranslation } from "react-i18next"

// Sends the browser straight to the Keycloak login (or registration) form.
// action: undefined → login, "register" → Keycloak sign-up page
export default function KeycloakRedirect({ action, returnTo = "/" }) {
  const startLogin = useAuthStore((s) => s.startLogin)
  const started = useRef(false) // StrictMode mounts twice — redirect once
  const [error, setError] = useState("")
  const { t } = useTranslation()

  const go = () => startLogin({ returnTo, action }).catch((err) => setError(getErrorMessage(err, t("site.auth.errors.unreachable"))))

  useEffect(() => {
    if (started.current) return
    started.current = true
    go()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // No loading screen: the browser is already on its way to Keycloak. Only a failure shows anything.
  if (!error) return null
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground">
          <GraduationCap className="size-6" />
        </span>
        <p className="text-sm text-destructive">{error}</p>
        <Button onClick={() => { setError(""); go() }}>{t("common.actions.retry")}</Button>
      </div>
    </div>
  )
}
