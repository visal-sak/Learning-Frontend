import { Suspense, lazy, useEffect } from "react"
import { Navigate, Route, Routes } from "react-router-dom"
import MainLayout from "@/components/layout/MainLayout"
import { GuestRoute, ProtectedRoute, RoleRoute } from "@/components/auth/RouteGuards"
import HomePage from "@/pages/HomePage"
import LoginPage from "@/pages/LoginPage"
import RegisterPage from "@/pages/RegisterPage"
import ProfilePage from "@/pages/ProfilePage"
import AuthCallbackPage from "@/pages/AuthCallbackPage"
import CoursesPage from "@/pages/CoursesPage"
import CourseDetailPage from "@/pages/CourseDetailPage"
import MyLearningPage from "@/pages/MyLearningPage"
import { LoadingState } from "@/components/course/CourseBits"
import { useAuthStore } from "@/store"
import { ROLES, STAFF_ROLES } from "@/lib/constants"
import { useThemeStore } from "@/store/theme.store" // also applies the persisted theme class on load
import { GooeyToaster } from "goey-toast"
import "goey-toast/styles.css"
import ConfirmHost from "@/components/ConfirmDialog"

const AdminLayout = lazy(() => import("@/components/admin/AdminLayout"))
const LearnPage = lazy(() => import("@/pages/LearnPage"))
const QuizPage = lazy(() => import("@/pages/QuizPage"))
const OverviewPage = lazy(() => import("@/pages/admin/OverviewPage"))
const AdminCoursesPage = lazy(() => import("@/pages/admin/CoursesPage"))
const NewCoursePage = lazy(() => import("@/pages/admin/course/NewCoursePage"))
const CourseEditorLayout = lazy(() => import("@/pages/admin/course/CourseEditorLayout"))
const DetailsTab = lazy(() => import("@/pages/admin/course/DetailsTab"))
const CurriculumTab = lazy(() => import("@/pages/admin/course/CurriculumTab"))
const QuizTab = lazy(() => import("@/pages/admin/course/QuizTab"))
const StudentsTab = lazy(() => import("@/pages/admin/course/StudentsTab"))
const ReviewsTab = lazy(() => import("@/pages/admin/course/ReviewsTab"))
const ReviewQueuePage = lazy(() => import("@/pages/admin/ReviewQueuePage"))
const CategoriesPage = lazy(() => import("@/pages/admin/CategoriesPage"))
const InstructorReviewsPage = lazy(() => import("@/pages/admin/InstructorReviewsPage"))
const MediaPage = lazy(() => import("@/pages/admin/MediaPage"))

export default function App() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const fetchMe = useAuthStore((s) => s.fetchMe)
  const dark = useThemeStore((s) => s.dark)

  // Refresh /users/me once on app start when a session was restored from storage
  useEffect(() => {
    if (accessToken) fetchMe().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
    <Suspense fallback={<LoadingState className="py-40" />}>
    <Routes>
      {/* Public site */}
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="courses/:id" element={<CourseDetailPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="profile" element={<ProfilePage />} />
          <Route path="my-learning" element={<MyLearningPage />} />
          <Route path="courses/:id/quiz" element={<QuizPage />} />
        </Route>
      </Route>

      {/* Full-screen lesson player — public so Preview lessons can be watched before signing up;
          the page itself sends visitors to login when the lesson API requires it */}
      <Route path="courses/:id/learn" element={<LearnPage />} />
      <Route path="courses/:id/learn/:lessonId" element={<LearnPage />} />

      {/* Admin dashboard — ADMIN and INSTRUCTOR only */}
      <Route path="admin" element={<RoleRoute roles={STAFF_ROLES} />}>
        <Route element={<AdminLayout />}>
          <Route index element={<OverviewPage />} />
          <Route path="courses" element={<AdminCoursesPage />} />
          <Route path="courses/new" element={<NewCoursePage />} />
          <Route path="courses/:id" element={<CourseEditorLayout />}>
            <Route index element={<DetailsTab />} />
            <Route path="curriculum" element={<CurriculumTab />} />
            <Route path="quiz" element={<QuizTab />} />
            <Route path="students" element={<StudentsTab />} />
            <Route path="reviews" element={<ReviewsTab />} />
          </Route>
          <Route path="reviews" element={<InstructorReviewsPage />} />
          <Route path="media" element={<MediaPage />} />

          {/* ADMIN only */}
          <Route element={<RoleRoute roles={[ROLES.ADMIN]} />}>
            <Route path="review-queue" element={<ReviewQueuePage />} />
            <Route path="categories" element={<CategoriesPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="dashboard/*" element={<Navigate to="/admin" replace />} />

      <Route element={<GuestRoute />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
      </Route>

      <Route path="auth/callback" element={<AuthCallbackPage />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>

    {/* App-wide confirmation modal (confirm()) and gooey toasts */}
    <ConfirmHost />
    <GooeyToaster position="bottom-right" theme={dark ? "dark" : "light"} preset="smooth" closeButton="top-right" />
    </>
  )
}
