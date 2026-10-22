import { useState } from "react"
import { MdLibraryBooks } from "react-icons/md"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Plus, Send, Loader2, Globe } from "lucide-react"
import { BiSolidArchive, BiSolidEditAlt, BiSolidTrash } from "react-icons/bi"
import { HiUsers } from "react-icons/hi"
import { IoEye } from "react-icons/io5"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/admin/AdminUI"
import { CourseThumb, EmptyState, ErrorState, LoadingState, StatusBadge } from "@/components/course/CourseBits"
import { FormError } from "@/components/auth/FormField"
import { useFetch } from "@/hooks/useFetch"
import { useRoles } from "@/hooks/useRoles"
import { courseService } from "@/services/course.service"
import { getErrorMessage } from "@/lib/api"
import { COURSE_STATUS, levelLabel } from "@/lib/constants"
import { formatMinutes } from "@/lib/format"
import { cn } from "@/lib/utils"
import { LEVEL_TAG, categoryTag } from "@/lib/tags"
import { confirm } from "@/store/confirm.store"
import { toast } from "@/lib/toast"

export default function CoursesPage() {
  const { t } = useTranslation()
  const { isAdmin } = useRoles()
  const { data, loading, error, reload } = useFetch(() => courseService.mine(), [])
  const all = data ?? []
  const [filter, setFilter] = useState("ALL")
  const [busyId, setBusyId] = useState(null)
  const [actionError, setActionError] = useState("")
  const courses = filter === "ALL" ? all : all.filter((c) => c.status === filter)
  const counts = all.reduce((m, c) => ({ ...m, [c.status]: (m[c.status] ?? 0) + 1 }), {})

  const run = async (id, fn, successMsg) => {
    setActionError("")
    setBusyId(id)
    try {
      await fn()
      reload()
      if (successMsg) toast.success(successMsg)
    } catch (err) {
      setActionError(getErrorMessage(err, t("admin.shared.actionFailed")))
      toast.error(t("admin.shared.actionFailed"), err)
    } finally {
      setBusyId(null)
    }
  }

  const statusToast = { PUBLISHED: t("admin.courses.toast.published"), PENDING_REVIEW: t("admin.courses.toast.submitted"), ARCHIVED: t("admin.courses.toast.archived"), DRAFT: t("admin.courses.toast.draft") }
  const setStatus = (c, status, note) => run(c.id, () => courseService.changeStatus(c.id, status, note), statusToast[status])
  const onDelete = async (c) => {
    const ok = await confirm({
      title: t("admin.courses.deleteDialog.title", { title: c.title }),
      description: t("admin.shared.cantUndo"),
      body: t("admin.courses.deleteDialog.body"),
      confirmLabel: t("admin.courses.deleteDialog.confirm"),
    })
    if (ok) run(c.id, () => courseService.remove(c.id), t("admin.courses.toast.deleted"))
  }

  return (
    <>
      <PageHeader title={t("admin.courses.title")} description={t("admin.courses.description")}>
        <Button asChild variant="solid" className="border-foreground bg-foreground text-background hover:bg-foreground/85">
          <Link to="/admin/courses/new"><Plus /> {t("admin.courses.newCourse")}</Link>
        </Button>
      </PageHeader>

      <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl border border-neutral-200/80 bg-neutral-100/70 p-1 sm:w-fit dark:border-neutral-800 dark:bg-neutral-900">
        {["ALL", ...Object.keys(COURSE_STATUS)].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
              filter === s && "bg-white text-foreground shadow-sm dark:bg-neutral-800"
            )}
          >
            {s === "ALL" ? t("admin.courses.all") : t(`admin.courseStatus.${s}`, { defaultValue: COURSE_STATUS[s].label })}
            <span
              className={cn(
                "rounded-full px-1.5 text-[11px] font-semibold tabular-nums",
                filter === s ? "bg-primary text-primary-foreground" : "bg-neutral-200 text-muted-foreground dark:bg-neutral-800"
              )}
            >
              {s === "ALL" ? all.length : counts[s] ?? 0}
            </span>
          </button>
        ))}
      </div>

      <FormError message={actionError} />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : courses.length === 0 ? (
        <EmptyState icon={MdLibraryBooks} title={all.length ? t("admin.courses.emptyFiltered") : t("admin.courses.empty")}>
          {!all.length && <Link to="/admin/courses/new" className="text-primary hover:underline">{t("admin.courses.createFirst")}</Link>}
        </EmptyState>
      ) : (
        <CourseTable
          courses={courses}
          isAdmin={isAdmin}
          busyId={busyId}
          onStatus={setStatus}
          onDelete={onDelete}
        />
      )}
    </>
  )
}

