import CourseDetailsForm from "./CourseDetailsForm"
import { useCourse } from "./useCourse"
import { courseService } from "@/services/course.service"

export default function DetailsTab() {
  const { course, reload } = useCourse()
  return (
    <CourseDetailsForm
      key={course.id}
      course={course}
      onSubmit={async (payload) => {
        await courseService.update(course.id, payload)
        reload()
      }}
    />
  )
}
