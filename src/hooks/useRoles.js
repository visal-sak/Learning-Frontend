import { useShallow } from "zustand/react/shallow"
import { useAuthStore } from "@/store"
import { ROLES, STAFF_ROLES } from "@/lib/constants"

export function useRoles() {
  const roles = useAuthStore(useShallow((s) => s.claims?.realm_access?.roles ?? []))
  const hasAny = (list) => list.some((r) => roles.includes(r))
  return {
    roles,
    hasAny,
    isAdmin: roles.includes(ROLES.ADMIN),
    isInstructor: roles.includes(ROLES.INSTRUCTOR),
    isStudent: roles.includes(ROLES.STUDENT),
    isStaff: hasAny(STAFF_ROLES),
  }
}