// White table (desktop) / stacked cards (phones), same look as the other admin tables
function CourseTable({ courses, isAdmin, busyId, onStatus, onDelete }) {
  const { t } = useTranslation()
  const th = "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      {/* desktop */}
      <table className="hidden w-full text-sm md:table">
        <thead className="border-b border-neutral-200/80 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800/40">
          <tr>
            <th className={th}>{t("admin.courses.columns.course")}</th>
            <th className={th}>{t("admin.courses.columns.category")}</th>
            <th className={th}>{t("admin.courses.columns.level")}</th>
            <th className={th}>{t("admin.courses.columns.status")}</th>
            <th className={cn(th, "text-right")}>{t("admin.courses.columns.actions")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200/80 dark:divide-neutral-800">
          {courses.map((c) => (
            <tr key={c.id} className="transition-colors hover:bg-neutral-50/70 dark:hover:bg-neutral-800/30">
              <td className="px-4 py-3">
                <CourseCell course={c} />
              </td>
              <td className="px-4 py-3">
                {c.categoryName ? <Tag className={categoryTag(c.categoryName)}>{c.categoryName}</Tag> : <span className="text-muted-foreground">—</span>}
              </td>
              <td className="px-4 py-3">
                {c.level ? <Tag className={LEVEL_TAG[c.level]}>{t(`admin.levels.${c.level}`, { defaultValue: levelLabel(c.level) })}</Tag> : <span className="text-muted-foreground">—</span>}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={c.status} />
              </td>
              <td className="w-px whitespace-nowrap px-4 py-3">
                <RowActions course={c} isAdmin={isAdmin} busy={busyId === c.id} onStatus={onStatus} onDelete={onDelete} className="flex-nowrap" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* phones */}
      <ul className="divide-y divide-neutral-200/80 md:hidden dark:divide-neutral-800">
        {courses.map((c) => (
          <li key={c.id} className="space-y-3 p-4">
            <CourseCell course={c} />
            <div className="flex flex-wrap items-center gap-1.5">
              <StatusBadge status={c.status} />
              {c.categoryName && <Tag className={categoryTag(c.categoryName)}>{c.categoryName}</Tag>}
              {c.level && <Tag className={LEVEL_TAG[c.level]}>{t(`admin.levels.${c.level}`, { defaultValue: levelLabel(c.level) })}</Tag>}
            </div>
            <RowActions course={c} isAdmin={isAdmin} busy={busyId === c.id} onStatus={onStatus} onDelete={onDelete} className="justify-start" />
          </li>
        ))}
      </ul>
    </div>
  )
}

function Tag({ className, children }) {
  return <span className={cn("inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold", className)}>{children}</span>
}

// Thumbnail on a #f5f5f5 panel + title + lessons/duration
function CourseCell({ course: c }) {
  const { t } = useTranslation()
  return (
    <Link to={`/admin/courses/${c.id}`} className="group flex min-w-0 items-center gap-3">
      <span className="block w-24 shrink-0 overflow-hidden rounded-lg bg-[#f5f5f5] dark:bg-neutral-800">
        <CourseThumb course={c} className="aspect-[16/10] object-contain p-1.5 mix-blend-multiply dark:mix-blend-normal" iconClassName="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate font-semibold group-hover:text-primary group-hover:underline">{c.title}</span>
        <span className="block text-xs text-muted-foreground">
          {t("admin.courses.lessonCount", { count: c.lessonCount ?? 0 })} · {formatMinutes(c.totalMinutes)}
        </span>
      </span>
    </Link>
  )
}

const iconBtn = "size-8"

function RowActions({ course: c, isAdmin, busy, onStatus, onDelete, className }) {
  const { t } = useTranslation()
  return (
    <div className={cn("flex flex-wrap items-center justify-end gap-1.5", className)}>
      {busy && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
      {!isAdmin && (c.status === "DRAFT" || c.status === "REJECTED") && (
        <Button size="sm" variant="bordered" disabled={busy} onClick={() => onStatus(c, "PENDING_REVIEW", "Ready for review")}>
          <Send /> {t("admin.courses.submitForReview")}
        </Button>
      )}
      {isAdmin && c.status !== "PUBLISHED" && (
        <Button size="sm" variant="bordered" disabled={busy} onClick={() => onStatus(c, "PUBLISHED", "Published by admin")}>
          <Globe /> {t("admin.courses.publish")}
        </Button>
      )}
      {c.status === "PUBLISHED" && (
        <Button size="icon" variant="bordered" className={iconBtn} disabled={busy} onClick={() => onStatus(c, "ARCHIVED", "Archived")} aria-label={t("admin.courses.archive")} title={t("admin.courses.archive")}>
          <BiSolidArchive className="size-4" />
        </Button>
      )}
      <Button size="icon" variant="bordered" className={iconBtn} asChild aria-label={t("admin.courses.students")} title={t("admin.courses.students")}>
        <Link to={`/admin/courses/${c.id}/students`}><HiUsers className="size-4" /></Link>
      </Button>
      <Button size="icon" variant="bordered" className={iconBtn} asChild aria-label={t("common.actions.view")} title={t("admin.courses.viewOnSite")}>
        <Link to={`/courses/${c.id}`}><IoEye className="size-4" /></Link>
      </Button>
      <Button size="icon" variant="bordered" className={iconBtn} asChild aria-label={t("common.actions.edit")} title={t("common.actions.edit")}>
        <Link to={`/admin/courses/${c.id}`}><BiSolidEditAlt className="size-4" /></Link>
      </Button>
      <Button
        size="icon"
        variant="bordered"
        className={cn(iconBtn, "text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-500/10")}
        disabled={busy}
        onClick={() => onDelete(c)}
        aria-label={t("common.actions.delete")}
        title={t("common.actions.delete")}
      >
        <BiSolidTrash className="size-4" />
      </Button>
    </div>
  )
}
