import { Link } from "react-router-dom"
import { MdInsights } from "react-icons/md"
import { useTranslation } from "react-i18next"
import { IoEye } from "react-icons/io5"
import { HiUsers } from "react-icons/hi"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/admin/AdminUI"
import { DataTable } from "@/components/admin/DataTable"
import { CourseThumb, EmptyState, ErrorState, LoadingState } from "@/components/course/CourseBits"
import { useFetch } from "@/hooks/useFetch"
import { assessmentService } from "@/services/assessment.service"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"

// Pass-rate pill: green when most students pass, amber in the middle, red when most fail
export const rateTone = (rate) =>
  rate == null ? "bg-neutral-100 text-muted-foreground dark:bg-neutral-800"
    : rate >= 70 ? "bg-emerald-500/12 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
      : rate >= 40 ? "bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
        : "bg-rose-500/12 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300"

export default function AssessmentsPage() {
  const { t } = useTranslation()
  const { data, loading, error, reload } = useFetch(() => assessmentService.list(), [])
  const rows = data ?? []

  return (
    <>
      <PageHeader title={t("admin.assessments.title")} description={t("admin.assessments.description")} />
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : rows.length === 0 ? (
        <EmptyState icon={MdInsights} title={t("admin.assessments.empty")}>{t("admin.assessments.emptyHint")}</EmptyState>
      ) : (
        <DataTable
          rows={rows}
          rowKey={(r) => r.courseId}
          columns={[
            {
              key: "course",
              label: t("admin.assessments.columns.course"),
              render: (r) => (
                <Link to={`/admin/assessments/${r.courseId}`} className="group flex min-w-0 items-center gap-3">
                  <span className="block w-16 shrink-0 overflow-hidden rounded-md bg-[#f5f5f5] dark:bg-neutral-800">
                    <CourseThumb
                      course={{ id: r.courseId, thumbnailUrl: r.thumbnailUrl, title: r.courseTitle }}
                      className="aspect-[16/10] object-contain p-1 mix-blend-multiply dark:mix-blend-normal"
                      iconClassName="size-4"
                    />
                  </span>
                  <span className="min-w-0 leading-tight">
                    <span className="block truncate font-semibold group-hover:text-primary group-hover:underline">{r.courseTitle}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {r.quizTitle} · {t("admin.assessments.questionCount", { count: r.questionCount })} · {t("admin.assessments.passMark", { value: r.passMark })}
                    </span>
                  </span>
                </Link>
              ),
            },
            {
              key: "students",
              label: t("admin.assessments.columns.students"),
              nowrap: true,
              render: (r) => (
                <span className="inline-flex items-center gap-1.5 tabular-nums">
                  <HiUsers className="size-4 text-muted-foreground" /> {r.students}
                  <span className="text-xs text-muted-foreground">({t("admin.assessments.attemptCount", { count: r.attempts })})</span>
                </span>
              ),
            },
            {
              key: "average",
              label: t("admin.assessments.columns.avgScore"),
              nowrap: true,
              render: (r) => <span className="font-semibold tabular-nums">{r.averageScore == null ? "—" : `${r.averageScore}%`}</span>,
            },
            {
              key: "passRate",
              label: t("admin.assessments.columns.passRate"),
              nowrap: true,
              render: (r) => (
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums", rateTone(r.passRate))}>
                  {r.passRate == null ? t("admin.assessments.noAttempts") : `${r.passRate}%`}
                </span>
              ),
            },
            {
              key: "last",
              label: t("admin.assessments.columns.lastAttempt"),
              nowrap: true,
              render: (r) => <span className="text-muted-foreground">{r.lastAttemptAt ? formatDate(r.lastAttemptAt) : "—"}</span>,
            },
            {
              key: "actions",
              label: t("admin.shared.actions"),
              align: "right",
              render: (r) => (
                <Button size="sm" variant="bordered" asChild>
                  <Link to={`/admin/assessments/${r.courseId}`}><IoEye className="size-4" /> {t("admin.assessments.viewResults")}</Link>
                </Button>
              ),
            },
          ]}
        />
      )}
    </>
  )
}
