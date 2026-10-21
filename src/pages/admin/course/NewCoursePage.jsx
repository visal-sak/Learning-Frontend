import { Link, useNavigate } from "react-router-dom"
import { WiDirectionLeft } from "react-icons/wi"
import { PageHeader } from "@/components/admin/AdminUI"
import CourseDetailsForm from "./CourseDetailsForm"
import { courseService } from "@/services/course.service"

export default function NewCoursePage() {
  const navigate = useNavigate()

  const create = async (payload) => {
    const course = await courseService.create(payload)
    // Next step: build the curriculum
    navigate(course?.id ? `/admin/courses/${course.id}/curriculum` : "/admin/courses", { replace: true })
  }

  return (
    <>
      <Link to="/admin/courses" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <WiDirectionLeft className="size-5" /> My courses
      </Link>
      <PageHeader title="New course" description="Start with the basics. You can add sections, lessons and a quiz next." />
      <CourseDetailsForm onSubmit={create} submitLabel="Create course" />
    </>
  )
}
