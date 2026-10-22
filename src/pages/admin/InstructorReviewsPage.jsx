import { useMemo, useState } from "react"
import { MdRateReview } from "react-icons/md"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Loader2 } from "lucide-react"
import { BiSolidTrash } from "react-icons/bi"
import { IoEye } from "react-icons/io5"
import { Button } from "@/components/ui/button"
import { PageHeader, Stars } from "@/components/admin/AdminUI"
import { CourseThumb, EmptyState, ErrorState, LoadingState } from "@/components/course/CourseBits"
import { useFetch } from "@/hooks/useFetch"
import { useRoles } from "@/hooks/useRoles"
import { reviewService } from "@/services/review.service"
import { courseService } from "@/services/course.service"
import { toList } from "@/services/http"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import { confirm } from "@/store/confirm.store"
import { toast } from "@/lib/toast"

export default function InstructorReviewsPage() {
  const { t } = useTranslation()
  const { isAdmin } = useRoles()
  const [page, setPage] = useState(0)
  const { data, loading, error, reload } = useFetch(() => reviewService.forInstructor({ page, size: 15, sort: "createdAt,desc" }), [page])
  // Reviews only carry a courseId — look the title/thumbnail up from the courses this user manages
  const { data: courses } = useFetch(() => courseService.mine(), [])
  const courseById = useMemo(() => new Map(toList(courses).map((c) => [c.id, c])), [courses])
  const reviews = toList(data)

  const remove = async (r) => {
    const ok = await confirm({
      title: t("admin.reviews.deleteDialog.title"),
      description: t("admin.reviews.deleteDialog.by", { author: r.authorName }),
      body: t("admin.reviews.deleteDialog.body"),
      confirmLabel: t("admin.reviews.deleteReview"),
    })
    if (!ok) return false
    try {
      await reviewService.deleteAny(r.id)
      toast.success(t("admin.reviews.toast.deleted"))
      reload()
    } catch (err) {
      toast.error(t("admin.reviews.toast.deleteFailed"), err)
    }
    return true
  }

  return (
    <>
      <PageHeader title={t("admin.reviews.title")} description={t("admin.reviews.description")} />
      {loading && !data ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : reviews.length === 0 ? (
        <EmptyState icon={MdRateReview} title={t("admin.reviews.empty")}>{t("admin.reviews.emptyHint")}</EmptyState>
      ) : (
        <>
          <ReviewTable reviews={reviews} courseById={courseById} onDelete={isAdmin ? remove : undefined} />
          {data?.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <Button variant="bordered" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>{t("admin.shared.previous")}</Button>
              <span className="text-sm text-muted-foreground">{t("admin.shared.pageOf", { page: page + 1, total: data.totalPages })}</span>
              <Button variant="bordered" size="sm" disabled={data.last} onClick={() => setPage((p) => p + 1)}>{t("admin.shared.next")}</Button>
            </div>
          )}
        </>
      )}
    </>
  )
}

