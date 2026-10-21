import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { Button } from "@/components/ui/button"
import CourseCard from "@/components/sections/CourseCard"
import { EmptyState, ErrorState, LoadingState } from "@/components/course/CourseBits"
import { useCatalogStore } from "@/store"
import { useFetch } from "@/hooks/useFetch"
import { courseService, toList } from "@/services/course.service"
import { LEVELS } from "@/lib/constants"


export default function CoursesPage() {
  const [params, setParams] = useSearchParams()
  const q = params.get("q") ?? ""
  const categoryId = params.get("categoryId") ?? ""
  const level = params.get("level") ?? ""
  const page = Number(params.get("page") ?? 0)

  const categories = useCatalogStore((s) => s.categories)
  const fetchCategories = useCatalogStore((s) => s.fetchCategories)
  const [search, setSearch] = useState(q)

  useEffect(() => {
    fetchCategories().catch(() => {})
  }, [fetchCategories])

  // Debounce the search box into the URL
  useEffect(() => {
    if (search === q) return
    const t = setTimeout(() => update({ q: search }), 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const { data, loading, error, reload } = useFetch(
    () => courseService.list({ q, categoryId, level, page, size: 12 }),
    [q, categoryId, level, page]
  )
  const courses = toList(data)
  const totalPages = data?.totalPages ?? 1

  function update(next) {
    const merged = { q, categoryId, level, page: 0, ...next }
    setParams(Object.fromEntries(Object.entries(merged).filter(([, v]) => v !== "" && v !== 0)), { replace: true })
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">All courses</h1>
        <p className="mt-2 text-muted-foreground">
          {data?.totalElements != null ? `${data.totalElements} course${data.totalElements === 1 ? "" : "s"} available` : "Explore the catalogue"}
        </p>
      </div>

      <div className="mb-8 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search courses…" className="pl-9" />
        </div>
        <NativeSelect value={categoryId} onChange={(e) => update({ categoryId: e.target.value })} className="sm:w-48" aria-label="Category">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </NativeSelect>
        <NativeSelect value={level} onChange={(e) => update({ level: e.target.value })} className="sm:w-40" aria-label="Level">
          <option value="">All levels</option>
          {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
        </NativeSelect>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : courses.length === 0 ? (
        <EmptyState title="No courses match your filters">Try a different search or category.</EmptyState>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {courses.map((c) => <CourseCard key={c.id} course={c} />)}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => update({ page: page - 1 })}>
            <ChevronLeft /> Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={data?.last ?? page + 1 >= totalPages} onClick={() => update({ page: page + 1 })}>
            Next <ChevronRight />
          </Button>
        </div>
      )}
    </div>
  )
}
