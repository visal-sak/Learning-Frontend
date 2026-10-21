import { useEffect, useRef, useState } from "react"
import { ChevronUp, ChevronDown, Pencil, Trash2, Plus, Loader2, Check, X, FileText, Eye, Upload, Paperclip } from "lucide-react"
import { IoIosPlayCircle } from "react-icons/io"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import FormField, { FormError } from "@/components/auth/FormField"
import { Modal } from "@/components/admin/AdminUI"
import { EmptyState, LoadingState } from "@/components/course/CourseBits"
import { useCourse } from "./useCourse"
import { contentService } from "@/services/content.service"
import { mediaService } from "@/services/media.service"
import { getErrorMessage } from "@/lib/api"
import { formatBytes, formatMinutes } from "@/lib/format"
import { confirm } from "@/store/confirm.store"
import { toast } from "@/lib/toast"

const move = (arr, i, dir) => {
  const next = [...arr]
  const j = i + dir
  ;[next[i], next[j]] = [next[j], next[i]]
  return next
}

export default function CurriculumTab() {
  const { course, reload } = useCourse()
  const sections = course.sections ?? []
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(null)
  const [newTitle, setNewTitle] = useState("")
  const [lessonModal, setLessonModal] = useState(null) // { sectionId, lesson? }

  const run = async (key, fn, successMsg) => {
    setError("")
    setBusy(key)
    try {
      await fn()
      await reload()
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

  const addSection = async (e) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    if (await run("new-section", () => contentService.createSection(course.id, newTitle.trim()), "Section added")) setNewTitle("")
  }

  const moveSection = (i, dir) =>
    run(`move-${sections[i].id}`, () => contentService.reorderSections(course.id, move(sections, i, dir).map((s) => s.id)))

  const moveLesson = (section, i, dir) =>
    run(`move-${section.lessons[i].id}`, () => contentService.reorderLessons(section.id, move(section.lessons, i, dir).map((l) => l.id)))

  return (
    <div className="space-y-4">
      <FormError message={error} />

      {sections.length === 0 && <EmptyState title="No sections yet">Add your first section below, then add lessons to it.</EmptyState>}

      {sections.map((s, i) => (
        <div key={s.id} className="overflow-hidden rounded-xl border glass">
          <SectionHeader
            section={s}
            index={i}
            total={sections.length}
            busy={busy}
            onMove={(dir) => moveSection(i, dir)}
            onRename={(title) => run(`rename-${s.id}`, () => contentService.updateSection(s.id, title), "Section renamed")}
            onDelete={async () => {
              const ok = await confirm({
                title: `Delete section “${s.title}”?`,
                description: "This can’t be undone.",
                body: `All ${s.lessons?.length ?? 0} lesson(s) in this section will be deleted too.`,
                confirmLabel: "Delete section",
              })
              if (ok) run(`del-${s.id}`, () => contentService.deleteSection(s.id), "Section deleted")
            }}
          />
          <ul className="divide-y">
            {(s.lessons ?? []).map((l, li) => (
              <li key={l.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <IoIosPlayCircle className="size-[18px] shrink-0 text-primary" />
                <span className="min-w-0 flex-1 truncate">{l.title}</span>
                {l.preview && <span className="flex items-center gap-1 text-xs text-primary"><Eye className="size-3" /> Preview</span>}
                <span className="w-12 text-right text-xs text-muted-foreground">{formatMinutes(l.durationMinutes)}</span>
                <div className="flex">
                  <IconBtn label="Move up" disabled={li === 0 || !!busy} onClick={() => moveLesson(s, li, -1)}><ChevronUp /></IconBtn>
                  <IconBtn label="Move down" disabled={li === s.lessons.length - 1 || !!busy} onClick={() => moveLesson(s, li, 1)}><ChevronDown /></IconBtn>
                  <IconBtn label="Edit" onClick={() => setLessonModal({ sectionId: s.id, lessonId: l.id })}><Pencil /></IconBtn>
                  <IconBtn
                    label="Delete"
                    className="text-destructive hover:text-destructive"
                    disabled={!!busy}
                    onClick={async () => {
                      const ok = await confirm({ title: `Delete lesson “${l.title}”?`, description: "Students’ progress on this lesson will be lost.", confirmLabel: "Delete lesson" })
                      if (ok) run(`del-${l.id}`, () => contentService.deleteLesson(l.id), "Lesson deleted")
                    }}
                  >
                    {busy === `del-${l.id}` ? <Loader2 className="animate-spin" /> : <Trash2 />}
                  </IconBtn>
                </div>
              </li>
            ))}
          </ul>
          <div className="border-t px-4 py-2">
            <Button variant="ghost" size="sm" onClick={() => setLessonModal({ sectionId: s.id })}><Plus /> Add lesson</Button>
          </div>
        </div>
      ))}

      <form onSubmit={addSection} className="flex gap-2 rounded-xl border border-dashed p-3">
        <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="New section title, e.g. Getting started" maxLength={200} />
        <Button type="submit" variant="secondary" disabled={busy === "new-section" || !newTitle.trim()}>
          {busy === "new-section" ? <Loader2 className="animate-spin" /> : <Plus />} Add section
        </Button>
      </form>

      {lessonModal && (
        <LessonModal
          sectionId={lessonModal.sectionId}
          lessonId={lessonModal.lessonId}
          onClose={() => setLessonModal(null)}
          onSaved={() => {
            setLessonModal(null)
            reload()
          }}
        />
      )}
    </div>
  )
}

function IconBtn({ label, children, className, ...props }) {
  return (
    <Button type="button" size="icon" variant="ghost" className={`size-8 ${className ?? ""}`} aria-label={label} title={label} {...props}>
      {children}
    </Button>
  )
}

function SectionHeader({ section, index, total, busy, onMove, onRename, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(section.title)

  const save = async () => {
    if (!title.trim() || title === section.title) return setEditing(false)
    await onRename(title.trim())
    setEditing(false)
  }

  return (
    <div className="flex items-center gap-2 bg-muted/50 px-4 py-2.5">
      <span className="text-xs font-semibold text-muted-foreground">{index + 1}.</span>
      {editing ? (
        <>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()} className="h-8" autoFocus />
          <IconBtn label="Save" onClick={save}><Check /></IconBtn>
          <IconBtn label="Cancel" onClick={() => { setTitle(section.title); setEditing(false) }}><X /></IconBtn>
        </>
      ) : (
        <>
          <p className="min-w-0 flex-1 truncate font-medium">{section.title}</p>
          <span className="hidden text-xs text-muted-foreground sm:inline">{section.lessons?.length ?? 0} lessons · {formatMinutes(section.totalMinutes)}</span>
          <div className="flex">
            <IconBtn label="Move section up" disabled={index === 0 || !!busy} onClick={() => onMove(-1)}><ChevronUp /></IconBtn>
            <IconBtn label="Move section down" disabled={index === total - 1 || !!busy} onClick={() => onMove(1)}><ChevronDown /></IconBtn>
            <IconBtn label="Rename" onClick={() => setEditing(true)}><Pencil /></IconBtn>
            <IconBtn label="Delete section" className="text-destructive hover:text-destructive" disabled={!!busy} onClick={onDelete}><Trash2 /></IconBtn>
          </div>
        </>
      )}
    </div>
  )
}

const emptyLesson = { title: "", durationMinutes: 5, preview: false, videoUrl: "", content: "" }

function LessonModal({ sectionId, lessonId, onClose, onSaved }) {
  const isNew = !lessonId
  const [form, setForm] = useState(emptyLesson)
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(null)
  const [error, setError] = useState("")
  const videoInput = useRef(null)

  // Load full lesson content (notes, video, files) for editing
  useEffect(() => {
    if (isNew) return
    contentService
      .getLesson(lessonId)
      .then((l) => {
        setForm({
          title: l.title ?? "",
          durationMinutes: l.durationMinutes ?? 0,
          preview: !!l.preview,
          videoUrl: l.videoUrl ?? "",
          content: l.content ?? "",
        })
        setFiles(l.files ?? [])
      })
      .catch((err) => setError(getErrorMessage(err, "Couldn’t load the lesson")))
      .finally(() => setLoading(false))
  }, [isNew, lessonId])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const uploadVideo = async (file) => {
    if (!file) return
    setError("")
    setUploading(0)
    try {
      const media = await mediaService.upload(file, setUploading)
      set("videoUrl", media.uri)
    } catch (err) {
      setError(getErrorMessage(err, "Upload failed"))
    } finally {
      setUploading(null)
    }
  }

  const removeFile = async (f) => {
    if (!(await confirm({ title: "Remove this file?", description: f.fileName, confirmLabel: "Remove file" }))) return
    try {
      await contentService.deleteLessonFile(f.id)
      setFiles((x) => x.filter((y) => y.id !== f.id))
      toast.success("File removed")
    } catch (err) {
      setError(getErrorMessage(err, "Couldn’t remove file"))
      toast.error("Couldn’t remove file", err)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return setError("Title is required.")
    setError("")
    setSaving(true)
    const payload = { ...form, title: form.title.trim(), durationMinutes: Number(form.durationMinutes) || 0 }
    try {
      if (isNew) await contentService.createLesson({ sectionId, ...payload })
      else await contentService.updateLesson(lessonId, payload)
      toast.success(isNew ? "Lesson added" : "Lesson saved", payload.title)
      onSaved()
    } catch (err) {
      setError(getErrorMessage(err, "Couldn’t save the lesson"))
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={isNew ? "New lesson" : "Edit lesson"} className="sm:max-w-2xl">
      {loading ? (
        <LoadingState className="py-10" />
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <FormError message={error} />
          <FormField id="lessonTitle" label="Title" value={form.title} onChange={(e) => set("title", e.target.value)} maxLength={200} autoFocus />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="duration" label="Duration (minutes)" type="number" min={0} value={form.durationMinutes} onChange={(e) => set("durationMinutes", e.target.value)} />
            <label className="flex items-center gap-2 self-end rounded-md border px-3 py-2 text-sm">
              <input type="checkbox" checked={form.preview} onChange={(e) => set("preview", e.target.checked)} className="size-4 accent-[var(--primary)]" />
              Free preview <span className="text-muted-foreground">(visible before enrolling)</span>
            </label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="videoUrl">Video</Label>
            <div className="flex gap-2">
              <Input id="videoUrl" value={form.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} placeholder="YouTube / Vimeo link or uploaded file URL" />
              <Button type="button" variant="outline" onClick={() => videoInput.current?.click()} disabled={uploading != null}>
                {uploading != null ? <><Loader2 className="animate-spin" /> {uploading}%</> : <><Upload /> Upload</>}
              </Button>
            </div>
            <input ref={videoInput} type="file" accept="video/*" hidden onChange={(e) => uploadVideo(e.target.files?.[0])} />
          </div>
          <FormField id="content" label="Lesson notes" as={Textarea} rows={8} value={form.content} onChange={(e) => set("content", e.target.value)} placeholder="Text content, code snippets, links…" />

          {files.length > 0 && (
            <div className="space-y-2">
              <Label>Attached files</Label>
              <ul className="divide-y rounded-md border text-sm">
                {files.map((f) => (
                  <li key={f.id} className="flex items-center gap-2 px-3 py-2">
                    <Paperclip className="size-4 text-muted-foreground" />
                    <a href={f.downloadUrl} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate hover:underline">{f.fileName}</a>
                    <span className="text-xs text-muted-foreground">{formatBytes(f.sizeBytes)}</span>
                    <IconBtn label="Remove file" className="text-destructive hover:text-destructive" onClick={() => removeFile(f)}><Trash2 /></IconBtn>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving || uploading != null}>
              {saving ? <Loader2 className="animate-spin" /> : <FileText />} {isNew ? "Add lesson" : "Save lesson"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
