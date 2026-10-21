import { useEffect, useState } from "react"
import { Loader2, Plus, X, Check } from "lucide-react"
import { BiSolidEditAlt, BiSolidTrash } from "react-icons/bi"
import { IoBook } from "react-icons/io5"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/admin/AdminUI"
import { DataTable } from "@/components/admin/DataTable"
import { Label } from "@/components/ui/label"
import { categoryTag } from "@/lib/tags"
import { cn } from "@/lib/utils"
import { EmptyState, ErrorState, LoadingState } from "@/components/course/CourseBits"
import { FormError } from "@/components/auth/FormField"
import { useCatalogStore } from "@/store"
import { getErrorMessage } from "@/lib/api"
import { formatDate } from "@/lib/format"
import { confirm } from "@/store/confirm.store"
import { toast } from "@/lib/toast"

export default function CategoriesPage() {
  const categories = useCatalogStore((s) => s.categories)
  const status = useCatalogStore((s) => s.categoriesStatus)
  const loadError = useCatalogStore((s) => s.categoriesError)
  const fetchCategories = useCatalogStore((s) => s.fetchCategories)
  const createCategory = useCatalogStore((s) => s.createCategory)
  const updateCategory = useCatalogStore((s) => s.updateCategory)
  const deleteCategory = useCatalogStore((s) => s.deleteCategory)

  const [form, setForm] = useState({ name: "", description: "" })
  const [editing, setEditing] = useState(null)
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchCategories({ force: true }).catch(() => {})
  }, [fetchCategories])

  const run = async (key, fn, successMsg) => {
    setError("")
    setBusy(key)
    try {
      await fn()
      if (successMsg) toast.success(successMsg)
      return true
    } catch (err) {
      setError(getErrorMessage(err, "Action failed"))
      toast.error("Action failed", err)
      return false
    } finally {
      setBusy(null)
    }
  }

  const onCreate = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    if (await run("create", () => createCategory({ name: form.name.trim(), description: form.description.trim() }), "Category created")) setForm({ name: "", description: "" })
  }

  const onSave = async () => {
    const { id, name, description } = editing
    if (await run(id, () => updateCategory(id, { name: name.trim(), description: description.trim() }), "Category updated")) setEditing(null)
  }

  const onDelete = async (c) => {
    const ok = await confirm({
      title: `Delete “${c.name}”?`,
      description: "This can’t be undone.",
      body: c.courseCount > 0 ? `This category still has ${c.courseCount} course(s). They’ll no longer be listed under it.` : undefined,
      confirmLabel: "Delete category",
    })
    if (ok) run(c.id, () => deleteCategory(c.id), "Category deleted")
  }

  return (
    <>
      <PageHeader title="Categories" description="Organise the catalogue. Instructors pick from these when creating courses." />

      {/* Add form */}
      <form
        onSubmit={onCreate}
        className="mb-6 rounded-xl border border-neutral-200/80 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <p className="text-[15px] font-bold">Add a category</p>
        <p className="mb-4 text-xs text-muted-foreground">The URL slug is created from the name.</p>
        <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="catName">Name</Label>
            <Input id="catName" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Python Programming" maxLength={80} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="catDesc">Description <span className="font-normal text-muted-foreground">(optional)</span></Label>
            <Input id="catDesc" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="What kind of courses go here" maxLength={300} />
          </div>
          <Button type="submit" size="lg" disabled={busy === "create" || !form.name.trim()}>
            {busy === "create" ? <Loader2 className="animate-spin" /> : <Plus />} Add category
          </Button>
        </div>
      </form>

      <FormError message={error} />

      {status === "loading" && !categories.length ? (
        <LoadingState />
      ) : status === "error" ? (
        <ErrorState error={loadError} onRetry={() => fetchCategories({ force: true })} />
      ) : categories.length === 0 ? (
        <EmptyState title="No categories yet">Add one above.</EmptyState>
      ) : (
        <DataTable
          rows={categories}
          columns={[
            {
              key: "name",
              label: "Category",
              render: (c) =>
                editing?.id === c.id ? (
                  <Input value={editing.name} onChange={(e) => setEditing((x) => ({ ...x, name: e.target.value }))} maxLength={80} autoFocus aria-label="Name" />
                ) : (
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg text-sm font-bold", categoryTag(c.name))}>
                      {c.name.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 leading-tight">
                      <p className="truncate font-semibold">{c.name}</p>
                      <p className="truncate font-mono text-xs text-muted-foreground">/{c.slug}</p>
                    </div>
                  </div>
                ),
            },
            {
              key: "description",
              label: "Description",
              className: "w-[34%]",
              render: (c) =>
                editing?.id === c.id ? (
                  <Input value={editing.description} onChange={(e) => setEditing((x) => ({ ...x, description: e.target.value }))} maxLength={300} aria-label="Description" />
                ) : c.description ? (
                  <span className="line-clamp-2 text-foreground/80">{c.description}</span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                ),
            },
            {
              key: "courses",
              label: "Courses",
              nowrap: true,
              render: (c) => (
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums",
                    c.courseCount
                      ? "bg-emerald-500/12 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                      : "bg-neutral-100 text-muted-foreground dark:bg-neutral-800"
                  )}
                >
                  <IoBook className="size-3.5" /> {c.courseCount ?? 0}
                </span>
              ),
            },
            { key: "created", label: "Created", nowrap: true, render: (c) => <span className="text-muted-foreground">{formatDate(c.createdAt)}</span> },
            {
              key: "actions",
              label: "Actions",
              align: "right",
              render: (c) =>
                editing?.id === c.id ? (
                  <div className="flex items-center justify-end gap-1.5">
                    <Button size="sm" onClick={onSave} disabled={busy === c.id || !editing.name.trim()}>
                      {busy === c.id ? <Loader2 className="animate-spin" /> : <Check />} Save
                    </Button>
                    <Button size="icon" variant="bordered" className="size-8" onClick={() => setEditing(null)} aria-label="Cancel"><X /></Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      size="icon"
                      variant="bordered"
                      className="size-8"
                      onClick={() => setEditing({ id: c.id, name: c.name, description: c.description ?? "" })}
                      aria-label="Edit"
                      title="Edit"
                    >
                      <BiSolidEditAlt className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="bordered"
                      className="size-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-500/10"
                      disabled={busy === c.id}
                      onClick={() => onDelete(c)}
                      aria-label="Delete"
                      title="Delete"
                    >
                      {busy === c.id ? <Loader2 className="animate-spin" /> : <BiSolidTrash className="size-4" />}
                    </Button>
                  </div>
                ),
            },
          ]}
        />
      )}
    </>
  )
}
