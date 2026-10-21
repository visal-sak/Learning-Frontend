import { Outlet, useLocation } from "react-router-dom"
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
          <Outlet />
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  )
}
