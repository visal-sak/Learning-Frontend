import { Link, Navigate, Outlet, useLocation } from "react-router-dom"
import { ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/store"
import { useRoles } from "@/hooks/useRoles"
import { useTranslation } from "react-i18next"

export function ProtectedRoute() {
  const token = useAuthStore((s) => s.accessToken)
  const location = useLocation()
  if (!token) return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}

// Logged in AND has at least one of `roles`
export function RoleRoute({ roles }) {
  const token = useAuthStore((s) => s.accessToken)
  const location = useLocation()
  const { hasAny } = useRoles()
  if (!token) return <Navigate to="/login" replace state={{ from: location }} />
  if (!hasAny(roles)) return <Forbidden />
  return <Outlet />
}

export function GuestRoute() {
  const token = useAuthStore((s) => s.accessToken)
  if (token) return <Navigate to="/" replace />
  return <Outlet />
}

function Forbidden() {
  const { t } = useTranslation()
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive">
        <ShieldAlert className="size-6" />
      </span>
      <h1 className="text-xl font-semibold">{t("site.auth.forbidden.title")}</h1>
      <p className="text-sm text-muted-foreground">{t("site.auth.forbidden.text")}</p>
      <Button asChild variant="outline"><Link to="/">{t("site.auth.forbidden.backHome")}</Link></Button>
    </div>
  )
}
