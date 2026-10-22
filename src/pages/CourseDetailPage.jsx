import { useState } from "react"
import { WiDirectionLeft } from "react-icons/wi"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { TiLockClosed } from "react-icons/ti"
import { IoIosPlayCircle } from "react-icons/io"
import { HiCheckCircle } from "react-icons/hi"
import { IoBook } from "react-icons/io5"
import { MdAccessTimeFilled, MdQuiz, MdWorkspacePremium, MdEmojiEvents } from "react-icons/md"
import { FaChartBar } from "react-icons/fa"
import { BiSolidEditAlt } from "react-icons/bi"
import { Loader2, ChevronDown } from "lucide-react"
import CourseReviews from "@/components/course/CourseReviews"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CourseThumb, ErrorState, LoadingState, StatusBadge } from "@/components/course/CourseBits"
import { flattenLessons, formatMinutes, lessonAccess, lockReason } from "@/lib/format"
import { FormError } from "@/components/auth/FormField"
import { useAuthStore } from "@/store"
import { env, isManualRedirect } from "@/config/env"
import { useFetch } from "@/hooks/useFetch"
import { useEnrollGate } from "@/hooks/useEnrollGate"
import { certificateService } from "@/services/certificate.service"
import { bookmarkService } from "@/services/bookmark.service"
import { IoBookmark, IoBookmarkOutline } from "react-icons/io5"
import { useTranslation } from "react-i18next"
import { courseService, enrollmentService } from "@/services/course.service"
import { getErrorMessage } from "@/lib/api"
import { levelLabel } from "@/lib/constants"
import { confirm } from "@/store/confirm.store"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import { categoryTag } from "@/lib/tags"

