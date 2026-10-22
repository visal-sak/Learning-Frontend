import { Link, useNavigate } from "react-router-dom"
import { WiDirectionLeft } from "react-icons/wi"
import { useTranslation } from "react-i18next"
import { PageHeader } from "@/components/admin/AdminUI"
import CourseDetailsForm from "./CourseDetailsForm"
import { courseService } from "@/services/course.service"

export default function NewCoursePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const create = async (payload) => {
    let course = await courseService.create(payload)
    // Older backends ignore the thumbnail on create — save it with an update right away so the image sticks
    if (course?.id && payload.thumbnailUrl && !course.thumbnailUrl) {
      course = await courseService.update(course.id, payload)
    }
    // Next step: build the curriculum
    navigate(course?.id ? `/admin/courses/${course.id}/curriculum` : "/admin/courses", { replace: true })
  }

  return (
    <>
      <Link to="/admin/courses" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <WiDirectionLeft className="size-5" /> {t("admin.nav.myCourses")}
      </Link>
      <PageHeader title={t("admin.newCourse.title")} description={t("admin.newCourse.description")} />
      <CourseDetailsForm onSubmit={create} submitLabel={t("admin.newCourse.create")} />
    </>
  )
}
