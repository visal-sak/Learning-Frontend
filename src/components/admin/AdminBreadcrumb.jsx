import { Fragment } from "react"
import { Link, useLocation } from "react-router-dom"
import { ChevronRight } from "lucide-react"

const LABELS = {
  courses: "My courses",
  new: "New course",
  reviews: "Student reviews",
  media: "Media library",
  "review-queue": "Review queue",
  categories: "Categories",
  curriculum: "Curriculum",
  quiz: "Quiz",
  students: "Students",
}

// /admin/courses/:id/students → Dashboard › My courses › Edit course › Students
function crumbsFor(pathname) {
  const parts = pathname.replace(/^\/admin\/?/, "").split("/").filter(Boolean)
  const crumbs = [{ label: "Dashboard", to: "/admin" }]
  let path = "/admin"
  parts.forEach((part, i) => {
    path += `/${part}`
    // a course id (anything that isn't a known segment) right after "courses"
    const isCourseId = parts[i - 1] === "courses" && !LABELS[part]
    crumbs.push({ label: isCourseId ? "Edit course" : LABELS[part] ?? part, to: path })
  })
  if (crumbs.length === 1) crumbs.push({ label: "Overview", to: "/admin" })
  return crumbs
}

export default function AdminBreadcrumb() {
  const { pathname } = useLocation()
  const crumbs = crumbsFor(pathname)

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
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