export default function CourseDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const isAuthed = useAuthStore((s) => !!s.accessToken)
  const startLogin = useAuthStore((s) => s.startLogin)
  // Re-fetch after login so `enrolled` / `editable` reflect the current user
  const { data: course, loading, error, reload } = useFetch(() => courseService.get(id), [id, isAuthed])
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState("")
  const gate = useEnrollGate(course ?? {})
  // The student's certificates — to show "View certificate" for this course
  const myCerts = useFetch(() => (isAuthed ? certificateService.mine() : Promise.resolve([])), [isAuthed])
  const [claiming, setClaiming] = useState(false)

  if (loading) return <LoadingState />
  if (error) return <ErrorState error={error} onRetry={reload} className="py-32" />

  const initials = (course.instructor?.displayName ?? "?").split(" ").map((p) => p[0]).slice(0, 2).join("")

  const learnPath = `/courses/${course.id}/learn`
  // PKCE: straight to the Keycloak form, back to this page afterwards
  const toLogin = (from) =>
    env.authFlow === "pkce" && !isManualRedirect ? startLogin({ returnTo: from }) : navigate("/login", { state: { from: { pathname: from } } })

  const run = async (fn) => {
    setActionError("")
    setBusy(true)
    try {
      await fn()
    } catch (err) {
      setActionError(getErrorMessage(err, t("learn.courseDetail.error")))
      toast.error(t("learn.courseDetail.error"), err)
    } finally {
      setBusy(false)
    }
  }

  // Enroll, then jump straight into the first lesson
  const enroll = () => {
    if (!isAuthed) return toLogin(location.pathname)
    run(async () => {
      await enrollmentService.enroll(course.id)
      toast.success(t("learn.courseDetail.enrolledToast"), course.title)
      navigate(learnPath)
    })
  }

  const unenroll = async () => {
    const ok = await confirm({
      title: t("learn.courseDetail.unenrollTitle", { title: course.title }),
      description: t("learn.courseDetail.unenrollDescription"),
      body: t("learn.courseDetail.unenrollBody"),
      confirmLabel: t("learn.courseDetail.unenrollConfirm"),
      tone: "warning",
    })
    if (!ok) return
    run(async () => {
      await enrollmentService.unenroll(course.id)
      reload()
      toast.info(t("learn.courseDetail.unenrolledToast"), course.title)
    })
  }

  // Open lessons go straight to the player (it sends logged-out visitors to login if the API asks for it)
  const openLesson = (lessonId) => navigate(`${learnPath}/${lessonId}`)
  // Locked (needs enrolling): logged out → login; logged in → "Enroll to unlock" dialog
  const unlockLesson = (lessonId) => gate(`${learnPath}/${lessonId}`)
  const previewCount = flattenLessons(course).filter((l) => l.preview).length
  const quizPath = `/courses/${course.id}/quiz`
  const hasFinalQuiz = course.finalQuizQuestions !== 0 // unknown (older API) counts as yes
  const canQuiz = course.enrolled || course.editable
  const certificate = (myCerts.data ?? []).find((c) => c.courseId === course.id)
  const claimCertificate = async () => {
    setClaiming(true)
    try {
      const c = await certificateService.claim(course.id)
      toast.success(t("learn.courseDetail.certificateIssued"), course.title)
      navigate(`/certificates/${c.serialNo}`)
    } catch (err) {
      toast.error(t("learn.courseDetail.notYet"), getErrorMessage(err, t("learn.courseDetail.requirementsNotMet")))
      setClaiming(false)
    }
  }

  return (
    <div>
      {/* One two-column page: course info + content on the left, the enroll card sticky on the right.
          On phones the card sits between the course info and the content. */}
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <Button variant="outline" size="sm" asChild>
          <Link to="/courses"><WiDirectionLeft className="size-5" /> {t("learn.courseDetail.backToCourses")}</Link>
        </Button>
      </div>

      <div className="mx-auto grid max-w-7xl gap-x-8 gap-y-8 px-4 pt-4 pb-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:grid-rows-[auto_1fr]">
          {/* Course header as its own block, matching the enroll card next to it */}
          <div className="min-w-0 space-y-4 self-start rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-[0_8px_30px_-12px_rgb(0_0_0/0.12)] sm:p-8 lg:col-start-1 lg:row-start-1 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex flex-wrap items-center gap-2">
              {course.categoryName && (
                <Link
                  to={`/courses?categoryId=${course.categoryId}`}
                  className={cn("rounded-full px-2.5 py-1 text-xs font-semibold transition-opacity hover:opacity-80", categoryTag(course.categoryName))}
                >
                  {course.categoryName}
                </Link>
              )}
              {course.status !== "PUBLISHED" && <StatusBadge status={course.status} />}
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{course.title}</h1>
            {course.summary && <p className="text-lg text-muted-foreground">{course.summary}</p>}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {course.level && <span className="flex items-center gap-1.5"><FaChartBar className="size-4" /> {levelLabel(course.level)}</span>}
              <span className="flex items-center gap-1.5"><IoBook className="size-4" /> {t("learn.courseDetail.lessons", { count: course.lessonCount ?? 0 })}</span>
              <span className="flex items-center gap-1.5"><MdAccessTimeFilled className="size-[18px]" /> {formatMinutes(course.totalMinutes)}</span>
            </div>
            {course.instructor && (
              <div className="flex items-center gap-3 pt-2">
                <Avatar className="size-10">
                  {course.instructor.avatarUrl && <AvatarImage src={course.instructor.avatarUrl} alt="" />}
                  <AvatarFallback className="bg-accent text-sm text-accent-foreground">{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{course.instructor.displayName}</p>
                  {course.instructor.headline && <p className="text-xs text-muted-foreground">{course.instructor.headline}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Enroll card: uncropped thumbnail on a #f5f5f5 panel, price, actions, then what the course includes */}
          <aside className="h-fit self-start rounded-2xl border border-neutral-200/80 bg-white p-2.5 shadow-[0_8px_30px_-12px_rgb(0_0_0/0.12)] lg:sticky lg:top-20 lg:col-start-2 lg:row-span-2 lg:row-start-1 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="overflow-hidden rounded-xl bg-[#f5f5f5] dark:bg-neutral-800">
              <CourseThumb
                course={course}
                className="aspect-[16/10] object-contain p-5 mix-blend-multiply dark:mix-blend-normal"
                iconClassName="size-14"
              />
            </div>

            <div className="space-y-4 px-2.5 pt-4 pb-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-2xl font-bold tracking-tight">{t("learn.courseDetail.free")}</p>
                {course.enrolled ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/12 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                    <HiCheckCircle className="size-3.5" /> {t("learn.courseDetail.enrolled")}
                  </span>
                ) : (
                  previewCount > 0 && (
                    <span className="rounded-full bg-sky-500/12 px-2.5 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-500/20 dark:text-sky-300">
                      {t("learn.courseDetail.freePreviews", { count: previewCount })}
                    </span>
                  )
                )}
              </div>

              <FormError message={actionError} />

              {course.enrolled && course.percentComplete != null && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium text-muted-foreground">
                    <span>{t("learn.courseDetail.yourProgress")}</span>
                    <span className="text-foreground">{Math.round(course.percentComplete)}%</span>
                  </div>
                  <Progress value={course.percentComplete} className="h-1.5" />
                </div>
              )}

              <div className="grid gap-2">
                {/* Certificate: view it once issued, or claim it when every lesson is done */}
                {certificate ? (
                  <Button className="h-10 w-full text-sm" variant="bordered" asChild>
                    <Link to={`/certificates/${certificate.serialNo}`}><MdWorkspacePremium className="size-4 text-amber-500" /> {t("learn.courseDetail.viewCertificate")}</Link>
                  </Button>
                ) : course.enrolled && course.percentComplete >= 100 && course.certificateEnabled !== false ? (
                  <Button className="h-10 w-full text-sm" variant="bordered" onClick={claimCertificate} disabled={claiming}>
                    {claiming ? <Loader2 className="animate-spin" /> : <MdWorkspacePremium className="size-4 text-amber-500" />} {t("learn.courseDetail.getCertificate")}
                  </Button>
                ) : null}
                {course.enrolled ? (
                  <Button className="h-10 w-full text-sm" asChild>
                    <Link to={learnPath}>
                      <IoIosPlayCircle /> {course.percentComplete > 0 ? t("learn.courseDetail.continueLearning") : t("learn.courseDetail.startLearning")}
                    </Link>
                  </Button>
                ) : course.editable ? (
                  <Button className="h-10 w-full text-sm" asChild>
                    <Link to={learnPath}><IoIosPlayCircle /> {t("learn.courseDetail.previewAsLearner")}</Link>
                  </Button>
                ) : (
                  <Button className="h-10 w-full text-sm" onClick={enroll} disabled={busy}>
                    {busy && <Loader2 className="animate-spin" />}
                    {isAuthed ? t("learn.courseDetail.enrollFree") : t("learn.courseDetail.logInToEnroll")}
                  </Button>
                )}
                <div className={cn("grid gap-2", course.editable && hasFinalQuiz && "grid-cols-2")}>
                  {!hasFinalQuiz ? null : canQuiz ? (
                    <Button className="h-9 w-full" variant="bordered" asChild>
                      <Link to={quizPath}><MdQuiz className="size-4" /> {t("learn.courseDetail.courseQuiz")}</Link>
                    </Button>
                  ) : (
                    // Final quiz is for enrolled learners: logged out → login, logged in → ask to enroll
                    <Button className="h-9 w-full" variant="bordered" onClick={() => gate(quizPath, { what: t("learn.courseDetail.theFinalQuiz") })}>
                      <MdQuiz className="size-4" /> {t("learn.courseDetail.courseQuiz")} <TiLockClosed className="size-3.5 text-muted-foreground" />
                    </Button>
                  )}
                  {course.editable && (
                    <Button className="h-9 w-full" variant="bordered" asChild>
                      <Link to={`/admin/courses/${course.id}`}><BiSolidEditAlt /> {t("learn.courseDetail.editCourse")}</Link>
                    </Button>
                  )}
                </div>
              </div>

              <div className="border-t border-neutral-200/80 pt-4 dark:border-neutral-800">
                <p className="mb-3 text-sm font-semibold">{t("learn.courseDetail.includes")}</p>
                <ul className="space-y-2.5 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2.5"><IoBook className="size-4 text-foreground/70" /> {t("learn.courseDetail.lessons", { count: course.lessonCount ?? 0 })}</li>
                  <li className="flex items-center gap-2.5"><MdAccessTimeFilled className="size-4 text-foreground/70" /> {t("learn.courseDetail.ofContent", { duration: formatMinutes(course.totalMinutes) })}</li>
                  {course.level && <li className="flex items-center gap-2.5"><FaChartBar className="size-4 text-foreground/70" /> {t("learn.courseDetail.levelOf", { level: levelLabel(course.level) })}</li>}
                  {hasFinalQuiz && <li className="flex items-center gap-2.5"><MdQuiz className="size-4 text-foreground/70" /> {t("learn.courseDetail.finalQuiz")}</li>}
                </ul>
              </div>

              {course.enrolled && (
                <div className="flex justify-end border-t border-neutral-200/80 pt-3 dark:border-neutral-800">
                  <button onClick={unenroll} disabled={busy} className="text-xs text-muted-foreground hover:text-destructive hover:underline disabled:opacity-50">
                    {t("learn.courseDetail.unenrollLink")}
                  </button>
                </div>
              )}
            </div>
          </aside>

        <div className="min-w-0 space-y-10 lg:col-start-1 lg:row-start-2">
          {course.description && (
            <section>
              <h2 className="mb-3 text-xl font-semibold">{t("learn.courseDetail.about")}</h2>
              <p className="whitespace-pre-line leading-relaxed text-muted-foreground">{course.description}</p>
            </section>
          )}

          <section>
            <h2 className="mb-3 text-xl font-semibold">{t("learn.courseDetail.courseContent")}</h2>
            <CourseContent course={course} onOpen={openLesson} onUnlock={unlockLesson} isAuthed={isAuthed} />
          </section>

          {course.reviewNote && course.editable && (
            <section className="rounded-xl border bg-muted/40 p-4">
              <h2 className="mb-1 text-sm font-semibold">{t("learn.courseDetail.reviewerNote")}</h2>
              <p className="text-sm text-muted-foreground">{course.reviewNote}</p>
            </section>
          )}

          {isAuthed && <CourseReviews courseId={course.id} canReview={course.enrolled} />}
        </div>
      </div>
    </div>
  )
}

// Rows visible before the list is collapsed behind a blurred fade
const VISIBLE_LESSONS = 6

// Curriculum table: lessons unlock in order (each opens once the previous one is completed),
// and long courses show the first rows with the rest blurred out until expanded.
// Lessons completed in one section (lesson summaries carry `completed` for enrolled learners)
const sectionDone = (s) => (s.lessons ?? []).filter((l) => l.completed).length

// Save / unsave a lesson from the course page (shown under My learning › Bookmarks)
function useBookmarks(isAuthed) {
  const { t } = useTranslation()
  const { data } = useFetch(() => (isAuthed ? bookmarkService.mine() : Promise.resolve([])), [isAuthed])
  const [saved, setSaved] = useState(null)
  const set = saved ?? new Set((data ?? []).map((b) => b.lessonId))
  const toggle = async (lessonId) => {
    const on = !set.has(lessonId)
    const next = new Set(set)
    on ? next.add(lessonId) : next.delete(lessonId)
    setSaved(next)
    try {
      on ? await bookmarkService.add(lessonId) : await bookmarkService.remove(lessonId)
      toast.success(t(on ? "learn.bookmark.added" : "learn.bookmark.removed"))
    } catch (err) {
      setSaved(set) // roll back
      toast.error(t("common.states.error"), err)
    }
  }
  return { has: (id) => set.has(id), toggle }
}

function CourseContent({ course, onOpen, onUnlock, isAuthed }) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const bookmarks = useBookmarks(isAuthed)
  if (!course.sections?.length) return <p className="text-sm text-muted-foreground">{t("learn.courseDetail.noLessons")}</p>

  // Not enrolled → only Preview lessons open; enrolled → lessons unlock in order as they are completed
  const lessons = lessonAccess(flattenLessons(course), { enrolled: !!course.enrolled, isDone: (l) => l.completed })
  const byId = new Map(lessons.map((l, i) => [l.id, { ...l, index: i }]))
  const collapsible = lessons.length > VISIBLE_LESSONS
  const collapsed = collapsible && !expanded
  // one extra row is rendered under the blur so the list visibly continues
  const shown = (l) => !collapsed || l.index <= VISIBLE_LESSONS

  const border = "border-neutral-200/80 dark:border-neutral-800"

  return (
    <div>
      <div className={cn("relative overflow-hidden rounded-xl border bg-white dark:bg-neutral-900", border)}>
        {course.sections.map((s, i) => {
          const rows = (s.lessons ?? []).map((raw) => byId.get(raw.id) ?? raw).filter(shown)
          if (collapsed && !rows.length) return null
          return (
            <div key={s.id} className={cn(i > 0 && "border-t", border)}>
              <div className="bg-neutral-50 px-4 py-3 dark:bg-neutral-800/60">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-medium">{s.title}</h3>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {course.enrolled && s.lessons?.length ? (
                      <span className={cn("font-semibold", sectionDone(s) === s.lessons.length ? "text-emerald-600 dark:text-emerald-400" : "text-foreground")}>
                        {t("learn.courseDetail.sectionDone", { done: sectionDone(s), total: s.lessons.length })}
                      </span>
                    ) : null}
                    {t("learn.courseDetail.lessons", { count: s.lessons?.length ?? 0 })} · {formatMinutes(s.totalMinutes)}
                  </span>
                </div>
                {/* per-section progress for enrolled learners */}
                {course.enrolled && s.lessons?.length > 0 && (
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                    <div
                      className={cn("h-full rounded-full", sectionDone(s) === s.lessons.length ? "bg-emerald-500" : "bg-primary")}
                      style={{ width: `${Math.round((sectionDone(s) / s.lessons.length) * 100)}%` }}
                    />
                  </div>
                )}
              </div>
              <ul>
                {rows.map((l) => {
                  const done = course.enrolled && l.completed
                  const row = (
                    <>
                      {l.locked ? (
                        <TiLockClosed className="size-[18px] shrink-0 text-muted-foreground" />
                      ) : done ? (
                        <HiCheckCircle className="size-[18px] shrink-0 text-primary" />
                      ) : l.kind === "QUIZ" ? (
                        <MdQuiz className="size-[18px] shrink-0 text-amber-500" />
                      ) : (
                        <IoIosPlayCircle className="size-[18px] shrink-0 text-primary" />
                      )}
                      <span className="flex-1">{l.title}</span>
                      {l.preview && !course.enrolled && !l.locked && <Badge variant="secondary">{t("learn.courseDetail.preview")}</Badge>}
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {l.kind === "QUIZ" ? t("learn.player.questions", { count: l.questionCount ?? 0 }) : formatMinutes(l.durationMinutes)}
                      </span>
                    </>
                  )
                  return (
                    <li key={l.id} className={cn("group/row relative border-t", border)}>
                      {l.needsEnroll ? (
                        // locked until enrolling — still clickable: leads to login or the enroll dialog
                        <button
                          onClick={() => onUnlock(l.id)}
                          title={isAuthed ? t("learn.courseDetail.enrollToUnlock") : t("learn.courseDetail.logInToUnlock")}
                          className="flex w-full items-center gap-3 py-3 pl-4 pr-12 text-left text-sm text-muted-foreground transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
                        >
                          {row}
                        </button>
                      ) : l.locked ? (
                        <div
                          aria-disabled="true"
                          title={lockReason(l)}
                          className="flex cursor-not-allowed items-center gap-3 py-3 pl-4 pr-12 text-sm text-muted-foreground"
                        >
                          {row}
                        </div>
                      ) : (
                        <button
                          onClick={() => onOpen(l.id)}
                          className="flex w-full items-center gap-3 py-3 pl-4 pr-12 text-left text-sm transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
                        >
                          {row}
                        </button>
                      )}
                      {isAuthed && (
                        <button
                          type="button"
                          onClick={() => bookmarks.toggle(l.id)}
                          aria-pressed={bookmarks.has(l.id)}
                          aria-label={t(bookmarks.has(l.id) ? "learn.bookmark.remove" : "learn.bookmark.add")}
                          title={t(bookmarks.has(l.id) ? "learn.bookmark.remove" : "learn.bookmark.add")}
                          className={cn(
                            "absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md transition-colors hover:bg-primary/10",
                            bookmarks.has(l.id) ? "text-primary" : "text-muted-foreground/60 hover:text-primary"
                          )}
                        >
                          {bookmarks.has(l.id) ? <IoBookmark className="size-4" /> : <IoBookmarkOutline className="size-4" />}
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}

        {/* the final quiz closes the curriculum */}
        {course.finalQuizQuestions > 0 && !collapsed && (
          <div className={cn("flex items-center gap-3 border-t bg-amber-500/[0.05] px-4 py-3 text-sm", border)}>
            <MdEmojiEvents className="size-[18px] shrink-0 text-amber-500" />
            <span className="flex-1 font-medium">{t("learn.player.finalQuiz")}</span>
            <span className="shrink-0 pr-8 text-xs text-muted-foreground">{t("learn.player.questions", { count: course.finalQuizQuestions })}</span>
          </div>
        )}

        {collapsed && (
          // blur + fade over the last rendered row; the mask makes the blur strongest at the bottom
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
        <div className="mt-3 flex justify-center">
          <Button variant="outline" onClick={() => setExpanded((v) => !v)}>
            {expanded ? t("learn.courseDetail.showLess") : t("learn.courseDetail.showAll", { count: lessons.length })}
            <ChevronDown className={cn("transition-transform duration-200", expanded && "rotate-180")} />
          </Button>
        </div>
      )}
    </div>
  )
}
