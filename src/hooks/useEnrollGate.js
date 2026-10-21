import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store"
import { confirm } from "@/store/confirm.store"
import { enrollmentService } from "@/services/course.service"
import { toast } from "@/lib/toast"

/**
 * Gate for anything that needs enrolling (locked lessons, the final quiz):
 * - not logged in → go to login, then come back to `path`
 * - logged in, not enrolled → ask to enroll (skip the question with `ask: false`), enroll, then open `path`
 */
export function useEnrollGate(course) {
  const navigate = useNavigate()
  const isAuthed = useAuthStore((s) => !!s.accessToken)

  return async (path, { what = "this lesson", ask = true, onEnrolled } = {}) => {
    if (!isAuthed) {
      navigate("/login", { state: { from: { pathname: path } } })
      return
    }
    if (ask) {
      const ok = await confirm({
        title: `Enroll to unlock ${what}`,
        description: `“${course.title}” is free. Enroll to watch every lesson and take the final quiz.`,
        confirmLabel: "Enroll for free",
      })
      if (!ok) return
    }
    try {
      await enrollmentService.enroll(course.id)
      toast.success("You’re enrolled!", "Lessons unlock one by one as you complete them.")
      onEnrolled?.()
      navigate(path)
    } catch (err) {
      toast.error("Couldn’t enroll", err)
    }
  }
}
