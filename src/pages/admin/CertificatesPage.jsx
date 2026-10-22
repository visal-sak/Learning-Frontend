import { useMemo, useState } from "react"
import { CountBadge } from "@/components/ui/count-badge"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Search, Download, ExternalLink, Link2, Check } from "lucide-react"
import { MdWorkspacePremium, MdHourglassTop, MdCalendarMonth } from "react-icons/md"
import { HiUsers } from "react-icons/hi"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { PageHeader } from "@/components/admin/AdminUI"
import { DataTable, Tag } from "@/components/admin/DataTable"
import { StatCard } from "@/components/StatCard"
import { EmptyState, ErrorState, LoadingState } from "@/components/course/CourseBits"
import { useFetch } from "@/hooks/useFetch"
import { certificateService } from "@/services/certificate.service"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"

const TABS = ["issued", "awaiting", "courses"]

const REASON_TONE = {
  QUIZ_NOT_TAKEN: "bg-sky-500/12 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
  QUIZ_NOT_PASSED: "bg-rose-500/12 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
  NOT_CLAIMED: "bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
}

const initials = (name = "") => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?"

// Certificate tracking: who has a certificate, who finished a course but isn't certified yet, and totals per course
export default function CertificatesPage() {
  const { t } = useTranslation()
  const { data, loading, error, reload } = useFetch(() => certificateService.tracking(), [])
  const [tab, setTab] = useState("issued")
  const [q, setQ] = useState("")
  const [courseId, setCourseId] = useState("")

  const match = (r) => {
    if (courseId && r.courseId !== courseId) return false
    const s = q.trim().toLowerCase()
    return !s || [r.studentName, r.email, r.serialNo, r.courseTitle].some((v) => v?.toLowerCase().includes(s))
  }
  const issued = useMemo(() => (data?.certificates ?? []).filter(match), [data, q, courseId]) // eslint-disable-line react-hooks/exhaustive-deps
  const awaiting = useMemo(() => (data?.awaiting ?? []).filter(match), [data, q, courseId]) // eslint-disable-line react-hooks/exhaustive-deps
  const courses = useMemo(() => (data?.courses ?? []).filter((c) => !courseId || c.courseId === courseId), [data, courseId])

  const exportCsv = () => {
    const rows = tab === "awaiting"
      ? [[t("admin.certificates.columns.student"), "Email", t("admin.certificates.columns.course"), t("admin.certificates.columns.finished"), t("admin.certificates.columns.quiz"), t("admin.certificates.columns.status")],
        ...awaiting.map((r) => [r.studentName, r.email, r.courseTitle, r.finishedAt ?? "", r.bestQuizScore ?? "", t(`admin.certificates.reasons.${r.reason}`)])]
      : [[t("admin.certificates.columns.student"), "Email", t("admin.certificates.columns.course"), t("admin.certificates.columns.score"), t("admin.certificates.columns.issued"), t("admin.certificates.columns.serial")],
        ...issued.map((r) => [r.studentName, r.email ?? "", r.courseTitle, r.quizScore ?? "", r.issuedAt, r.serialNo])]
    const csv = rows.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n")
    const a = document.createElement("a")
    a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }))
    a.download = `certificates-${tab === "awaiting" ? "awaiting" : "issued"}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  if (loading) return <LoadingState />
  if (error) return <ErrorState error={error} onRetry={reload} />

  const s = data.summary
  const counts = { issued: issued.length, awaiting: awaiting.length, courses: courses.length }

  return (
    <>
      <PageHeader title={t("admin.certificates.title")} description={t("admin.certificates.description")}>
        {tab !== "courses" && (
          <Button variant="bordered" size="sm" onClick={exportCsv} disabled={!(tab === "issued" ? issued : awaiting).length}>
            <Download /> {t("admin.certificates.export")}
          </Button>
        )}
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={MdWorkspacePremium} tone="yellow" label={t("admin.certificates.stats.issued")} subtitle={t("admin.certificates.stats.issuedSub")} value={s.issued} />
        <StatCard icon={MdCalendarMonth} tone="green" label={t("admin.certificates.stats.month")} subtitle={t("admin.certificates.stats.monthSub")} value={s.issuedThisMonth} />
        <StatCard icon={HiUsers} tone="violet" label={t("admin.certificates.stats.finished")} subtitle={t("admin.certificates.stats.finishedSub")} value={s.finishedStudents} />
        <StatCard
          icon={MdHourglassTop}
          tone="amber"
          label={t("admin.certificates.stats.awaiting")}
          subtitle={t("admin.certificates.stats.awaitingSub")}
          value={s.awaiting}
          detail={s.awaiting ? t("admin.certificates.stats.needsAttention") : null}
          detailTone="down"
        />
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl border border-neutral-200/80 bg-neutral-100/70 p-1 dark:border-neutral-800 dark:bg-neutral-900">
          {TABS.map((x) => (
            <button
              key={x}
              onClick={() => setTab(x)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                tab === x && "bg-white text-foreground shadow-sm dark:bg-neutral-800"
              )}
            >
              {t(`admin.certificates.tabs.${x}`)}
              <CountBadge active={tab === x}>{counts[x]}</CountBadge>
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {tab !== "courses" && (
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("admin.certificates.search")} className="h-9 pl-9 sm:w-72" />
            </div>
          )}
          <NativeSelect value={courseId} onChange={(e) => setCourseId(e.target.value)} className="h-9 sm:w-60" aria-label={t("admin.certificates.columns.course")}>
            <option value="">{t("admin.certificates.allCourses")}</option>
            {(data.courses ?? []).map((c) => <option key={c.courseId} value={c.courseId}>{c.courseTitle}</option>)}
          </NativeSelect>
        </div>
      </div>

      {tab === "issued" && <IssuedTable rows={issued} />}
      {tab === "awaiting" && <AwaitingTable rows={awaiting} />}
      {tab === "courses" && <CourseTable rows={courses} />}
    </>
  )
}

function Student({ name, email }) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{initials(name)}</span>
      <span className="min-w-0 leading-tight">
        <span className="block truncate font-semibold">{name}</span>
        {email && <span className="block truncate text-xs text-muted-foreground">{email}</span>}
      </span>
    </span>
  )
}

function CourseLink({ id, title }) {
  return id ? (
    <Link to={`/admin/courses/${id}`} className="block max-w-64 truncate hover:text-primary hover:underline">{title}</Link>
  ) : (
    <span className="block max-w-64 truncate">{title}</span>
  )
}

function IssuedTable({ rows }) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(null)
  if (!rows.length) return <EmptyState icon={MdWorkspacePremium} title={t("admin.certificates.emptyIssued")}>{t("admin.certificates.emptyIssuedHint")}</EmptyState>

  const copy = async (serial) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/certificates/${serial}`)
      setCopied(serial)
      setTimeout(() => setCopied(null), 1500)
    } catch { /* clipboard blocked */ }
  }

  return (
    <DataTable
      rows={rows}
      rowKey={(r) => r.serialNo}
      columns={[
        { key: "student", label: t("admin.certificates.columns.student"), render: (r) => <Student name={r.studentName} email={r.email} /> },
        { key: "course", label: t("admin.certificates.columns.course"), render: (r) => <CourseLink id={r.courseId} title={r.courseTitle} /> },
        {
          key: "score",
          label: t("admin.certificates.columns.score"),
          nowrap: true,
          render: (r) => (r.quizScore == null ? <span className="text-muted-foreground">—</span> : <Tag className="bg-emerald-500/12 text-emerald-700 tabular-nums dark:bg-emerald-500/20 dark:text-emerald-300">{r.quizScore}%</Tag>),
        },
        { key: "issued", label: t("admin.certificates.columns.issued"), nowrap: true, render: (r) => <span className="text-muted-foreground">{formatDate(r.issuedAt)}</span> },
        { key: "serial", label: t("admin.certificates.columns.serial"), nowrap: true, render: (r) => <span className="font-mono text-xs">{r.serialNo}</span> },
        {
          key: "actions",
          label: t("admin.shared.actions"),
          align: "right",
          render: (r) => (
            <div className="flex justify-end gap-1.5">
              <Button size="icon" variant="ghost" className="size-8" onClick={() => copy(r.serialNo)} aria-label={t("common.actions.copyLink")} title={t("common.actions.copyLink")}>
                {copied === r.serialNo ? <Check /> : <Link2 />}
              </Button>
              <Button size="sm" variant="bordered" asChild>
                <a href={`/certificates/${r.serialNo}`} target="_blank" rel="noreferrer"><ExternalLink className="size-4" /> {t("common.actions.view")}</a>
              </Button>
            </div>
          ),
        },
      ]}
    />
  )
}

