import { useMemo, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { Loader2, Link2, Check } from "lucide-react"
import { IoIosPlayCircle } from "react-icons/io"
import { IoBookmark } from "react-icons/io5"
import { MdAccessTimeFilled, MdWorkspacePremium, MdTaskAlt, MdSchool, MdBookmarks } from "react-icons/md"
import { BiSolidTrash } from "react-icons/bi"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CourseThumb, EmptyState, ErrorState, LoadingState } from "@/components/course/CourseBits"
import { normalizeEnrollment, formatDate, formatMinutes } from "@/lib/format"
import { useFetch } from "@/hooks/useFetch"
import { enrollmentService, toList } from "@/services/course.service"
import { certificateService } from "@/services/certificate.service"
import { bookmarkService } from "@/services/bookmark.service"
import { getErrorMessage } from "@/lib/api"
import { cn } from "@/lib/utils"
import { toast } from "@/lib/toast"
import { useTranslation } from "react-i18next"

const CARD = "rounded-2xl border border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-900"

// Where each enrollment belongs: nothing done yet / some done / all done
const stageOf = (e) => (e.status === "COMPLETED" || e.progress >= 100 ? "completed" : e.progress > 0 ? "in-progress" : "not-started")

// label: site.myLearning.tabs.<key>
const TABS = [
  { value: "in-progress", key: "inProgress" },
  { value: "not-started", key: "notStarted" },
  { value: "completed", key: "completed" },
  { value: "bookmarks", key: "bookmarks" },
  { value: "certificates", key: "certificates" },
]

export default function MyLearningPage() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const tab = TABS.some((x) => x.value === params.get("tab")) ? params.get("tab") : "in-progress"
  const setTab = (value) => setParams(value === "in-progress" ? {} : { tab: value }, { replace: true })

  const enrollments = useFetch(() => enrollmentService.mine(), [])
  const certs = useFetch(() => certificateService.mine(), [])
  const bookmarks = useFetch(() => bookmarkService.mine(), [])

  const items = useMemo(() => toList(enrollments.data).map(normalizeEnrollment), [enrollments.data])
  const certByCourse = useMemo(() => new Map((certs.data ?? []).map((c) => [c.courseId, c])), [certs.data])
  const groups = useMemo(() => {
    const g = { "in-progress": [], "not-started": [], completed: [] }
    items.forEach((e) => g[stageOf(e)].push(e))
    return g
  }, [items])
  const counts = { ...Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, v.length])), bookmarks: bookmarks.data?.length ?? 0, certificates: certs.data?.length ?? 0 }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">{t("site.myLearning.title")}</h1>
      <p className="mt-1 text-muted-foreground">{t("site.myLearning.subtitle")}</p>

      {/* Tabs */}
      <div className="mt-6 mb-5 flex gap-1 overflow-x-auto rounded-xl border border-neutral-200/80 bg-neutral-100/70 p-1 sm:w-fit dark:border-neutral-800 dark:bg-neutral-900">
        {TABS.map((item) => (
          <button
            key={item.value}
            onClick={() => setTab(item.value)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
              tab === item.value && "bg-white text-foreground shadow-sm dark:bg-neutral-800"
            )}
          >
            {t(`site.myLearning.tabs.${item.key}`)}
            <span
              className={cn(
                "rounded-full px-1.5 text-[11px] font-semibold tabular-nums",
                tab === item.value ? "bg-primary text-primary-foreground" : "bg-neutral-200 text-muted-foreground dark:bg-neutral-800"
              )}
            >
              {counts[item.value]}
            </span>
          </button>
        ))}
      </div>

      {tab === "bookmarks" ? (
        <BookmarksTab state={bookmarks} />
      ) : tab === "certificates" ? (
        <CertificatesTab state={certs} />
      ) : enrollments.loading ? (
        <LoadingState />
      ) : enrollments.error ? (
        <ErrorState error={enrollments.error} onRetry={enrollments.reload} />
      ) : groups[tab].length === 0 ? (
        <EmptyState
          icon={tab === "completed" ? MdTaskAlt : MdSchool}
          title={
            !items.length ? t("site.shared.notEnrolled")
              : tab === "completed" ? t("site.myLearning.empty.completed")
                : tab === "not-started" ? t("site.myLearning.empty.notStarted")
                  : t("site.myLearning.empty.inProgress")
          }
        >
          <Link to="/courses" className="text-primary hover:underline">{t("site.shared.browseCourses")}</Link>
        </EmptyState>
      ) : (
        <ul className="grid gap-3">
          {groups[tab].map((e) => (
            <EnrollmentRow key={e.courseId} item={e} stage={tab} certificate={certByCourse.get(e.courseId)} onCertificate={certs.reload} />
          ))}
        </ul>
      )}
    </div>
  )
}

