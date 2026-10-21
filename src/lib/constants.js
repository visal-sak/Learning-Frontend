// Keycloak realm roles (realm "elearning"). New users get STUDENT + USER by default.
export const ROLES = {
  ADMIN: "ADMIN",
  INSTRUCTOR: "INSTRUCTOR",
  STUDENT: "STUDENT",
  USER: "USER",
}

// Who can open the course-management dashboard
export const STAFF_ROLES = [ROLES.ADMIN, ROLES.INSTRUCTOR]

export const LEVELS = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
]

// Course lifecycle — adjust to match the backend enum if it differs
export const COURSE_STATUS = {
  DRAFT: { label: "Draft", className: "bg-neutral-500/12 text-neutral-700 dark:bg-neutral-500/20 dark:text-neutral-300", dot: "bg-neutral-400" },
  PENDING_REVIEW: { label: "Pending review", className: "bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300", dot: "bg-amber-500" },
  PUBLISHED: { label: "Published", className: "bg-emerald-500/12 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300", dot: "bg-emerald-500" },
  REJECTED: { label: "Rejected", className: "bg-rose-500/12 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300", dot: "bg-rose-500" },
  ARCHIVED: { label: "Archived", className: "bg-neutral-500/12 text-neutral-600 dark:bg-neutral-500/20 dark:text-neutral-400", dot: "bg-neutral-400" },
}

export const levelLabel = (v) => LEVELS.find((l) => l.value === v)?.label ?? v
