import { useEffect } from "react"
import { Link } from "react-router-dom"
import { ChevronRight, Folder } from "lucide-react"
import { LoadingState } from "@/components/course/CourseBits"
import { useCatalogStore } from "@/store"

const colors = ["text-sky-400", "text-yellow-300", "text-pink-400", "text-orange-400", "text-green-400", "text-blue-400"]

export default function Categories() {
  const categories = useCatalogStore((s) => s.categories)
  const status = useCatalogStore((s) => s.categoriesStatus)
  const fetchCategories = useCatalogStore((s) => s.fetchCategories)

  useEffect(() => {
    fetchCategories().catch(() => {})
  }, [fetchCategories])

  // Nothing worth showing (e.g. API down) — hide the section instead of an empty block
  if (status === "error" || (status === "success" && categories.length === 0)) return null

  return (
    <section id="categories" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Browse by category</h2>
        <p className="mt-2 text-muted-foreground">Find the right path for where you want to go.</p>
      </div>
      {status !== "success" ? (
        <LoadingState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c, i) => (
            <Link
              key={c.id}
              to={`/courses?categoryId=${c.id}`}
              className="group flex items-center gap-4 rounded-xl border glass p-5 transition-colors hover:border-primary/50 hover:bg-accent/40"
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-secondary">
                <Folder className={`size-6 ${colors[i % colors.length]}`} />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-medium">{c.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {c.courseCount ?? 0} {c.courseCount === 1 ? "course" : "courses"}
                </p>
              </div>
              <ChevronRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
