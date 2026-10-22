import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { ChevronUp, ChevronDown, Pencil, Trash2, Plus, Loader2, Check, X, FileText, Eye, Upload, Paperclip } from "lucide-react"
import { IoIosPlayCircle } from "react-icons/io"
import { MdQuiz, MdEmojiEvents, MdViewList } from "react-icons/md"
import { Link } from "react-router-dom"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import QuizItemModal from "./QuizItemModal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import FormField, { FormError } from "@/components/auth/FormField"
import { Modal } from "@/components/admin/AdminUI"
import { EmptyState, LoadingState } from "@/components/course/CourseBits"
import { useCourse } from "./useCourse"
import BlockEditor, { cleanBlocks } from "@/components/lesson/BlockEditor"
import LessonCheckEditor, { cleanCheck } from "@/components/lesson/LessonCheckEditor"
import { lessonCheckService } from "@/services/lessonCheck.service"
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
  const { t } = useTranslation()
  const { course, reload } = useCourse()
  const sections = course.sections ?? []
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(null)
  const [newTitle, setNewTitle] = useState("")
  const [lessonModal, setLessonModal] = useState(null) // { sectionId, lesson? }
  const [quizModal, setQuizModal] = useState(null) // { sectionId, lessonId? } — quiz item

  const run = async (key, fn, successMsg) => {
    setError("")
    setBusy(key)
    try {
      await fn()
      await reload()
      if (successMsg) toast.success(successMsg)
      return true
    } catch (err) {
      setError(getErrorMessage(err, t("admin.curriculum.actionFailed")))
      toast.error(t("admin.curriculum.actionFailed"), err)
      return false
    } finally {
      setBusy(null)
    }
  }

  const addSection = async (e) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    if (await run("new-section", () => contentService.createSection(course.id, newTitle.trim()), t("admin.curriculum.sectionAdded"))) setNewTitle("")
  }

  const moveSection = (i, dir) =>
    run(`move-${sections[i].id}`, () => contentService.reorderSections(course.id, move(sections, i, dir).map((s) => s.id)))

  const moveLesson = (section, i, dir) =>
    run(`move-${section.lessons[i].id}`, () => contentService.reorderLessons(section.id, move(section.lessons, i, dir).map((l) => l.id)))

  return (
    <div className="space-y-4">
      <FormError message={error} />

      {sections.length === 0 && <EmptyState icon={MdViewList} title={t("admin.curriculum.noSections")}>{t("admin.curriculum.noSectionsHint")}</EmptyState>}

      {sections.map((s, i) => (
        <div key={s.id} className="overflow-hidden rounded-xl border glass">
          <SectionHeader
            section={s}
            index={i}
            total={sections.length}
            busy={busy}
            onMove={(dir) => moveSection(i, dir)}
            onRename={(title) => run(`rename-${s.id}`, () => contentService.updateSection(s.id, title), t("admin.curriculum.sectionRenamed"))}
            onDelete={async () => {
              const ok = await confirm({
                title: t("admin.curriculum.deleteSectionTitle", { title: s.title }),
                description: t("admin.curriculum.cantUndo"),
                body: t("admin.curriculum.deleteSectionBody", { count: s.lessons?.length ?? 0 }),
                confirmLabel: t("admin.curriculum.deleteSection"),
              })
              if (ok) run(`del-${s.id}`, () => contentService.deleteSection(s.id), t("admin.curriculum.sectionDeleted"))
            }}
          />
          <ul className="divide-y">
            {(s.lessons ?? []).map((l, li) => (
              <li key={l.id} className={cn("flex items-center gap-3 px-4 py-2.5 text-sm", l.kind === "QUIZ" && "bg-amber-500/[0.04]")}>
                {l.kind === "QUIZ" ? <MdQuiz className="size-[18px] shrink-0 text-amber-500" /> : <IoIosPlayCircle className="size-[18px] shrink-0 text-primary" />}
                <span className="min-w-0 flex-1 truncate">
                  {l.kind === "QUIZ" && <span className="mr-1.5 text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">{t("admin.quizItem.label")}</span>}
                  {l.title}
                </span>
                {l.preview && <span className="flex items-center gap-1 text-xs text-primary"><Eye className="size-3" /> {t("admin.curriculum.preview")}</span>}
                <span className="w-24 text-right text-xs text-muted-foreground">
                  {l.kind === "QUIZ" ? t("admin.quizItem.questions", { count: l.questionCount ?? 0 }) : formatMinutes(l.durationMinutes)}
                </span>
                <div className="flex">
                  <IconBtn label={t("admin.curriculum.moveUp")} disabled={li === 0 || !!busy} onClick={() => moveLesson(s, li, -1)}><ChevronUp /></IconBtn>
                  <IconBtn label={t("admin.curriculum.moveDown")} disabled={li === s.lessons.length - 1 || !!busy} onClick={() => moveLesson(s, li, 1)}><ChevronDown /></IconBtn>
                  <IconBtn label={t("admin.curriculum.edit")} onClick={() => (l.kind === "QUIZ" ? setQuizModal : setLessonModal)({ sectionId: s.id, lessonId: l.id })}><Pencil /></IconBtn>
                  <IconBtn
                    label={t("admin.curriculum.delete")}
                    className="text-destructive hover:text-destructive"
                    disabled={!!busy}
                    onClick={async () => {
                      const ok = await confirm({ title: t("admin.curriculum.deleteLessonTitle", { title: l.title }), description: t("admin.curriculum.deleteLessonBody"), confirmLabel: t("admin.curriculum.deleteLesson") })
                      if (ok) run(`del-${l.id}`, () => contentService.deleteLesson(l.id), t("admin.curriculum.lessonDeleted"))
                    }}
                  >
                    {busy === `del-${l.id}` ? <Loader2 className="animate-spin" /> : <Trash2 />}
                  </IconBtn>
                </div>
              </li>
            ))}
          </ul>
          <div className="border-t px-4 py-2">
            {/* Add → Lesson or Quiz, so a quiz can go anywhere in the section */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm"><Plus /> {t("admin.quizItem.addMenu")} <ChevronDown className="size-3.5 opacity-60" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuItem onSelect={() => setLessonModal({ sectionId: s.id })} className="items-start gap-3 py-2">
                  <IoIosPlayCircle className="mt-0.5 size-[18px] text-primary" />
                  <span><span className="block text-sm font-medium">{t("admin.quizItem.menuLesson")}</span><span className="block text-xs text-muted-foreground">{t("admin.quizItem.menuLessonHint")}</span></span>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setQuizModal({ sectionId: s.id })} className="items-start gap-3 py-2">
                  <MdQuiz className="mt-0.5 size-[18px] text-amber-500" />
                  <span><span className="block text-sm font-medium">{t("admin.quizItem.menuQuiz")}</span><span className="block text-xs text-muted-foreground">{t("admin.quizItem.menuQuizHint")}</span></span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}

      {/* The final quiz closes the curriculum. It's optional and can be added any time,
          so it only appears once there is a section, and looks like an empty slot until it exists. */}
      {sections.length > 0 && (
        <Link
          to={`/admin/courses/${course.id}/quiz`}
          className={cn(
            "flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors",
            course.finalQuizQuestions
              ? "border border-amber-500/30 bg-amber-500/[0.06] hover:bg-amber-500/10"
              : "border border-dashed text-muted-foreground hover:border-amber-500/40 hover:bg-amber-500/[0.04]"
          )}
        >
          <span className={cn("grid size-9 place-items-center rounded-lg", course.finalQuizQuestions ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground")}>
            <MdEmojiEvents className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2 font-semibold text-foreground">
              {t("admin.quizItem.finalQuiz")}
              {!course.finalQuizQuestions && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{t("admin.quizItem.optional")}</span>
              )}
            </span>
            <span className="block text-xs text-muted-foreground">
              {course.finalQuizQuestions ? t("admin.quizItem.finalQuizHint") : t("admin.quizItem.finalQuizNone")}
            </span>
          </span>
          <span className="shrink-0 text-xs font-medium text-muted-foreground">
            {course.finalQuizQuestions ? t("admin.quizItem.questions", { count: course.finalQuizQuestions }) : t("admin.quizItem.finalQuizAdd")}
          </span>
        </Link>
      )}

      <form onSubmit={addSection} className="flex gap-2 rounded-xl border border-dashed p-3">
        <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder={t("admin.curriculum.newSectionPh")} maxLength={200} />
        <Button type="submit" variant="secondary" disabled={busy === "new-section" || !newTitle.trim()}>
          {busy === "new-section" ? <Loader2 className="animate-spin" /> : <Plus />} {t("admin.curriculum.addSection")}
        </Button>
      </form>

      {quizModal && (
        <QuizItemModal
          sectionId={quizModal.sectionId}
          lessonId={quizModal.lessonId}
          onClose={() => setQuizModal(null)}
          onSaved={() => {
            setQuizModal(null)
            reload()
          }}
        />
      )}

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
  const { t } = useTranslation()
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
          <IconBtn label={t("admin.curriculum.save")} onClick={save}><Check /></IconBtn>
          <IconBtn label={t("admin.curriculum.cancel")} onClick={() => { setTitle(section.title); setEditing(false) }}><X /></IconBtn>
        </>
      ) : (
        <>
          <p className="min-w-0 flex-1 truncate font-medium">{section.title}</p>
          <span className="hidden text-xs text-muted-foreground sm:inline">{t("admin.curriculum.lessons", { count: section.lessons?.length ?? 0 })} · {formatMinutes(section.totalMinutes)}</span>
          <div className="flex">
            <IconBtn label={t("admin.curriculum.moveSectionUp")} disabled={index === 0 || !!busy} onClick={() => onMove(-1)}><ChevronUp /></IconBtn>
            <IconBtn label={t("admin.curriculum.moveSectionDown")} disabled={index === total - 1 || !!busy} onClick={() => onMove(1)}><ChevronDown /></IconBtn>
            <IconBtn label={t("admin.curriculum.rename")} onClick={() => setEditing(true)}><Pencil /></IconBtn>
            <IconBtn label={t("admin.curriculum.deleteSection")} className="text-destructive hover:text-destructive" disabled={!!busy} onClick={onDelete}><Trash2 /></IconBtn>
          </div>
        </>
      )}
    </div>
  )
}

