import { del, get, post } from "./http"

export const enrollmentService = {
  enroll: (courseId) => post(`/courses/${courseId}/enroll`),
  unenroll: (courseId) => del(`/courses/${courseId}/enroll`),
  // EnrollmentResponse[] { courseId, courseTitle, thumbnailUrl, instructorName, status, percentComplete, nextLessonId, ... }
  mine: () => get("/my/enrollments"),
  forCourse: (courseId) => get(`/my/enrollments/${courseId}`),
  // → ProgressResponse { completedLessons, totalLessons, percentComplete, courseCompleted }
  completeLesson: (lessonId) => post(`/lessons/${lessonId}/complete`),
  uncompleteLesson: (lessonId) => del(`/lessons/${lessonId}/complete`),

  // Instructor / Admin — StudentProgressResponse[]
  students: (courseId) => get(`/courses/${courseId}/students`),
  removeStudent: (courseId, userId) => del(`/courses/${courseId}/students/${userId}`),
}
