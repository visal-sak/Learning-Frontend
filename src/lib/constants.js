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
  DRAFT: { label: "Draft", className: "bg-secondary text-secondary-foreground" },
  PENDING_REVIEW: { label: "Pending review", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  PUBLISHED: { label: "Published", className: "bg-primary/15 text-primary" },
  REJECTED: { label: "Rejected", className: "bg-destructive/15 text-destructive" },
  ARCHIVED: { label: "Archived", className: "bg-muted text-muted-foreground" },
}

export const levelLabel = (v) => LEVELS.find((l) => l.value === v)?.label ?? v
