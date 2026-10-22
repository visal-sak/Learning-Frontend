import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useAuthStore } from "@/store"
import { env, isManualRedirect } from "@/config/env"
import { confirm } from "@/store/confirm.store"
import { enrollmentService } from "@/services/course.service"
import { toast } from "@/lib/toast"

/**
 * Gate for anything that needs enrolling (locked lessons, the final quiz):
 * - not logged in → go to login, then come back to `path`
 * - logged in, not enrolled → ask to enroll (skip the question with `ask: false`), enroll, then open `path`
 */
export function useEnrollGate(course) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const isAuthed = useAuthStore((s) => !!s.accessToken)
  const startLogin = useAuthStore((s) => s.startLogin)

  return async (path, { what = t("learn.enrollGate.thisLesson"), ask = true, onEnrolled } = {}) => {
    if (!isAuthed) {
      // PKCE: go straight to the Keycloak form (no in-between page); other flows use the login page
      if (env.authFlow === "pkce" && !isManualRedirect) startLogin({ returnTo: path })
      else navigate("/login", { state: { from: { pathname: path } } })
      return
    }
    if (ask) {
      const ok = await confirm({
        title: t("learn.enrollGate.title", { what }),
        description: t("learn.enrollGate.description", { title: course.title }),
        confirmLabel: t("learn.enrollGate.confirm"),
      })
      if (!ok) return
    }
    try {
      await enrollmentService.enroll(course.id)
      toast.success(t("learn.enrollGate.enrolled"), t("learn.enrollGate.enrolledText"))
      onEnrolled?.()
      navigate(path)
    } catch (err) {
      toast.error(t("learn.enrollGate.failed"), err)
    }
  }
}