const emptyLesson = { title: "", durationMinutes: 5, preview: false, videoUrl: "", content: "" }

function LessonModal({ sectionId, lessonId, onClose, onSaved }) {
  const { t } = useTranslation()
  const isNew = !lessonId
  const [form, setForm] = useState(emptyLesson)
  const [files, setFiles] = useState([])
  const [blocks, setBlocks] = useState([]) // blog-style lesson page
  const [check, setCheck] = useState([]) // lesson quiz questions
  const [checkLoaded, setCheckLoaded] = useState([]) // as loaded, to skip saving when unchanged
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
        setBlocks(l.blocks ?? [])
      })
      .then(() => lessonCheckService.forEditing(lessonId).catch(() => ({ questions: [] })))
      .then((c) => {
        setCheck(c?.questions ?? [])
        setCheckLoaded(c?.questions ?? [])
      })
      .catch((err) => setError(getErrorMessage(err, t("admin.curriculum.loadFailed"))))
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
      setError(getErrorMessage(err, t("admin.curriculum.uploadFailed")))
    } finally {
      setUploading(null)
    }
  }

  const removeFile = async (f) => {
    if (!(await confirm({ title: t("admin.curriculum.removeFileTitle"), description: f.fileName, confirmLabel: t("admin.curriculum.removeFile") }))) return
    try {
      await contentService.deleteLessonFile(f.id)
      setFiles((x) => x.filter((y) => y.id !== f.id))
      toast.success(t("admin.curriculum.fileRemoved"))
    } catch (err) {
      setError(getErrorMessage(err, t("admin.curriculum.removeFileFailed")))
      toast.error(t("admin.curriculum.removeFileFailed"), err)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return setError(t("admin.curriculum.titleRequired"))
    setError("")
    setSaving(true)
    const payload = { ...form, title: form.title.trim(), durationMinutes: Number(form.durationMinutes) || 0, blocks: cleanBlocks(blocks) }
    try {
      const saved = isNew ? await contentService.createLesson({ sectionId, ...payload }) : await contentService.updateLesson(lessonId, payload)
      // the lesson quiz has its own endpoint; save it once the lesson exists
      const questions = cleanCheck(check)
      if (JSON.stringify(questions) !== JSON.stringify(cleanCheck(checkLoaded))) await lessonCheckService.save(saved?.id ?? lessonId, questions)
      toast.success(isNew ? t("admin.curriculum.lessonAdded") : t("admin.curriculum.lessonSaved"), payload.title)
      onSaved()
    } catch (err) {
      setError(getErrorMessage(err, t("admin.curriculum.saveFailed")))
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={isNew ? t("admin.curriculum.newLesson") : t("admin.curriculum.editLesson")} className="sm:max-w-4xl">
      {loading ? (
        <LoadingState variant="section" />
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <FormError message={error} />
          <FormField id="lessonTitle" label={t("admin.curriculum.title")} value={form.title} onChange={(e) => set("title", e.target.value)} maxLength={200} autoFocus />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="duration" label={t("admin.curriculum.duration")} type="number" min={0} value={form.durationMinutes} onChange={(e) => set("durationMinutes", e.target.value)} />
            {/* toggle tile: highlights in navy when the lesson is a free preview */}
            <label
              className={cn(
                "flex h-9 items-center gap-2.5 self-end rounded-md border px-3 text-sm transition-colors",
                form.preview ? "border-primary/40 bg-primary/5 dark:bg-primary/10" : "hover:border-primary/30"
              )}
            >
              <Checkbox checked={form.preview} onChange={(v) => set("preview", v)} />
              <Eye className={cn("size-4 shrink-0", form.preview ? "text-primary" : "text-muted-foreground")} />
              <span className="min-w-0 truncate">
                <span className="font-medium">{t("admin.curriculum.freePreview")}</span>{" "}
                <span className="text-muted-foreground">{t("admin.curriculum.freePreviewHint")}</span>
              </span>
            </label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="videoUrl">{t("admin.curriculum.video")}</Label>
            <div className="flex gap-2">
              <Input id="videoUrl" value={form.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} placeholder={t("admin.curriculum.videoPh")} />
              <Button type="button" variant="outline" onClick={() => videoInput.current?.click()} disabled={uploading != null}>
                {uploading != null ? <><Loader2 className="animate-spin" /> {uploading}%</> : <><Upload /> {t("admin.curriculum.upload")}</>}
              </Button>
            </div>
            <input ref={videoInput} type="file" accept="video/*" hidden onChange={(e) => uploadVideo(e.target.files?.[0])} />
          </div>
          <BlockEditor value={blocks} onChange={setBlocks} />

          <LessonCheckEditor value={check} onChange={setCheck} />

          <FormField id="content" label={t("admin.curriculum.intro")} as={Textarea} rows={3} value={form.content} onChange={(e) => set("content", e.target.value)} placeholder={t("admin.curriculum.introPh")} />

          {files.length > 0 && (
            <div className="space-y-2">
              <Label>{t("admin.curriculum.attachedFiles")}</Label>
              <ul className="divide-y rounded-md border text-sm">
                {files.map((f) => (
                  <li key={f.id} className="flex items-center gap-2 px-3 py-2">
                    <Paperclip className="size-4 text-muted-foreground" />
                    <a href={f.downloadUrl} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate hover:underline">{f.fileName}</a>
                    <span className="text-xs text-muted-foreground">{formatBytes(f.sizeBytes)}</span>
                    <IconBtn label={t("admin.curriculum.removeFile")} className="text-destructive hover:text-destructive" onClick={() => removeFile(f)}><Trash2 /></IconBtn>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>{t("admin.curriculum.cancel")}</Button>
            <Button type="submit" disabled={saving || uploading != null}>
              {saving ? <Loader2 className="animate-spin" /> : <FileText />} {isNew ? t("admin.curriculum.addLesson") : t("admin.curriculum.saveLesson")}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
