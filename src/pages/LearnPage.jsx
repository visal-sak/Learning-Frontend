import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { WiDirectionLeft } from "react-icons/wi"
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom"
import { ChevronDown, ChevronLeft, ChevronRight, CheckCircle2, Circle, Loader2, ListVideo, X, Paperclip, Download, Trophy, ListChecks } from "lucide-react"
import { TiLockClosed } from "react-icons/ti"
import { IoIosPlayCircle } from "react-icons/io"
import { HiCheckCircle } from "react-icons/hi"
import { MdAccessTimeFilled, MdWorkspacePremium } from "react-icons/md"
import { Button } from "@/components/ui/button"
import Loader from "@/components/ui/loader"
import { Progress } from "@/components/ui/progress"
import { EmptyState, ErrorState, LoadingState } from "@/components/course/CourseBits"
import { FormError } from "@/components/auth/FormField"
import { useFetch } from "@/hooks/useFetch"
import { useEnrollGate } from "@/hooks/useEnrollGate"
import { bookmarkService } from "@/services/bookmark.service"
import { IoBookmark, IoBookmarkOutline } from "react-icons/io5"
import { useAuthStore } from "@/store"
import { courseService, contentService, enrollmentService } from "@/services/course.service"
import { getErrorMessage } from "@/lib/api"
import { flattenLessons, formatBytes, formatMinutes, getLessonMedia, lessonAccess, lockReason } from "@/lib/format"
import { cn } from "@/lib/utils"
import { toast } from "@/lib/toast"
import Navbar from "@/components/sections/Navbar"
import LessonTools from "@/components/course/LessonTools"
import LessonBlocks from "@/components/lesson/LessonBlocks"
import LessonCheck from "@/components/lesson/LessonCheck"
import { useVideoClock } from "@/hooks/useVideoClock"
import { MdQuiz, MdEmojiEvents, MdVideoLibrary } from "react-icons/md"

// Lessons listed in the sidebar before it collapses behind "Show all"
const VISIBLE_LESSONS = 7

export default function LearnPage() {
  const { id, lessonId } = useParams()
  const isAuthed = useAuthStore((s) => !!s.accessToken)
  const { data: course, loading, error, reload } = useFetch(() => courseService.get(id), [id, isAuthed])
  const allLessons = useMemo(() => flattenLessons(course), [course])

  // Local overrides on top of the API's `completed` flags, so ticking a lesson updates the UI instantly
  const [overrides, setOverrides] = useState({})
  const completed = useMemo(
    () => new Set(allLessons.filter((l) => overrides[l.id] ?? l.completed).map((l) => l.id)),
    [allLessons, overrides]
  )
  // Lessons unlock one by one: each stays locked (no click, no video) until the previous one is completed.
  // A locked lesson URL redirects to the first unfinished lesson below.
  const enrolled = !!course?.enrolled
  const lessons = useMemo(
    () => lessonAccess(allLessons, { enrolled, isDone: (l) => completed.has(l.id) }),
    [allLessons, completed, enrolled]
  )
  const setDone = (lessonId, done) => setOverrides((o) => ({ ...o, [lessonId]: done }))

  if (loading) return <LoadingState />
  if (error) return <ErrorState error={error} onRetry={reload} className="py-40" />

  const canLearn = course.enrolled || course.editable
  if (!canLearn && !lessons.some((l) => l.preview)) return <Navigate to={`/courses/${id}`} replace />

  // No lesson in the URL, or a lesson that is still locked → resume at the first unfinished lesson
  const requested = lessons.find((l) => l.id === lessonId)
  if (!lessonId || requested?.locked) {
    const next = lessons.find((l) => !l.locked && !completed.has(l.id)) ?? lessons.find((l) => !l.locked)
    if (!next) return <EmptyCourse course={course} />
    return <Navigate to={`/courses/${id}/learn/${next.id}`} replace />
  }

  return (
    <Player
      course={course}
      lessons={lessons}
      lessonId={lessonId}
      completed={completed}
      setDone={setDone}
      onEnrolled={reload}
    />
  )
}

