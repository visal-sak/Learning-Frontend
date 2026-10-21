import { useState } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { TiLockClosed } from "react-icons/ti"
import { IoIosPlayCircle } from "react-icons/io"
import { HiCheckCircle } from "react-icons/hi"
import { IoBook } from "react-icons/io5"
import { MdAccessTimeFilled } from "react-icons/md"
import { BiSolidEditAlt } from "react-icons/bi"
import { ArrowLeft, Loader2, BarChart3, ListChecks, ChevronDown } from "lucide-react"
import CourseReviews from "@/components/course/CourseReviews"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CourseThumb, ErrorState, LoadingState, StatusBadge } from "@/components/course/CourseBits"
import { flattenLessons, formatMinutes, lessonAccess, lockReason } from "@/lib/format"
import { FormError } from "@/components/auth/FormField"
import { useAuthStore } from "@/store"
import { useFetch } from "@/hooks/useFetch"
import { useEnrollGate } from "@/hooks/useEnrollGate"
import { courseService, enrollmentService } from "@/services/course.service"
import { getErrorMessage } from "@/lib/api"
import { levelLabel } from "@/lib/constants"
import { confirm } from "@/store/confirm.store"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import { categoryTag } from "@/lib/tags"

export default function CourseDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const isAuthed = useAuthStore((s) => !!s.accessToken)
  // Re-fetch after login so `enrolled` / `editable` reflect the current user
  const { data: course, loading, error, reload } = useFetch(() => courseService.get(id), [id, isAuthed])
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState("")
  const gate = useEnrollGate(course ?? {})

  if (loading) return <LoadingState className="py-32" />
  if (error) return <ErrorState error={error} onRetry={reload} className="py-32" />

  const initials = (course.instructor?.displayName ?? "?").split(" ").map((p) => p[0]).slice(0, 2).join("")

  const learnPath = `/courses/${course.id}/learn`
  const toLogin = (from) => navigate("/login", { state: { from: { pathname: from } } })

  const run = async (fn) => {
    setActionError("")
    setBusy(true)
    try {
      await fn()
    } catch (err) {
      setActionError(getErrorMessage(err, "Something went wrong"))
      toast.error("Something went wrong", err)
    } finally {
      setBusy(false)
    }
  }

  // Enroll, then jump straight into the first lesson
  const enroll = () => {
    if (!isAuthed) return toLogin(location.pathname)
    run(async () => {
      await enrollmentService.enroll(course.id)
      toast.success("You’re enrolled!", course.title)
      navigate(learnPath)
    })
  }

  const unenroll = async () => {
    const ok = await confirm({
      title: `Unenroll from “${course.title}”?`,
      description: "You can enroll again at any time.",
      body: "Your lesson progress and quiz attempts for this course may be lost.",
      confirmLabel: "Unenroll",
      tone: "warning",
    })
    if (!ok) return
    run(async () => {
      await enrollmentService.unenroll(course.id)
      reload()
      toast.info("Unenrolled", course.title)
    })
  }

  // Open lessons go straight to the player (it sends logged-out visitors to login if the API asks for it)
  const openLesson = (lessonId) => navigate(`${learnPath}/${lessonId}`)
  // Locked (needs enrolling): logged out → login; logged in → "Enroll to unlock" dialog
  const unlockLesson = (lessonId) => gate(`${learnPath}/${lessonId}`)
  const previewCount = flattenLessons(course).filter((l) => l.preview).length
  const quizPath = `/courses/${course.id}/quiz`
  const canQuiz = course.enrolled || course.editable

  return (
    <div>
      {/* One two-column page: course info + content on the left, the enroll card sticky on the right.
          On phones the card sits between the course info and the content. */}
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <Button variant="outline" size="sm" asChild>
          <Link to="/courses"><ArrowLeft /> Back to courses</Link>
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
              {course.level && <span className="flex items-center gap-1.5"><BarChart3 className="size-4" /> {levelLabel(course.level)}</span>}
              <span className="flex items-center gap-1.5"><IoBook className="size-4" /> {course.lessonCount ?? 0} lessons</span>
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
                <p className="text-2xl font-bold tracking-tight">Free</p>
                {course.enrolled ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/12 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                    <HiCheckCircle className="size-3.5" /> Enrolled
                  </span>
                ) : (
                  previewCount > 0 && (
                    <span className="rounded-full bg-sky-500/12 px-2.5 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-500/20 dark:text-sky-300">
                      {previewCount} free preview{previewCount > 1 ? "s" : ""}
                    </span>
                  )
                )}
              </div>

              <FormError message={actionError} />

              {course.enrolled && course.percentComplete != null && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium text-muted-foreground">
                    <span>Your progress</span>
                    <span className="text-foreground">{Math.round(course.percentComplete)}%</span>
                  </div>
                  <Progress value={course.percentComplete} className="h-1.5" />
                </div>
              )}

              <div className="grid gap-2">
                {course.enrolled ? (
                  <Button className="h-10 w-full text-sm" asChild>
                    <Link to={learnPath}>
                      <IoIosPlayCircle /> {course.percentComplete > 0 ? "Continue learning" : "Start learning"}
                    </Link>
                  </Button>
                ) : course.editable ? (
                  <Button className="h-10 w-full text-sm" asChild>
                    <Link to={learnPath}><IoIosPlayCircle /> Preview as learner</Link>
                  </Button>
                ) : (
                  <Button className="h-10 w-full text-sm" onClick={enroll} disabled={busy}>
                    {busy && <Loader2 className="animate-spin" />}
                    {isAuthed ? "Enroll for free" : "Log in to enroll"}
                  </Button>
                )}
                <div className={cn("grid gap-2", course.editable && "grid-cols-2")}>
                  {canQuiz ? (
                    <Button className="h-9 w-full" variant="outline" asChild>
                      <Link to={quizPath}><ListChecks /> Course quiz</Link>
                    </Button>
                  ) : (
                    // Final quiz is for enrolled learners: logged out → login, logged in → ask to enroll
                    <Button className="h-9 w-full" variant="outline" onClick={() => gate(quizPath, { what: "the final quiz" })}>
                      <TiLockClosed /> Course quiz
                    </Button>
                  )}
                  {course.editable && (
                    <Button className="h-9 w-full" variant="outline" asChild>
                      <Link to={`/admin/courses/${course.id}`}><BiSolidEditAlt /> Edit course</Link>
                    </Button>
                  )}
                </div>
              </div>

              <div className="border-t border-neutral-200/80 pt-4 dark:border-neutral-800">
                <p className="mb-3 text-sm font-semibold">This course includes</p>
                <ul className="space-y-2.5 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2.5"><IoBook className="size-4 text-foreground/70" /> {course.lessonCount ?? 0} lessons</li>
                  <li className="flex items-center gap-2.5"><MdAccessTimeFilled className="size-4 text-foreground/70" /> {formatMinutes(course.totalMinutes)} of content</li>
                  {course.level && <li className="flex items-center gap-2.5"><BarChart3 className="size-4 text-foreground/70" /> {levelLabel(course.level)} level</li>}
                  <li className="flex items-center gap-2.5"><ListChecks className="size-4 text-foreground/70" /> Final quiz</li>
                </ul>
              </div>

              {course.enrolled && (
                <div className="flex justify-end border-t border-neutral-200/80 pt-3 dark:border-neutral-800">
                  <button onClick={unenroll} disabled={busy} className="text-xs text-muted-foreground hover:text-destructive hover:underline disabled:opacity-50">
                    Unenroll from this course
                  </button>
                </div>
              )}
            </div>
          </aside>

        <div className="min-w-0 space-y-10 lg:col-start-1 lg:row-start-2">
          {course.description && (
            <section>
              <h2 className="mb-3 text-xl font-semibold">About this course</h2>
              <p className="whitespace-pre-line leading-relaxed text-muted-foreground">{course.description}</p>
            </section>
          )}

          <section>
            <h2 className="mb-3 text-xl font-semibold">Course content</h2>
            <CourseContent course={course} onOpen={openLesson} onUnlock={unlockLesson} isAuthed={isAuthed} />
          </section>

          {course.reviewNote && course.editable && (
            <section className="rounded-xl border bg-muted/40 p-4">
              <h2 className="mb-1 text-sm font-semibold">Reviewer note</h2>
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
function CourseContent({ course, onOpen, onUnlock, isAuthed }) {
  const [expanded, setExpanded] = useState(false)
  if (!course.sections?.length) return <p className="text-sm text-muted-foreground">No lessons published yet.</p>

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
              <div className="flex items-center justify-between bg-neutral-50 px-4 py-3 dark:bg-neutral-800/60">
                <h3 className="font-medium">{s.title}</h3>
                <span className="text-xs text-muted-foreground">
                  {s.lessons?.length ?? 0} lessons · {formatMinutes(s.totalMinutes)}
                </span>
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
                      ) : (
                        <IoIosPlayCircle className="size-[18px] shrink-0 text-primary" />
                      )}
                      <span className="flex-1">{l.title}</span>
                      {l.preview && !course.enrolled && !l.locked && <Badge variant="secondary">Preview</Badge>}
                      <span className="text-xs text-muted-foreground">{formatMinutes(l.durationMinutes)}</span>
                    </>
                  )
                  return (
                    <li key={l.id} className={cn("border-t", border)}>
                      {l.needsEnroll ? (
                        // locked until enrolling — still clickable: leads to login or the enroll dialog
                        <button
                          onClick={() => onUnlock(l.id)}
                          title={isAuthed ? "Enroll to unlock this lesson" : "Log in to unlock this lesson"}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-muted-foreground transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
                        >
                          {row}
                        </button>
                      ) : l.locked ? (
                        <div
                          aria-disabled="true"
                          title={lockReason(l)}
                          className="flex cursor-not-allowed items-center gap-3 px-4 py-3 text-sm text-muted-foreground"
                        >
                          {row}
                        </div>
                      ) : (
                        <button
                          onClick={() => onOpen(l.id)}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
                        >
                          {row}
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}

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
            {expanded ? "Show less" : `Show all ${lessons.length} lessons`}
            <ChevronDown className={cn("transition-transform duration-200", expanded && "rotate-180")} />
          </Button>
        </div>
      )}
    </div>
  )
}
