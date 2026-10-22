import { Link } from "react-router-dom"
import { BookOpen } from "lucide-react"
import { IoBook } from "react-icons/io5"
import { MdAccessTimeFilled } from "react-icons/md"
import { MinimalCard, MinimalCardDescription, MinimalCardImage, MinimalCardTitle } from "@/components/ui/minimal-card"
import { levelLabel } from "@/lib/constants"
import { formatMinutes } from "@/lib/format"
import { cn } from "@/lib/utils"
import { CATEGORY_TAGS, LEVEL_TAG, categoryTag } from "@/lib/tags"
import { useTranslation } from "react-i18next"

const gradients = [
  "from-sky-500/40 to-indigo-500/10",
  "from-emerald-500/40 to-teal-500/10",
  "from-pink-500/40 to-purple-500/10",
  "from-orange-500/40 to-red-500/10",
  "from-yellow-400/40 to-amber-600/10",
  "from-blue-500/40 to-cyan-400/10",
]
const gradientFor = (key = "") => gradients[[...key].reduce((n, c) => n + c.charCodeAt(0), 0) % gradients.length]

const initialsOf = (name = "") => name.split(" ").filter(Boolean).map((p) => p[0].toUpperCase()).slice(0, 2).join("") || "L"

// `course` is a CourseSummary from GET /courses, shown on the cult-ui minimal card
export default function CourseCard({ course }) {
  const { id, title, summary, level, categoryName, instructorName, lessonCount, totalMinutes, thumbnailUrl } = course
  const { t } = useTranslation()
  const tags = [
    categoryName && { label: categoryName, className: categoryTag(categoryName) },
    level && { label: t(`site.levels.${level}`, { defaultValue: levelLabel(level) }), className: LEVEL_TAG[level] ?? CATEGORY_TAGS[0] },
  ].filter(Boolean)

  return (
    <Link to={`/courses/${id}`} className="group block h-full rounded-[24px] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
      {/* white surface + hairline border so the card stands out from the near-white page */}
      <MinimalCard className="flex h-full flex-col border border-neutral-200/80 bg-white hover:bg-neutral-50 dark:border-neutral-700/60 dark:bg-neutral-800 dark:hover:bg-neutral-800/80">
        <MinimalCardImage
          src={thumbnailUrl}
          alt={title}
          // #f5f5f5 behind the thumbnail; multiply blend turns white baked into the image into that grey (light mode)
          className="mb-3 overflow-hidden rounded-[20px] bg-[#f5f5f5] dark:bg-neutral-900"
          imageClassName="mix-blend-multiply transition-transform duration-500 group-hover:scale-105 dark:mix-blend-normal"
        >
          <div className={cn("grid h-full w-full place-items-center bg-gradient-to-br", gradientFor(id || title))}>
            <BookOpen className="size-12 text-foreground/50" />
          </div>
        </MinimalCardImage>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-3 pt-1">
            {tags.map((tag) => (
              <span key={tag.label} className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", tag.className)}>
                {tag.label}
              </span>
            ))}
          </div>
        )}

        <MinimalCardTitle className="mt-3 px-3 text-[17px] leading-snug font-bold tracking-tight transition-colors group-hover:text-primary">{title}</MinimalCardTitle>
        {summary && <MinimalCardDescription className="mt-1 line-clamp-2 px-3 pb-0 text-[14px] font-medium leading-snug dark:text-neutral-400">{summary}</MinimalCardDescription>}

        {/* pinned to the bottom: 16px gap, divider, then the instructor / stats row */}
        <div className="mt-auto px-3 pt-4">
          <div className="flex items-center justify-between gap-3 border-t border-neutral-200/80 py-3 text-xs text-neutral-500 dark:border-neutral-700/60 dark:text-neutral-400">
            <span className="flex min-w-0 items-center gap-2">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-neutral-200 text-[10px] font-semibold text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200">
                {initialsOf(instructorName)}
              </span>
              <span className="truncate">{instructorName}</span>
            </span>
            <span className="flex shrink-0 items-center gap-3">
              <span className="flex items-center gap-1"><IoBook className="size-3.5" /> {lessonCount ?? 0}</span>
              <span className="flex items-center gap-1"><MdAccessTimeFilled className="size-4" /> {formatMinutes(totalMinutes)}</span>
            </span>
          </div>
        </div>
      </MinimalCard>
    </Link>
  )
}