function AwaitingTable({ rows }) {
  const { t } = useTranslation()
  if (!rows.length) return <EmptyState icon={MdWorkspacePremium} title={t("admin.certificates.emptyAwaiting")}>{t("admin.certificates.emptyAwaitingHint")}</EmptyState>
  return (
    <DataTable
      rows={rows}
      rowKey={(r) => `${r.userId}:${r.courseId}`}
      columns={[
        { key: "student", label: t("admin.certificates.columns.student"), render: (r) => <Student name={r.studentName} email={r.email} /> },
        { key: "course", label: t("admin.certificates.columns.course"), render: (r) => <CourseLink id={r.courseId} title={r.courseTitle} /> },
        { key: "finished", label: t("admin.certificates.columns.finished"), nowrap: true, render: (r) => <span className="text-muted-foreground">{r.finishedAt ? formatDate(r.finishedAt) : "—"}</span> },
        {
          key: "quiz",
          label: t("admin.certificates.columns.quiz"),
          nowrap: true,
          render: (r) =>
            r.passMark == null ? (
              <span className="text-muted-foreground">{t("admin.certificates.noQuiz")}</span>
            ) : (
              <span className="tabular-nums">
                <span className="font-semibold">{r.bestQuizScore == null ? "—" : `${r.bestQuizScore}%`}</span>
                <span className="text-xs text-muted-foreground"> / {r.passMark}% · {t("admin.certificates.attempts", { count: r.attempts })}</span>
              </span>
            ),
        },
        { key: "status", label: t("admin.certificates.columns.status"), nowrap: true, render: (r) => <Tag className={REASON_TONE[r.reason]}>{t(`admin.certificates.reasons.${r.reason}`)}</Tag> },
      ]}
    />
  )
}