function EnrollmentRow({ item: e, stage, certificate, onCertificate }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [claiming, setClaiming] = useState(false)
  const learnPath = `/courses/${e.courseId}/learn${e.nextLessonId ? `/${e.nextLessonId}` : ""}`

  const claim = async () => {
    setClaiming(true)
    try {
      const c = await certificateService.claim(e.courseId)
      toast.success(t("site.shared.certificateIssued"), e.title)
      onCertificate()
      navigate(`/certificates/${c.serialNo}`)
    } catch (err) {
      // e.g. "Pass the final quiz to earn the certificate"
      toast.error(t("site.shared.notYet"), getErrorMessage(err, t("site.myLearning.claimFailed")))
      setClaiming(false)
    }
  }

  return (
    <li className={cn(CARD, "flex flex-col gap-4 p-3 sm:flex-row sm:items-center")}>
      <Link to={`/courses/${e.courseId}`} className="block w-full shrink-0 overflow-hidden rounded-xl bg-[#f5f5f5] sm:w-36 dark:bg-neutral-800">
        <CourseThumb course={{ id: e.courseId, ...e }} className="aspect-[16/10] object-contain p-2 mix-blend-multiply dark:mix-blend-normal" iconClassName="size-6" />
      </Link>
      <div className="min-w-0 flex-1 px-1 sm:px-0">
        <Link to={`/courses/${e.courseId}`} className="block truncate font-semibold hover:text-primary hover:underline">{e.title}</Link>
        {e.instructorName && <p className="truncate text-xs text-muted-foreground">{t("site.shared.by", { name: e.instructorName })}</p>}
        <div className="mt-2.5 flex items-center gap-3">
          <Progress value={e.progress} className="h-1.5" />
          <span className="w-10 shrink-0 text-right text-xs font-medium tabular-nums text-muted-foreground">{e.progress}%</span>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2 px-1 pb-1 sm:px-0 sm:pb-0">
        {stage === "completed" ? (
          <>
            {certificate ? (
              <Button size="lg" asChild>
                <Link to={`/certificates/${certificate.serialNo}`}><MdWorkspacePremium className="size-4" /> {t("site.shared.viewCertificate")}</Link>
              </Button>
            ) : (
              <Button size="lg" onClick={claim} disabled={claiming}>
                {claiming ? <Loader2 className="animate-spin" /> : <MdWorkspacePremium className="size-4" />} {t("site.shared.getCertificate")}
              </Button>
            )}
            <Button size="lg" variant="bordered" asChild><Link to={learnPath}>{t("site.myLearning.review")}</Link></Button>
          </>
        ) : (
          <Button size="lg" asChild>
            <Link to={learnPath}><IoIosPlayCircle className="size-4" /> {stage === "not-started" ? t("common.actions.start") : t("common.actions.continue")}</Link>
          </Button>
        )}
      </div>
    </li>
  )
}

