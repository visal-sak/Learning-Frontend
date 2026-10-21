import { useEffect, useState } from "react"
import { Pencil, Trash2, Loader2, Plus, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/admin/AdminUI"
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

      <form onSubmit={onCreate} className="mb-6 flex flex-col gap-2 rounded-xl border glass p-4 sm:flex-row">
        <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Name, e.g. Python Programming" maxLength={80} />
        <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Description (optional)" maxLength={300} />
        <Button type="submit" disabled={busy === "create" || !form.name.trim()}>
          {busy === "create" ? <Loader2 className="animate-spin" /> : <Plus />} Add
        </Button>
      </form>

      <FormError message={error} />

      {status === "loading" && !categories.length ? (
        <LoadingState />
      ) : status === "error" ? (
        <ErrorState error={loadError} onRetry={() => fetchCategories({ force: true })} />
      ) : categories.length === 0 ? (
        <EmptyState title="No categories yet">Add one above.</EmptyState>
      ) : (
        <div className="mt-4 divide-y rounded-xl border glass">
          {categories.map((c) =>
            editing?.id === c.id ? (
              <div key={c.id} className="flex flex-col gap-2 p-3 sm:flex-row">
                <Input value={editing.name} onChange={(e) => setEditing((x) => ({ ...x, name: e.target.value }))} maxLength={80} autoFocus />
                <Input value={editing.description} onChange={(e) => setEditing((x) => ({ ...x, description: e.target.value }))} maxLength={300} />
                <div className="flex gap-1">
                  <Button size="icon" onClick={onSave} disabled={busy === c.id || !editing.name.trim()} aria-label="Save">
                    {busy === c.id ? <Loader2 className="animate-spin" /> : <Check />}
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setEditing(null)} aria-label="Cancel"><X /></Button>
                </div>
              </div>
            ) : (
              <div key={c.id} className="flex items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{c.name} <span className="font-normal text-muted-foreground">/{c.slug}</span></p>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.courseCount ?? 0} courses · created {formatDate(c.createdAt)}{c.description ? ` · ${c.description}` : ""}
                  </p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => setEditing({ id: c.id, name: c.name, description: c.description ?? "" })} aria-label="Edit">
                  <Pencil />
                </Button>
                <Button size="icon" variant="ghost" disabled={busy === c.id} onClick={() => onDelete(c)} aria-label="Delete" className="text-destructive hover:text-destructive">
                  {busy === c.id ? <Loader2 className="animate-spin" /> : <Trash2 />}
                </Button>
              </div>
            )
          )}
        </div>
      )}
    </>
  )
}
