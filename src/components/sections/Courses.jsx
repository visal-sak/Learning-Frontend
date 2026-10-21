import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import CourseCard from "./CourseCard"
import { EmptyState, ErrorState, LoadingState } from "@/components/course/CourseBits"
import { useCatalogStore } from "@/store"
import { useFetch } from "@/hooks/useFetch"
import { courseService, toList } from "@/services/course.service"
import { cn } from "@/lib/utils"

export default function Courses() {
  const categories = useCatalogStore((s) => s.categories)
  const fetchCategories = useCatalogStore((s) => s.fetchCategories)
  const [categoryId, setCategoryId] = useState("")
  const { data, loading, error, reload } = useFetch(() => courseService.list({ size: 8, categoryId }), [categoryId])
  const courses = toList(data)

  useEffect(() => {
    fetchCategories().catch(() => {})
  }, [fetchCategories])

  const tabs = [{ id: "", name: "All" }, ...categories.filter((c) => c.courseCount > 0)]

  return (
    <section id="courses" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Latest courses</h2>
          <p className="mt-2 text-muted-foreground">Freshly published by our instructors.</p>
        </div>
        {tabs.length > 1 && (
          <div className="flex max-w-full gap-1 overflow-x-auto rounded-lg bg-muted p-[3px]">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setCategoryId(t.id)}
                className={cn(
                  "shrink-0 rounded-md px-3 py-1 text-sm font-medium text-muted-foreground transition-colors",
                  categoryId === t.id && "bg-background text-foreground shadow-sm"
                )}
              >
                {t.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : courses.length === 0 ? (
        <EmptyState title="No courses yet">New courses will show up here once they’re published.</EmptyState>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {courses.map((c) => <CourseCard key={c.id} course={c} />)}
        </div>
      )}

      <div className="mt-10 text-center">
        <Button variant="outline" size="lg" asChild>
          <Link to={categoryId ? `/courses?categoryId=${categoryId}` : "/courses"}>View all courses <ArrowRight /></Link>
        </Button>
      </div>
    </section>
  )
}