// White table (desktop) / stacked cards (phones), same look as My courses
function ReviewTable({ reviews, courseById, onDelete }) {
  const { t } = useTranslation()
  const th = "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <table className="hidden w-full text-sm md:table">
        <thead className="border-b border-neutral-200/80 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800/40">
          <tr>
            <th className={th}>{t("admin.reviews.columns.student")}</th>
            <th className={th}>{t("admin.reviews.columns.course")}</th>
            <th className={th}>{t("admin.reviews.columns.rating")}</th>
            <th className={cn(th, "w-[38%]")}>{t("admin.reviews.columns.review")}</th>
            <th className={th}>{t("admin.reviews.columns.date")}</th>
            <th className={cn(th, "text-right")}>{t("admin.shared.actions")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200/80 dark:divide-neutral-800">
          {reviews.map((r) => (
            <tr key={r.id} className="align-top transition-colors hover:bg-neutral-50/70 dark:hover:bg-neutral-800/30">
              <td className="px-4 py-3.5"><StudentCell review={r} /></td>
              <td className="px-4 py-3.5"><CourseCell course={courseById.get(r.courseId)} courseId={r.courseId} /></td>
              <td className="px-4 py-3.5"><RatingCell rating={r.rating} /></td>
              <td className="px-4 py-3.5"><CommentCell review={r} /></td>
              <td className="whitespace-nowrap px-4 py-3.5 text-muted-foreground">{formatDate(r.updatedAt ?? r.createdAt)}</td>
              <td className="w-px whitespace-nowrap px-4 py-3.5"><RowActions review={r} onDelete={onDelete} /></td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="divide-y divide-neutral-200/80 md:hidden dark:divide-neutral-800">
        {reviews.map((r) => (
          <li key={r.id} className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <StudentCell review={r} />
              <RowActions review={r} onDelete={onDelete} />
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <RatingCell rating={r.rating} />
              <span className="text-xs text-muted-foreground">{formatDate(r.updatedAt ?? r.createdAt)}</span>
            </div>
            <CommentCell review={r} />
            <CourseCell course={courseById.get(r.courseId)} courseId={r.courseId} />
          </li>
        ))}
      </ul>
    </div>
  )
}

const initialsOf = (name = "") =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "?"

function StudentCell({ review: r }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      {r.authorAvatarUrl ? (
        <img src={r.authorAvatarUrl} alt="" className="size-8 shrink-0 rounded-full object-cover" />
      ) : (
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
          {initialsOf(r.authorName)}
        </span>
      )}
      <span className="truncate font-medium">{r.authorName}</span>
    </div>
  )
}

function CourseCell({ course, courseId }) {
  const { t } = useTranslation()
  return (
    <Link to={`/admin/courses/${courseId}/reviews`} className="group flex min-w-0 items-center gap-2.5">
      <span className="block w-14 shrink-0 overflow-hidden rounded-md bg-[#f5f5f5] dark:bg-neutral-800">
        <CourseThumb
          course={course ?? { id: courseId }}
          className="aspect-[16/10] object-contain p-1 mix-blend-multiply dark:mix-blend-normal"
          iconClassName="size-4"
        />
      </span>
      <span className="truncate font-medium group-hover:text-primary group-hover:underline">{course?.title ?? t("admin.reviews.viewCourse")}</span>
    </Link>
  )
}

function RatingCell({ rating }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <Stars value={rating} size="size-3.5" />
      <span className="text-xs font-semibold tabular-nums">{Number(rating).toFixed(1)}</span>
    </span>
  )
}

function CommentCell({ review: r }) {
  const { t } = useTranslation()
  return (
    <div className="min-w-0 space-y-1">
      {r.comment ? (
        <p className="line-clamp-2 whitespace-pre-line text-foreground/90" title={r.comment}>{r.comment}</p>
      ) : (
        <p className="italic text-muted-foreground">{t("admin.reviews.noComment")}</p>
      )}
      {r.percentCompleteWhenWritten != null && (
        <span className="inline-flex rounded-full bg-sky-500/12 px-2 py-0.5 text-[11px] font-semibold text-sky-700 dark:bg-sky-500/20 dark:text-sky-300">
          {t("admin.reviews.writtenAt", { pct: r.percentCompleteWhenWritten })}
        </span>
      )}
    </div>
  )
}

function RowActions({ review, onDelete }) {
  const { t } = useTranslation()
  const [busy, setBusy] = useState(false)
  return (
    <div className="flex items-center justify-end gap-1.5">
      <Button size="icon" variant="bordered" className="size-8" asChild aria-label={t("admin.reviews.allForCourse")} title={t("admin.reviews.allForCourse")}>
        <Link to={`/admin/courses/${review.courseId}/reviews`}><IoEye className="size-4" /></Link>
      </Button>
      {onDelete && (
        <Button
          size="icon"
          variant="bordered"
          className="size-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-500/10"
          disabled={busy}
          aria-label={t("admin.reviews.deleteReview")}
          title={t("admin.reviews.deleteReview")}
          onClick={async () => {
            setBusy(true)
            await onDelete(review)
            setBusy(false)
          }}
        >
          {busy ? <Loader2 className="animate-spin" /> : <BiSolidTrash className="size-4" />}
        </Button>
      )}
    </div>
  )
}
