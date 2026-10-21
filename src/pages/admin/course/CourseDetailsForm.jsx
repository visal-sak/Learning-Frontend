import { useEffect, useState } from "react"
import { Loader2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { NativeSelect } from "@/components/ui/native-select"
import { Label } from "@/components/ui/label"
import FormField, { FormError } from "@/components/auth/FormField"
import { ImageUpload } from "@/components/admin/AdminUI"
import { useCatalogStore } from "@/store"
import { getErrorMessage } from "@/lib/api"
import { LEVELS } from "@/lib/constants"

const toForm = (c = {}) => ({
  title: c.title ?? "",
  categoryId: c.categoryId ?? "",
  summary: c.summary ?? "",
  description: c.description ?? "",
  thumbnailUrl: c.thumbnailUrl ?? "",
  level: c.level ?? "BEGINNER",
})

// Shared by "new course" and the Details tab. `onSubmit(payload)` does the API call.
export default function CourseDetailsForm({ course, onSubmit, submitLabel = "Save changes" }) {
  const categories = useCatalogStore((s) => s.categories)
  const fetchCategories = useCatalogStore((s) => s.fetchCategories)
  const [form, setForm] = useState(() => toForm(course))
  const [errors, setErrors] = useState({})
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchCategories().catch(() => {})
  }, [fetchCategories])

  const set = (name, value) => {
    setSaved(false)
    setForm((f) => ({ ...f, [name]: value }))
    if (errors[name]) setErrors((x) => ({ ...x, [name]: undefined }))
  }
  const onChange = (e) => set(e.target.name, e.target.value)

  const submit = async (e) => {
    e.preventDefault()
    const v = {}
    if (!form.title.trim()) v.title = "Required"
    if (!form.categoryId) v.categoryId = "Pick a category"
    setErrors(v)
    if (Object.keys(v).length) return
    setError("")
    setSaving(true)
    try {
      await onSubmit({ ...form, title: form.title.trim() })
      setSaved(true)
    } catch (err) {
      setError(getErrorMessage(err, "Couldn’t save the course"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_300px]" noValidate>
      <div className="space-y-4">
        <FormError message={error} />
        <FormField id="title" label="Title" value={form.title} onChange={onChange} error={errors.title} placeholder="e.g. Basic HTML" maxLength={200} />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="categoryId" label="Category" as={NativeSelect} value={form.categoryId} onChange={onChange} error={errors.categoryId}>
            <option value="">Select a category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </FormField>
          <FormField id="level" label="Level" as={NativeSelect} value={form.level} onChange={onChange}>
            {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
          </FormField>
        </div>
        <FormField id="summary" label="Summary" value={form.summary} onChange={onChange} placeholder="One line that sells the course" maxLength={500} />
        <FormField id="description" label="Description" as={Textarea} rows={8} value={form.description} onChange={onChange} placeholder="What will students learn? Who is it for?" />
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Thumbnail</Label>
          <ImageUpload value={form.thumbnailUrl} onChange={(url) => set("thumbnailUrl", url)} />
        </div>
        <div className="flex items-center justify-end gap-3 border-t pt-4 lg:justify-start">
          <Button type="submit" disabled={saving} className="lg:w-full">
            {saving && <Loader2 className="animate-spin" />}
            {submitLabel}
          </Button>
          {saved && <span className="flex items-center gap-1 text-sm text-primary"><Check className="size-4" /> Saved</span>}
        </div>
      </div>
    </form>
  )
}
