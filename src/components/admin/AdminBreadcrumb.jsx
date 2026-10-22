import { Fragment } from "react"
import { Link, useLocation } from "react-router-dom"
import { ChevronRight } from "lucide-react"
import { useTranslation } from "react-i18next"

// Known path segments → translation keys (resolved at render time)
const LABELS = {
  courses: "admin.nav.myCourses",
  new: "admin.breadcrumb.newCourse",
  reviews: "admin.nav.studentReviews",
  media: "admin.nav.mediaLibrary",
  "review-queue": "admin.nav.reviewQueue",
  categories: "admin.nav.categories",
  curriculum: "admin.breadcrumb.curriculum",
  quiz: "admin.breadcrumb.quiz",
  students: "admin.breadcrumb.students",
  assessments: "admin.nav.assessments",
  certificates: "admin.nav.certificates",
  moderation: "admin.nav.moderation",
}

// /admin/courses/:id/students → Dashboard › My courses › Edit course › Students
function crumbsFor(pathname, t) {
  const parts = pathname.replace(/^\/admin\/?/, "").split("/").filter(Boolean)
  const crumbs = [{ label: t("common.nav.dashboard"), to: "/admin" }]
  let path = "/admin"
  parts.forEach((part, i) => {
    path += `/${part}`
    // a course id (anything that isn't a known segment) right after "courses"
    const isCourseId = parts[i - 1] === "courses" && !LABELS[part]
    const isResults = parts[i - 1] === "assessments"
    crumbs.push({ label: isCourseId ? t("admin.breadcrumb.editCourse") : isResults ? t("admin.breadcrumb.results") : LABELS[part] ? t(LABELS[part]) : part, to: path })
  })
  if (crumbs.length === 1) crumbs.push({ label: t("admin.nav.overview"), to: "/admin" })
  return crumbs
}

export default function AdminBreadcrumb() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const crumbs = crumbsFor(pathname, t)

  return (
    <nav aria-label={t("admin.breadcrumb.ariaLabel")} className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1 text-[13px]">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1
          return (
            <Fragment key={`${c.to}-${i}`}>
              {i > 0 && <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/60" aria-hidden />}
              <li className={i < crumbs.length - 2 ? "hidden min-w-0 sm:block" : "min-w-0"}>
                {last ? (
                  <span aria-current="page" className="block truncate font-medium text-foreground">{c.label}</span>
                ) : (
                  <Link to={c.to} className="block truncate text-muted-foreground transition-colors hover:text-foreground">{c.label}</Link>
                )}
              </li>
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
}
