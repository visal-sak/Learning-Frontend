/**
 * TwitterCard — tweet-style card (borderless), same API as heygaia's twitter-card:
 *   <TwitterCard author={{ name, handle, avatar, verified }} content timestamp likes retweets />
 * Written locally because the registry entry (ui.heygaia.io/r/twitter-card.json) ships an empty file.
 * Extras (optional): `rating` (1–5 stars under the header), `context` (small line, e.g. "on Basic HTML"),
 * `actions` (custom node in the footer, e.g. a delete button).
 */
import { BadgeCheck, Heart, MessageCircle, Repeat2, Share, Star } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

const compact = new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 })

// "now", "5m", "3h", "2d", then "Oct 21" / "Oct 21, 2024"
function relativeTime(value) {
  if (!value) return ""
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const s = Math.max(0, (Date.now() - date.getTime()) / 1000)
  if (s < 60) return "now"
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}d`
  const sameYear = date.getFullYear() === new Date().getFullYear()
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", ...(sameYear ? {} : { year: "numeric" }) })
}

const initialsOf = (name = "?") => name.split(" ").filter(Boolean).map((p) => p[0].toUpperCase()).slice(0, 2).join("")

function Action({ icon: Icon, count, label, className }) {
  return (
    <span className={cn("group/action flex items-center gap-1.5 text-muted-foreground transition-colors", className)} aria-label={label}>
      <span className="grid size-8 place-items-center rounded-full transition-colors group-hover/action:bg-current/10">
        <Icon className="size-4" />
      </span>
      {count != null && <span className="text-xs tabular-nums">{compact.format(count)}</span>}
    </span>
  )
}

export function TwitterCard({ author, content, timestamp, likes, retweets, replies, rating, context, actions, className }) {
  const name = author?.name ?? "Anonymous"
  const time = relativeTime(timestamp)

  return (
    <article className={cn("glass flex flex-col gap-3 rounded-2xl p-5 text-card-foreground", className)}>
      <header className="flex items-start gap-3">
        <Avatar className="size-10 shrink-0">
          {author?.avatar && <AvatarImage src={author.avatar} alt="" />}
          <AvatarFallback className="bg-muted text-xs font-semibold">{initialsOf(name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="flex items-center gap-1">
            <span className="truncate text-[15px] font-bold">{name}</span>
            {author?.verified && <BadgeCheck className="size-4 shrink-0 fill-sky-500 text-white" aria-label="Verified" />}
          </div>
          <div className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
            {author?.handle && <span className="truncate">@{author.handle}</span>}
            {author?.handle && time && <span aria-hidden>·</span>}
            {time && (
              <time dateTime={new Date(timestamp).toISOString()} className="shrink-0">
                {time}
              </time>
            )}
          </div>
        </div>
      </header>

      {rating != null && (
        <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Star key={n} className={cn("size-4", n <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30")} />
          ))}
        </div>
      )}

      {content && <p className="whitespace-pre-line text-[15px] leading-relaxed">{content}</p>}

      {context && <div className="text-xs text-muted-foreground">{context}</div>}

      {(likes != null || retweets != null || replies != null || actions) && (
        <footer className="-mb-1 -ml-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {replies != null && <Action icon={MessageCircle} count={replies} label="Replies" className="hover:text-sky-500" />}
            {retweets != null && <Action icon={Repeat2} count={retweets} label="Reposts" className="hover:text-emerald-500" />}
            {likes != null && <Action icon={Heart} count={likes} label="Likes" className="hover:text-pink-500" />}
            {(likes != null || retweets != null) && <Action icon={Share} label="Share" className="hover:text-sky-500" />}
          </div>
          {actions}
        </footer>
      )}
    </article>
  )
}

export default TwitterCard
