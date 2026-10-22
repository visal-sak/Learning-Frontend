import { Suspense } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { LoadingState } from "@/components/course/CourseBits"
import ErrorBoundary from "@/components/ErrorBoundary"
import Navbar from "@/components/sections/Navbar"
import Footer from "@/components/sections/Footer"

export default function MainLayout() {
  const location = useLocation()
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <ErrorBoundary resetKey={location.pathname}>
          {/* Navbar and footer stay while a page's code loads */}
          <Suspense fallback={<LoadingState />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  )
}