function CourseTable({ rows }) {
  const { t } = useTranslation()
  if (!rows.length) return <EmptyState icon={MdWorkspacePremium} title={t("admin.certificates.emptyCourses")} />
  return (
    <DataTable
      rows={rows}
      rowKey={(r) => r.courseId}
      columns={[
        {
          key: "course",
          label: t("admin.certificates.columns.course"),
          render: (r) => (
            <span className="block min-w-0 leading-tight">
              <CourseLink id={r.courseId} title={r.courseTitle} />
              <span className="block truncate text-xs text-muted-foreground">{r.instructorName}{!r.hasQuiz && ` · ${t("admin.certificates.noQuiz")}`}</span>
            </span>
          ),
        },
        { key: "enrolled", label: t("admin.certificates.columns.enrolled"), nowrap: true, render: (r) => <span className="tabular-nums">{r.enrolled}</span> },
        { key: "finished", label: t("admin.certificates.columns.finishedCount"), nowrap: true, render: (r) => <span className="tabular-nums">{r.finished}</span> },
        { key: "certified", label: t("admin.certificates.columns.certified"), nowrap: true, render: (r) => <span className="font-semibold tabular-nums text-primary">{r.certified}</span> },
        {
          key: "awaiting",
          label: t("admin.certificates.columns.awaiting"),
          nowrap: true,
          render: (r) => (r.awaiting ? <Tag className={REASON_TONE.NOT_CLAIMED}>{r.awaiting}</Tag> : <span className="text-muted-foreground">0</span>),
        },
        {
          key: "rate",
          label: t("admin.certificates.columns.rate"),
          render: (r) => {
            const pct = r.enrolled ? Math.round((r.certified / r.enrolled) * 100) : 0
            return (
              <span className="flex min-w-32 items-center gap-2">
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                  <span className="block h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </span>
                <span className="w-9 text-right text-xs font-semibold tabular-nums">{pct}%</span>
              </span>
            )
          },
        },
      ]}
    />
  )
}
