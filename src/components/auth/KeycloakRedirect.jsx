import { useEffect, useRef, useState } from "react"
import { GraduationCap, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/store"
import { getErrorMessage } from "@/lib/api"

// Sends the browser straight to the Keycloak login (or registration) form.
// action: undefined → login, "register" → Keycloak sign-up page
export default function KeycloakRedirect({ action, returnTo = "/" }) {
  const startLogin = useAuthStore((s) => s.startLogin)
  const started = useRef(false) // StrictMode mounts twice — redirect once
  const [error, setError] = useState("")

  const go = () => startLogin({ returnTo, action }).catch((err) => setError(getErrorMessage(err, "Couldn’t reach the sign-in service")))

  useEffect(() => {
    if (started.current) return
    started.current = true
    go()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground">
          <GraduationCap className="size-6" />
        </span>
        {error ? (
          <>
            <p className="text-sm text-destructive">{error}</p>
            <Button onClick={() => { setError(""); go() }}>Try again</Button>
          </>
        ) : (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Redirecting to secure {action === "register" ? "sign-up" : "sign-in"}…
          </p>
        )}
      </div>
    </div>
  )
}