function Player({ course, lessons, lessonId, completed, setDone, onEnrolled }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const gate = useEnrollGate(course)
  const unlock = (l) => {
    setSidebarOpen(false)
    gate(`/courses/${course.id}/learn/${l.id}`, { onEnrolled })
  }
  const index = lessons.findIndex((l) => l.id === lessonId)
  const current = lessons[index]
  const prev = lessons.slice(0, Math.max(index, 0)).reverse().find((l) => !l.locked)
  // "Next lesson" completes the current lesson first, so only the API lock matters here (not the sequential gate)
  const next = lessons.slice(index + 1).find((l) => !l.locked || l.gated)
  // Server percent (from the course, then from each complete/uncomplete response) beats the local estimate
  const [serverProgress, setServerProgress] = useState({ percent: course.percentComplete ?? null, courseCompleted: false, certificateSerial: null })

  // Bookmarked lessons (signed-in users); toggled optimistically
  const isAuthed = useAuthStore((s) => !!s.accessToken)
  const { data: savedList } = useFetch(() => (isAuthed ? bookmarkService.mine() : Promise.resolve([])), [isAuthed])
  const [saved, setSaved] = useState(null)
  const bookmarked = saved ?? new Set((savedList ?? []).map((b) => b.lessonId))
  const toggleBookmark = async (lessonId) => {
    const on = !bookmarked.has(lessonId)
    const next = new Set(bookmarked)
    on ? next.add(lessonId) : next.delete(lessonId)
    setSaved(next)
    try {
      on ? await bookmarkService.add(lessonId) : await bookmarkService.remove(lessonId)
      toast.success(t(on ? "learn.bookmark.added" : "learn.bookmark.removed"), on ? t("learn.player.bookmarkHint") : undefined)
    } catch (err) {
      setSaved(bookmarked) // roll back
      toast.error(t("learn.player.bookmarkFailed"), err)
    }
  }
  const progress = serverProgress.percent ?? (lessons.length ? Math.round((completed.size / lessons.length) * 100) : 0)

  const byId = useMemo(() => new Map(lessons.map((l, i) => [l.id, { ...l, index: i }])), [lessons])
  // Collapsed curriculum: the first lessons (always reaching one past the current lesson), plus one row under a blur
  const visibleCount = Math.max(VISIBLE_LESSONS, index + 2)
  const collapsible = lessons.length > visibleCount
  const collapsed = collapsible && !showAll

  const goTo = (l) => {
    setSidebarOpen(false)
    navigate(`/courses/${course.id}/learn/${l.id}`)
  }

  return (
    // Fixed to the viewport: the page itself never scrolls — the lesson and the curriculum each scroll on their own
    <div className="flex h-dvh flex-col overflow-hidden">
      <Navbar />
      {/* lesson + course card as one centred group, aligned with the navbar container */}
      {/* same container and side padding as the navbar: lesson starts under the logo, course card ends under the avatar */}
      <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 gap-6 px-4 sm:px-6">
        {/* the lesson scrolls on its own; the scrollbar sits in the gap beside the course card */}
        <main className="min-w-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable] lg:-mr-3 lg:pr-3">
          {/* no bar: just back + progress, lined up with the video */}
          <div className="flex items-center gap-3 pt-4">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/courses/${course.id}`}>
                <WiDirectionLeft className="size-5" />
                <span className="sm:hidden">{t("learn.player.back")}</span>
                <span className="hidden sm:inline">{t("learn.player.backToCourse")}</span>
              </Link>
            </Button>
            <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-3 sm:max-w-80">
              {course.enrolled && (
                <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                  {t("learn.player.itemsProgress", { done: completed.size, total: lessons.length })}
                </span>
              )}
              <Progress value={progress} className="h-1.5 w-24 sm:w-28" />
              <span className="w-9 shrink-0 text-right text-xs font-semibold tabular-nums">{progress}%</span>
            </div>
            <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)} aria-label={t("learn.player.lessons")}>
              <ListVideo /> <span className="hidden sm:inline">{t("learn.player.lessons")}</span>
            </Button>
          </div>
          {current ? (
            <LessonView
              key={current.id}
              lesson={current}
              done={completed.has(current.id)}
              onToggleDone={(done, res) => {
                setDone(current.id, done)
                if (res?.percentComplete != null)
                  setServerProgress((p) => ({
                    percent: res.percentComplete,
                    courseCompleted: !!res.courseCompleted,
                    certificateSerial: res.certificateSerial ?? p.certificateSerial,
                  }))
              }}
              onSynced={(done) => setDone(current.id, done)}
              courseCompleted={serverProgress.courseCompleted}
              certificateSerial={serverProgress.certificateSerial}
              bookmarked={bookmarked.has(current.id)}
              onToggleBookmark={isAuthed ? () => toggleBookmark(current.id) : undefined}
              courseId={course.id}
              hasFinalQuiz={course.finalQuizQuestions !== 0}
              enrolled={!!course.enrolled}
              onEnroll={() => gate(`/courses/${course.id}/learn/${current.id}`, { ask: false, onEnrolled })}
              prev={prev}
              next={next}
              goTo={goTo}
            />
          ) : (
            <div className="px-6 py-24 text-center text-muted-foreground">{t("learn.player.notFound")}</div>
          )}
        </main>

        {/* Curriculum: fixed column on desktop, slide-over on mobile */}
        {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}
        <aside
          className={cn(
            // mobile: slide-over panel; desktop: a right-hand column holding a floating card
            "fixed inset-y-0 right-0 z-50 w-80 max-w-[85vw] translate-x-full border-l border-neutral-200/80 bg-white transition-transform dark:border-neutral-800 dark:bg-neutral-900",
            "lg:static lg:z-auto lg:flex lg:w-[360px] lg:max-w-none lg:shrink-0 lg:translate-x-0 lg:flex-col lg:border-0 lg:bg-transparent lg:py-4 lg:dark:bg-transparent",
            sidebarOpen && "translate-x-0"
          )}
        >
          {/* the card: scrolls on its own; header stays pinned while the lessons scroll under it */}
          <div className="h-full min-h-0 overflow-y-auto overscroll-contain lg:h-auto lg:rounded-2xl lg:border lg:border-neutral-200/80 lg:bg-white lg:shadow-[0_8px_30px_-12px_rgb(0_0_0/0.12)] lg:dark:border-neutral-800 lg:dark:bg-neutral-900">
            {/* stays at the top while the lesson list scrolls under it */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200/80 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-sm font-semibold">{t("learn.player.courseContent")}</p>
              <Button variant="ghost" size="icon" className="size-8 lg:hidden" onClick={() => setSidebarOpen(false)} aria-label={t("learn.player.close")}>
                <X />
              </Button>
            </div>
            <div className="relative">
              {course.sections?.map((s) => {
                const rows = (s.lessons ?? []).map((raw) => byId.get(raw.id) ?? raw).filter((l) => !collapsed || l.index <= visibleCount)
                if (!rows.length) return null
                return (
                  <div key={s.id}>
                    <SectionHeader title={s.title} lessons={s.lessons ?? []} completed={completed} showProgress={!!course.enrolled} />
                    <ul>
                      {rows.map((l) => {
                        const active = l.id === lessonId
                        const done = completed.has(l.id)
                        return (
                          <li key={l.id}>
                            <button
                              // needs-enroll lessons stay clickable (login / enroll dialog); in-order locks do not
                              disabled={l.locked && !l.needsEnroll}
                              title={lockReason(l)}
                              onClick={() => (l.needsEnroll ? unlock(l) : goTo(l))}
                              className={cn(
                                "flex w-full items-start gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-accent/60 disabled:cursor-not-allowed disabled:opacity-50",
                                l.needsEnroll && "text-muted-foreground",
                                active && "bg-accent"
                              )}
                            >
                              {l.locked ? (
                                <TiLockClosed className="mt-px size-[18px] shrink-0 text-muted-foreground" />
                              ) : done ? (
                                <HiCheckCircle className="mt-px size-[18px] shrink-0 text-primary" />
                              ) : l.kind === "QUIZ" ? (
                                <MdQuiz className={cn("mt-px size-[18px] shrink-0", active ? "text-primary" : "text-amber-500")} />
                              ) : active ? (
                                <IoIosPlayCircle className="mt-px size-[18px] shrink-0 text-primary" />
                              ) : (
                                <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                              )}
                              <span className="flex-1">{l.title}</span>
                              <span className="shrink-0 text-xs text-muted-foreground">
                                {l.kind === "QUIZ" ? t("learn.player.questions", { count: l.questionCount ?? 0 }) : formatMinutes(l.durationMinutes)}
                              </span>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )
              })}

              {course.finalQuizQuestions > 0 && !collapsed && (
                <FinalQuizRow course={course} unlocked={completed.size >= lessons.length && lessons.length > 0} />
              )}

              {collapsed && (
                // blur + fade over the extra last row, like the course page table
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14">
                  <div
                    className="absolute inset-0 backdrop-blur-[3px]"
                    style={{ maskImage: "linear-gradient(to bottom, transparent, black 70%)", WebkitMaskImage: "linear-gradient(to bottom, transparent, black 70%)" }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/70 to-white dark:via-neutral-900/70 dark:to-neutral-900" />
                </div>
              )}
            </div>

            {collapsible && (
              <div className="flex justify-center px-4 py-3">
                <Button variant="outline" size="sm" onClick={() => setShowAll((v) => !v)}>
                  {showAll ? t("learn.player.showLess") : t("learn.player.showAll", { count: lessons.length })}
                  <ChevronDown className={cn("transition-transform duration-200", showAll && "rotate-180")} />
                </Button>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

// Final quiz: always last in the curriculum; opens once every lesson and quiz item is complete
function FinalQuizRow({ course, unlocked }) {
  const { t } = useTranslation()
  const body = (
    <>
      <MdEmojiEvents className={cn("mt-px size-[18px] shrink-0", unlocked ? "text-amber-500" : "text-muted-foreground")} />
      <span className="flex-1 font-medium">{t("learn.player.finalQuiz")}</span>
      <span className="shrink-0 text-xs text-muted-foreground">{t("learn.player.questions", { count: course.finalQuizQuestions })}</span>
    </>
  )
  return (
    <div className="border-t border-neutral-200/80 dark:border-neutral-800">
      {unlocked ? (
        <Link to={`/courses/${course.id}/quiz`} className="flex w-full items-start gap-3 bg-amber-500/[0.06] px-4 py-3 text-sm transition-colors hover:bg-amber-500/10">{body}</Link>
      ) : (
        <div title={t("learn.player.finalQuizLocked")} className="flex w-full cursor-not-allowed items-start gap-3 px-4 py-3 text-sm opacity-60">{body}</div>
      )}
    </div>
  )
}

// Section title in the sidebar, with "done/total" and a small bar for enrolled learners
function SectionHeader({ title, lessons, completed, showProgress }) {
  const done = lessons.filter((l) => completed.has(l.id)).length
  const total = lessons.length
  const pct = total ? Math.round((done / total) * 100) : 0
  return (
    <div className="bg-muted/50 px-4 py-2">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
        {showProgress && total > 0 && (
          <span className={cn("shrink-0 text-[11px] font-semibold tabular-nums", done === total ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
            {done}/{total}
          </span>
        )}
      </div>
      {showProgress && total > 0 && (
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
          <div className={cn("h-full rounded-full transition-[width] duration-300", done === total ? "bg-emerald-500" : "bg-primary")} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  )
}

function LessonView({ hasFinalQuiz = true, lesson, done, onToggleDone, onSynced, prev, next, goTo, courseCompleted, certificateSerial, bookmarked, onToggleBookmark, courseId, enrolled, onEnroll }) {
  const { t } = useTranslation()
  const location = useLocation()
  const { data, loading, error, reload } = useFetch(() => contentService.getLesson(lesson.id), [lesson.id])
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState("")
  const full = { ...lesson, ...data }
  const isQuiz = full.kind === "QUIZ"
  const media = isQuiz ? { type: null, text: "" } : getLessonMedia(full)
  const clock = useVideoClock(loading || error ? null : media) // note timestamps: read the video time, jump back to it
  const isAuthed = useAuthStore((s) => !!s.accessToken)
  const startLogin = useAuthStore((s) => s.startLogin)

  // LessonContentResponse carries `completed` — reflect it in the sidebar once loaded
  useEffect(() => {
    if (data?.completed != null) onSynced(data.completed)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.completed])

  // Video lessons complete on their own after ~90% has been watched (enrolled learners)
  const autoDone = useRef(false)
  const { getTime, getDuration, hasVideo } = clock
  useEffect(() => {
    autoDone.current = false
  }, [lesson.id])
  useEffect(() => {
    if (!enrolled || done || !hasVideo || isQuiz) return
    const id = setInterval(() => {
      const d = getDuration()
      const time = getTime()
      if (!autoDone.current && d > 0 && time != null && time / d >= 0.9) {
        autoDone.current = true
        toggle().then((ok) => ok && toast.success(t("learn.player.autoCompleted")))
      }
    }, 2000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrolled, done, hasVideo, isQuiz, getTime, getDuration])

  const toggle = async () => {
    setActionError("")
    setSaving(true)
    try {
      const res = done ? await enrollmentService.uncompleteLesson(lesson.id) : await enrollmentService.completeLesson(lesson.id)
      onToggleDone(!done, res)
      return true
    } catch (err) {
      setActionError(getErrorMessage(err, t("learn.player.progressFailed")))
    } finally {
      setSaving(false)
    }
  }


  // The lesson API needs a login (even for Preview lessons, depending on the backend) → log in and come back
  if (error?.response?.status === 401) return <Navigate to="/login" replace state={{ from: location }} />

  return (
    <div>
      {/* media sits inside a safe margin with rounded corners instead of running edge to edge */}
      {(loading || error || media.type === "embed" || media.type === "video") && (
        <div className="pt-3">
          {loading ? (
            // on the black video frame the loader always uses its light-on-dark rings
            <div className="dark grid aspect-video place-items-center overflow-hidden rounded-2xl bg-black/90">
              <Loader size="xs" title={t("learn.player.loadingLesson")} />
            </div>
          ) : error ? (
            <ErrorState error={error} onRetry={reload} className="aspect-video justify-center rounded-2xl bg-muted" />
          ) : media.type === "embed" ? (
            <div className="aspect-video overflow-hidden rounded-2xl bg-black">
              <iframe ref={clock.frameRef} src={clock.src} onLoad={clock.onFrameLoad} title={full.title} className="size-full" allow="accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
            </div>
          ) : media.type === "video" ? (
            <video ref={clock.videoRef} key={media.src} src={media.src} controls className="aspect-video w-full rounded-2xl bg-black" onEnded={() => !done && toggle()} />
          ) : null}
        </div>
      )}

      <div className="space-y-4 pt-5 pb-8">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-primary">{lesson.sectionTitle}</p>
            <h1 className="text-2xl font-bold tracking-tight">{full.title}</h1>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              {isQuiz ? (
                <><MdQuiz className="size-4" /> {t("learn.player.questions", { count: full.questionCount ?? 0 })}</>
              ) : (
                <><MdAccessTimeFilled className="size-4" /> {formatMinutes(full.durationMinutes)}</>
              )}
            </p>
          </div>
          {onToggleBookmark && (
            <Button
              variant="bordered"
              size="sm"
              onClick={onToggleBookmark}
              aria-pressed={bookmarked}
              className={cn("mt-1 shrink-0", bookmarked && "border-primary/40 bg-primary/5 text-primary dark:bg-primary/10")}
            >
              {bookmarked ? <IoBookmark className="size-4" /> : <IoBookmarkOutline className="size-4" />}
              {bookmarked ? t("learn.player.saved") : t("learn.player.save")}
            </Button>
          )}
        </div>

        {!loading && !error && media.text && (
          <div className="whitespace-pre-line font-medium leading-relaxed text-foreground/80">{media.text}</div>
        )}

        {/* blog-style page: headings, tips, code examples with "Try it Yourself", images */}
        {!loading && !error && !isQuiz && <LessonBlocks blocks={full.blocks ?? []} className="pt-1" />}

        {/* quiz item: the quiz is the whole page; submitting (or passing) completes it */}
        {!loading && !error && isQuiz && isAuthed && (
          <LessonCheck lessonId={lesson.id} item onCompleted={(progress) => onToggleDone(true, progress)} />
        )}

        {!loading && !error && !isQuiz && (!media.text && !media.type && !full.blocks?.length ? (
          <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">{t("learn.player.noContent")}</p>
        ) : null)}

        {full.files?.length > 0 && (
          <div className="space-y-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold"><Paperclip className="size-4" /> {t("learn.player.resources")}</h2>
            <ul className="divide-y rounded-lg border">
              {full.files.map((f) => (
                <li key={f.id}>
                  <a href={f.downloadUrl} target="_blank" rel="noreferrer" download className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-accent/50">
                    <span className="min-w-0 flex-1 truncate">{f.fileName}</span>
                    <span className="text-xs text-muted-foreground">{formatBytes(f.sizeBytes)}</span>
                    <Download className="size-4 text-muted-foreground" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* end-of-lesson quiz (signed-in learners) */}
        {!loading && !error && isAuthed && !isQuiz && <LessonCheck lessonId={lesson.id} />}

        <LessonTools
          lessonId={lesson.id}
          clock={clock}
          isAuthed={isAuthed}
          onLogin={() => startLogin({ returnTo: location.pathname + location.search })}
        />

        <FormError message={actionError} />

        {certificateSerial ? (
          // Finishing this lesson earned the certificate
          <div className="flex flex-col items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 sm:flex-row sm:items-center">
            <MdWorkspacePremium className="size-7 text-amber-600 dark:text-amber-400" />
            <div className="flex-1">
              <p className="font-semibold">{t("learn.player.certificateTitle")}</p>
              <p className="text-sm text-muted-foreground">{t("learn.player.certificateText")}</p>
            </div>
            <Button asChild><Link to={`/certificates/${certificateSerial}`}><MdWorkspacePremium className="size-4" /> {t("learn.player.viewCertificate")}</Link></Button>
          </div>
        ) : courseCompleted && (
          <div className="flex flex-col items-start gap-3 rounded-xl border border-primary/30 bg-primary/10 p-4 sm:flex-row sm:items-center">
            <Trophy className="size-6 text-primary" />
            <div className="flex-1">
              <p className="font-semibold">{t("learn.player.finishedTitle")}</p>
              <p className="text-sm text-muted-foreground">{hasFinalQuiz ? t("learn.player.finishedText") : t("learn.player.finishedNoQuiz")}</p>
            </div>
            {hasFinalQuiz && <Button asChild><Link to={`/courses/${courseId}/quiz`}><ListChecks /> {t("learn.player.takeQuiz")}</Link></Button>}
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="ghost" disabled={!prev} onClick={() => goTo(prev)}>
            <ChevronLeft /> {t("learn.player.previous")}
          </Button>
          {!enrolled ? (
            // Preview mode: no progress tracking — offer the next free preview and enrolling instead
            <div className="flex flex-col gap-2 sm:flex-row">
              {next && (
                <Button variant="outline" onClick={() => goTo(next)}>
                  {t("learn.player.nextPreview")} <ChevronRight />
                </Button>
              )}
              {/* logged out → login first; logged in → enroll now (the course reloads with in-order unlocking) */}
              <Button onClick={onEnroll}>{t("learn.player.enrollFree")}</Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row">
              {isQuiz ? (
                // a quiz item is completed by submitting (or passing) it — no manual tick
                <span className={cn("inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium", done ? "bg-primary/10 text-primary" : "text-muted-foreground")}>
                  <CheckCircle2 className="size-4" /> {done ? t("learn.player.completed") : t("learn.player.submitToContinue")}
                </span>
              ) : (
                <Button variant={done ? "secondary" : "outline"} onClick={toggle} disabled={saving}>
                  {saving ? <Loader2 className="animate-spin" /> : <CheckCircle2 className={done ? "text-primary" : ""} />}
                  {done ? t("learn.player.completed") : t("learn.player.markComplete")}
                </Button>
              )}
              {next ? (
                // Next stays disabled until this lesson is marked complete (that is what unlocks the next one)
                <span title={done ? undefined : t("learn.player.completeToContinue")}>
                  <Button onClick={() => goTo(next)} disabled={saving || !done} className="w-full">
                    {t("learn.player.nextLesson")} <ChevronRight />
                  </Button>
                </span>
              ) : (
                hasFinalQuiz ? (
                  <Button variant="outline" asChild>
                    <Link to={`/courses/${courseId}/quiz`}><ListChecks /> {t("learn.player.courseQuiz")}</Link>
                  </Button>
                ) : (
                  <Button variant="outline" asChild>
                    <Link to={`/courses/${courseId}`}>{t("learn.player.backToCourse")}</Link>
                  </Button>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyCourse({ course }) {
  const { t } = useTranslation()
  return (
    <EmptyState
      variant="page"
      icon={MdVideoLibrary}
      title={t("learn.player.emptyTitle")}
      action={<Button asChild variant="bordered"><Link to={`/courses/${course.id}`}><WiDirectionLeft className="size-5" /> {t("learn.player.backToCourse")}</Link></Button>}
    >
      {t("learn.player.emptyText")}
    </EmptyState>
  )
}
