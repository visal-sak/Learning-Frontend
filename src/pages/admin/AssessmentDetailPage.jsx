import { useState } from "react"
import { MdInsights } from "react-icons/md"
import { Link, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ListChecks, Target, Users, TrendingUp } from "lucide-react"
import { WiDirectionLeft } from "react-icons/wi"
import { RiCheckboxCircleFill } from "react-icons/ri"
import { BiSolidXCircle } from "react-icons/bi"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/admin/AdminUI"
import { DataTable, Tag } from "@/components/admin/DataTable"
import { StatCard } from "@/components/StatCard"
import { EmptyState, ErrorState, LoadingState } from "@/components/course/CourseBits"
import { useFetch } from "@/hooks/useFetch"
import { assessmentService } from "@/services/assessment.service"
import { formatDate } from "@/lib/format"
import { typeLabel } from "@/lib/quiz"
import { cn } from "@/lib/utils"
import { rateTone } from "./AssessmentsPage"

export default function AssessmentDetailPage() {
  const { t } = useTranslation()
  const { courseId } = useParams()
  const { data, loading, error, reload } = useFetch(() => assessmentService.detail(courseId), [courseId])

  const back = (
    <Button variant="bordered" size="sm" asChild className="mb-4">
      <Link to="/admin/assessments"><WiDirectionLeft className="size-5" /> {t("admin.assessmentDetail.back")}</Link>
    </Button>
  )

  if (loading) return <LoadingState />
  if (error) return <>{back}<ErrorState error={error} onRetry={reload} /></>

  const { summary: s, distribution, questions, students } = data
  const passed = students.filter((x) => x.passed).length

  return (
    <div className="space-y-8">
      <div>
        {back}
        <PageHeader title={s.courseTitle} description={`${s.quizTitle} · ${t("admin.assessmentDetail.passMark", { value: s.passMark })}`}>
          <Button variant="bordered" asChild><Link to={`/admin/courses/${s.courseId}/quiz`}>{t("admin.assessmentDetail.editQuiz")}</Link></Button>
        </PageHeader>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} tone="violet" label={t("admin.assessmentDetail.stats.students")} subtitle={t("admin.assessmentDetail.stats.studentsHint")} value={s.students} detail={t("admin.assessments.attemptCount", { count: s.attempts })} />
        <StatCard
          icon={Target}
          tone="green"
          label={t("admin.assessmentDetail.stats.passRate")}
          subtitle={t("admin.assessmentDetail.stats.passRateHint")}
          value={s.passRate == null ? "—" : `${s.passRate}%`}
          detail={t("admin.assessmentDetail.stats.passedOf", { passed, count: students.length })}
          detailTone={s.passRate != null && s.passRate >= 70 ? "up" : s.passRate != null && s.passRate < 40 ? "down" : "muted"}
        />
        <StatCard icon={TrendingUp} tone="sky" label={t("admin.assessmentDetail.stats.avgScore")} subtitle={t("admin.assessmentDetail.stats.avgScoreHint")} value={s.averageScore == null ? "—" : `${s.averageScore}%`} />
        <StatCard icon={ListChecks} tone="amber" label={t("admin.assessmentDetail.stats.questions")} subtitle={t("admin.assessmentDetail.stats.questionsHint")} value={s.questionCount} />
      </div>

      {s.attempts === 0 ? (
        <EmptyState icon={MdInsights} title={t("admin.assessmentDetail.empty")}>{t("admin.assessmentDetail.emptyHint")}</EmptyState>
      ) : (
        <>
          <ScoreDistribution bands={distribution} passMark={s.passMark} />

          <section className="space-y-3">
            <SectionTitle title={t("admin.assessmentDetail.questions.title")} description={t("admin.assessmentDetail.questions.description")} />
            <DataTable
              rows={questions}
              rowKey={(q) => q.questionId}
              columns={[
                {
                  key: "text",
                  label: t("admin.assessmentDetail.columns.question"),
                  render: (q, i) => (
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                      <span className="line-clamp-2 font-medium">{q.text}</span>
                    </div>
                  ),
                },
                { key: "type", label: t("admin.assessmentDetail.columns.type"), nowrap: true, render: (q) => <Tag className="bg-violet-500/12 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">{t(`admin.questionTypes.${q.type || "SINGLE_CHOICE"}`, { defaultValue: typeLabel(q.type) })}</Tag> },
                { key: "answered", label: t("admin.assessmentDetail.columns.answered"), nowrap: true, render: (q) => <span className="tabular-nums text-muted-foreground">{q.correct}/{q.answered}</span> },
                { key: "rate", label: t("admin.assessmentDetail.columns.correct"), className: "w-[30%]", render: (q) => <RateBar rate={q.correctRate} /> },
              ]}
            />
          </section>

          <section className="space-y-3">
            <SectionTitle title={t("admin.assessmentDetail.students.title")} description={t("admin.assessmentDetail.students.description")} />
            <DataTable
              rows={students}
              rowKey={(x) => x.userId}
              columns={[
                { key: "name", label: t("admin.assessmentDetail.columns.student"), render: (x) => <StudentCell student={x} /> },
                { key: "attempts", label: t("admin.assessmentDetail.columns.attempts"), nowrap: true, render: (x) => <span className="tabular-nums">{x.attempts}</span> },
                { key: "best", label: t("admin.assessmentDetail.columns.bestScore"), nowrap: true, render: (x) => <span className="font-semibold tabular-nums">{x.bestScore}%</span> },
                {
                  key: "result",
                  label: t("admin.assessmentDetail.columns.result"),
                  nowrap: true,
                  render: (x) =>
                    x.passed ? (
                      <Tag className="gap-1 bg-emerald-500/12 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"><RiCheckboxCircleFill className="size-3.5" /> {t("admin.assessmentDetail.passed")}</Tag>
                    ) : (
                      <Tag className="gap-1 bg-rose-500/12 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300"><BiSolidXCircle className="size-3.5" /> {t("admin.assessmentDetail.notPassed")}</Tag>
                    ),
                },
                { key: "last", label: t("admin.assessments.columns.lastAttempt"), nowrap: true, render: (x) => <span className="text-muted-foreground">{x.lastAttemptAt ? formatDate(x.lastAttemptAt) : "—"}</span> },
              ]}
            />
          </section>
        </>
      )}
    </div>
  )
}

