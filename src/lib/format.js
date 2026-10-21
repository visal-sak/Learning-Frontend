export const formatMinutes = (m = 0) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60 ? `${m % 60}m` : ""}`.trim() : `${m}m`)

// Enrollment items may be flat or nest the course — normalise both
export function normalizeEnrollment(e) {
  const c = e.course ?? e
  return {
    courseId: e.courseId ?? c.id,
    nextLessonId: e.nextLessonId ?? null,
    status: e.status,
    title: c.title ?? e.courseTitle,
    thumbnailUrl: c.thumbnailUrl ?? e.thumbnailUrl,
    instructorName: c.instructorName ?? e.instructorName,
    progress: Math.round(e.percentComplete ?? e.progress ?? c.percentComplete ?? 0),
  }
}

// Lessons can carry a video (direct file or YouTube/Vimeo link) and/or text — accept common field names
export function getLessonMedia(lesson = {}) {
  const url = lesson.videoUrl ?? lesson.mediaUrl ?? lesson.video?.url ?? lesson.media?.url ?? lesson.url ?? null
  const text = lesson.content ?? lesson.body ?? lesson.description ?? lesson.text ?? ""
  if (!url) return { type: null, text }
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/)
  if (yt) return { type: "embed", src: `https://www.youtube.com/embed/${yt[1]}`, text }
  const vimeo = url.match(/vimeo\.com\/(\d+)/)
  if (vimeo) return { type: "embed", src: `https://player.vimeo.com/video/${vimeo[1]}`, text }
  return { type: "video", src: url, text }
}

// Flatten sections → ordered lessons, keeping the section title for context
export const flattenLessons = (course) =>
  (course?.sections ?? []).flatMap((s) => (s.lessons ?? []).map((l) => ({ ...l, sectionId: s.id, sectionTitle: s.title })))

export const formatDate = (iso) => (iso ? new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "")

export const formatBytes = (n = 0) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : n >= 1024 ? `${Math.round(n / 1024)} KB` : `${n} B`)

// Sequential gating: when `enforce` is on, a lesson stays locked until every lesson before it is completed.
// Keeps the API's own `locked` flag; adds `gated` so the UI can explain why.
export const gateLessons = (lessons, isDone, enforce) => {
  let open = true
  return lessons.map((l) => {
    const gated = enforce && !open
    // lessons the API locks (not available to this user) do not block the ones after them
    if (!l.locked && !isDone(l)) open = false
    return { ...l, gated, locked: l.locked || gated }
  })
}

// Who can open which lesson:
// - not enrolled → only lessons marked `preview` (free samples); the rest need enrolling (`needsEnroll`)
// - enrolled     → lessons unlock in order, each after the previous one is completed (`gated`)
export const lessonAccess = (lessons, { enrolled, isDone }) =>
  enrolled
    ? gateLessons(lessons, isDone, true)
    : lessons.map((l) => ({ ...l, gated: false, needsEnroll: !l.preview, locked: l.locked || !l.preview }))

export const lockReason = (l) =>
  l.needsEnroll ? "Enroll in the course to unlock this lesson" : l.gated ? "Complete the previous lesson to unlock" : undefined