function BookmarksTab({ state }) {
  const { data, loading, error, reload } = state
  const [removing, setRemoving] = useState(null)
  const { t } = useTranslation()
  if (loading) return <LoadingState />
  if (error) return <ErrorState error={error} onRetry={reload} />
  if (!data?.length) return <EmptyState icon={MdBookmarks} title={t("site.myLearning.bookmarks.emptyTitle")}>{t("site.myLearning.bookmarks.emptyText")}</EmptyState>

  const remove = async (b) => {
    setRemoving(b.lessonId)
    try {
      await bookmarkService.remove(b.lessonId)
      toast.success(t("site.myLearning.bookmarks.removed"))
      reload()
    } catch (err) {
      toast.error(t("site.myLearning.bookmarks.removeFailed"), err)
    } finally {
      setRemoving(null)
    }
  }

  return (
    <ul className={cn(CARD, "divide-y divide-neutral-200/80 overflow-hidden dark:divide-neutral-800")}>
      {data.map((b) => (
        <li key={b.lessonId} className="flex items-center gap-3 p-3 sm:gap-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <IoBookmark className="size-5" />
          </span>
          <Link to={`/courses/${b.courseId}/learn/${b.lessonId}`} className="group min-w-0 flex-1">
            <p className="truncate font-semibold group-hover:text-primary group-hover:underline">{b.lessonTitle}</p>
            <p className="truncate text-xs text-muted-foreground">
              {b.courseTitle} › {b.sectionTitle}
              {b.durationMinutes ? <> · <MdAccessTimeFilled className="-mt-0.5 inline size-3.5" /> {formatMinutes(b.durationMinutes)}</> : null}
            </p>
          </Link>
          <Button size="sm" variant="bordered" asChild className="hidden sm:inline-flex">
            <Link to={`/courses/${b.courseId}/learn/${b.lessonId}`}><IoIosPlayCircle className="size-4" /> {t("site.myLearning.bookmarks.open")}</Link>
          </Button>
          <Button
            size="icon"
            variant="bordered"
            className="size-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-500/10"
            disabled={removing === b.lessonId}
            onClick={() => remove(b)}
            aria-label={t("site.myLearning.bookmarks.remove")}
            title={t("site.myLearning.bookmarks.remove")}
          >
            {removing === b.lessonId ? <Loader2 className="animate-spin" /> : <BiSolidTrash className="size-4" />}
          </Button>
        </li>
      ))}
    </ul>
  )
}

function CertificatesTab({ state }) {
  const { data, loading, error, reload } = state
  const { t } = useTranslation()
  if (loading) return <LoadingState />
  if (error) return <ErrorState error={error} onRetry={reload} />
  if (!data?.length) {
    return <EmptyState icon={MdWorkspacePremium} title={t("site.myLearning.certificates.emptyTitle")}>{t("site.myLearning.certificates.emptyText")}</EmptyState>
  }
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {data.map((c) => (
        <CertificateCard key={c.serialNo} cert={c} />
      ))}
    </ul>
  )
}

function CertificateCard({ cert }) {
  const [copied, setCopied] = useState(false)
  const { t } = useTranslation()
  const url =`${window.location.origin}/certificates/${cert.serialNo}`
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { /* clipboard blocked */ }
  }
  return (
    <li className={cn(CARD, "relative overflow-hidden p-5")}>
      <span className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-primary/6" />
      <div className="relative flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
          <MdWorkspacePremium className="size-6" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("site.shared.certificateOfCompletion")}</p>
          <p className="mt-0.5 truncate font-bold">{cert.courseTitle}</p>
          <p className="text-xs text-muted-foreground">
            {t("site.myLearning.certificates.issued", { date: formatDate(cert.issuedAt) })}
            {cert.quizScore != null && <> · {t("site.myLearning.certificates.quiz", { score: cert.quizScore })}</>}
          </p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">{cert.serialNo}</p>
        </div>
      </div>
      <div className="relative mt-4 flex gap-2">
        <Button size="sm" asChild><Link to={`/certificates/${cert.serialNo}`}>{t("common.actions.view")}</Link></Button>
        <Button size="sm" variant="bordered" onClick={copy}>
          {copied ? <Check /> : <Link2 />} {copied ? t("common.actions.copied") : t("common.actions.copyLink")}
        </Button>
      </div>
    </li>
  )
}