function SectionTitle({ title, description }) {
  return (
    <div>
      <h2 className="text-base font-bold tracking-tight">{title}</h2>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  )
}

// Single-series bar chart: attempts per 10-point score band, with the pass mark marked.
// One hue (brand), thin bars with 4px rounded tops, 2px gaps, hover label per bar.
function ScoreDistribution({ bands, passMark }) {
  const { t } = useTranslation()
  const [hover, setHover] = useState(null)
  const max = Math.max(1, ...bands.map((b) => b.attempts))
  const total = bands.reduce((n, b) => n + b.attempts, 0)
  return (
    <section className="space-y-3">
      <SectionTitle title={t("admin.assessmentDetail.distribution.title")} description={t("admin.assessmentDetail.distribution.description", { total })} />
      <div className="rounded-xl border border-neutral-200/80 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        {/* pass-mark label sits above the plot so it never covers a bar */}
        <div className="relative mb-1 h-4 text-[11px] font-medium text-muted-foreground">
          <span className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${Math.min(passMark, 100)}%` }}>{t("admin.assessments.passMark", { value: passMark })}</span>
        </div>
        <div className="relative h-48">
          {/* recessive gridlines */}
          {[0.25, 0.5, 0.75, 1].map((f) => (
            <div key={f} className="absolute inset-x-0 border-t border-neutral-100 dark:border-neutral-800" style={{ bottom: `${f * 100}%` }} />
          ))}
          {/* pass mark */}
          <div
            className="absolute inset-y-0 z-10 border-l-2 border-dashed border-amber-500"
            style={{ left: `${Math.min(passMark, 100)}%` }}
            aria-hidden
          />
          <div className="absolute inset-0 flex items-end gap-[2px]" role="img" aria-label={t("admin.assessmentDetail.distribution.title")}>
            {bands.map((b, i) => (
              <div
                key={b.from}
                className="relative flex h-full flex-1 items-end"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              >
                <div
                  className={cn("mx-[18%] w-full rounded-t-[4px] bg-primary transition-opacity", hover != null && hover !== i && "opacity-40")}
                  style={{ height: `${(b.attempts / max) * 100}%`, minHeight: b.attempts ? 2 : 0 }}
                />
                {hover === i && (
                  <div className="absolute bottom-full left-1/2 z-20 mb-1 -translate-x-1/2 whitespace-nowrap rounded-lg border border-neutral-200/80 bg-white px-2.5 py-1.5 text-xs shadow-md dark:border-neutral-700 dark:bg-neutral-900">
                    <span className="font-semibold">{b.attempts}</span> {t("admin.assessmentDetail.distribution.attemptWord", { count: b.attempts })} · {b.from}–{b.to}%
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-2 flex gap-[2px] text-[11px] tabular-nums text-muted-foreground">
          {bands.map((b) => (
            <span key={b.from} className="flex-1 text-center">{b.from}</span>
          ))}
        </div>
      </div>
    </section>
  )
}

function RateBar({ rate }) {
  const { t } = useTranslation()
  if (rate == null) return <span className="text-muted-foreground">{t("admin.assessmentDetail.notAnswered")}</span>
  return (
    <div className="flex items-center gap-3">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
        <div className="h-full rounded-full bg-primary" style={{ width: `${rate}%` }} />
      </div>
      <span className={cn("w-12 rounded-full px-2 py-0.5 text-center text-xs font-semibold tabular-nums", rateTone(rate))}>{rate}%</span>
    </div>
  )
}

function StudentCell({ student }) {
  const { t } = useTranslation()
  const name = student.displayName || student.email || t("admin.assessmentDetail.columns.student")
  const initials = name.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("")
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      {student.avatarUrl ? (
        <img src={student.avatarUrl} alt="" className="size-8 shrink-0 rounded-full object-cover" />
      ) : (
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">{initials}</span>
      )}
      <div className="min-w-0 leading-tight">
        <p className="truncate font-medium">{name}</p>
        {student.email && student.email !== name && <p className="truncate text-xs text-muted-foreground">{student.email}</p>}
      </div>
    </div>
  )
}
