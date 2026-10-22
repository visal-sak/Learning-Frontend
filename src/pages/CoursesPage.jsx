import { useEffect, useState } from "react"
import { MdSearchOff } from "react-icons/md"
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
import { useTranslation } from "react-i18next"


export default function CoursesPage() {
  const [params, setParams] = useSearchParams()
  const q = params.get("q") ?? ""
  const categoryId = params.get("categoryId") ?? ""
  const level = params.get("level") ?? ""
  const page = Number(params.get("page") ?? 0)

  const categories = useCatalogStore((s) => s.categories)
  const fetchCategories = useCatalogStore((s) => s.fetchCategories)
  const [search, setSearch] = useState(q)
  const { t } = useTranslation()

  useEffect(() => {
    fetchCategories().catch(() => {})
  }, [fetchCategories])

  // Debounce the search box into the URL
  useEffect(() => {
    if (search === q) return
    const timer = setTimeout(() => update({ q: search }), 350)
    return () => clearTimeout(timer)
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
        <h1 className="text-3xl font-bold tracking-tight">{t("site.catalog.title")}</h1>
        <p className="mt-2 text-muted-foreground">
          {data?.totalElements != null ? t("site.catalog.count", { count: data.totalElements }) : t("site.catalog.explore")}
        </p>
      </div>

      <div className="mb-8 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("site.catalog.search")} className="pl-9" />
        </div>
        <NativeSelect value={categoryId} onChange={(e) => update({ categoryId: e.target.value })} className="sm:w-48" aria-label={t("site.catalog.category")}>
          <option value="">{t("site.catalog.allCategories")}</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </NativeSelect>
        <NativeSelect value={level} onChange={(e) => update({ level: e.target.value })} className="sm:w-40" aria-label={t("site.catalog.level")}>
          <option value="">{t("site.catalog.allLevels")}</option>
          {LEVELS.map((l) => <option key={l.value} value={l.value}>{t(`site.levels.${l.value}`, { defaultValue: l.label })}</option>)}
        </NativeSelect>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : courses.length === 0 ? (
        <EmptyState icon={MdSearchOff} title={t("site.catalog.emptyTitle")}>{t("site.catalog.emptyText")}</EmptyState>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {courses.map((c) => <CourseCard key={c.id} course={c} />)}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => update({ page: page - 1 })}>
            <ChevronLeft /> {t("site.shared.previous")}
          </Button>
          <span className="text-sm text-muted-foreground">{t("site.shared.pageOf", { page: page + 1, total: totalPages })}</span>
          <Button variant="outline" size="sm" disabled={data?.last ?? page + 1 >= totalPages} onClick={() => update({ page: page + 1 })}>
            {t("site.shared.next")} <ChevronRight />
          </Button>
        </div>
      )}
    </div>
  )
}
