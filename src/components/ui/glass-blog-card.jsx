/**
 * Glass blog card — from @uitripled/glass-blog-card-shadcnui, ported to JSX.
 * framer-motion → motion/react (same API, already installed).
 * Additions (all optional, defaults keep the original look):
 *  - `to`            render the whole card as a react-router link (the hover action becomes a label, not a nested button)
 *  - `actionLabel` / `actionIcon`  text + icon of the hover action
 *  - `imageFallback` node shown when there is no image
 *  - `meta` / `metaIcon`           right-hand footer text (was `readTime` + clock)
 */
import { Link } from "react-router-dom"
import { motion } from "motion/react"
import { BookOpen, Clock } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const defaultPost = {
  title: "The Future of UI Design",
  excerpt: "Exploring the latest trends in glassmorphism, 3D elements, and micro-interactions.",
  image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80",
  author: { name: "Moumen Soliman", avatar: "https://github.com/shadcn.png" },
  date: "Dec 2, 2025",
  readTime: "5 min read",
  tags: ["Design", "UI/UX"],
}

export function GlassBlogCard({
  title = defaultPost.title,
  excerpt = defaultPost.excerpt,
  image = defaultPost.image,
  imageFallback,
  author = defaultPost.author,
  date = defaultPost.date,
  readTime = defaultPost.readTime,
  meta,
  metaIcon: MetaIcon = Clock,
  tags = defaultPost.tags,
  to,
  actionLabel = "Read Article",
  actionIcon: ActionIcon = BookOpen,
  className,
}) {
  const initials = (author?.name ?? "?").split(" ").filter(Boolean).map((p) => p[0].toUpperCase()).slice(0, 2).join("")
  const actionClass = "flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25"

  const card = (
    <Card className="group relative h-full gap-0 overflow-hidden rounded-2xl py-0 transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10">
      {/* Image Section */}
      <div className="relative aspect-[16/9] overflow-hidden">
        {image ? (
          <motion.img src={image} alt={title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
        ) : (
          <div className="h-full w-full transition-transform duration-500 group-hover:scale-110">{imageFallback}</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-40" />

        {tags?.length > 0 && (
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="bg-background/50 backdrop-blur-sm hover:bg-background/80">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Hover Overlay Action */}
        <div className="absolute inset-0 flex items-center justify-center bg-background/20 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100">
          {to ? (
            // Inside a link: a label, not a nested interactive element
            <motion.span whileHover={{ scale: 1.05 }} className={actionClass}>
              <ActionIcon className="h-4 w-4" />
              {actionLabel}
            </motion.span>
          ) : (
            <motion.button type="button" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className={actionClass}>
              <ActionIcon className="h-4 w-4" />
              {actionLabel}
            </motion.button>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold leading-tight tracking-tight text-foreground transition-colors group-hover:text-primary">{title}</h3>
          {excerpt && <p className="line-clamp-2 text-sm text-muted-foreground">{excerpt}</p>}
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/50 pt-4">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar className="h-8 w-8 border border-border/50">
              {author?.avatar && <AvatarImage src={author.avatar} alt={author.name} />}
              <AvatarFallback className="text-[11px]">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col text-xs">
              <span className="truncate font-medium text-foreground">{author?.name}</span>
              {date && <span className="text-muted-foreground">{date}</span>}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
            <MetaIcon className="h-3 w-3" />
            <span>{meta ?? readTime}</span>
          </div>
        </div>
      </div>
    </Card>
  )

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className={cn("w-full max-w-[400px]", className)}>
      {to ? (
        <Link to={to} className="block h-full rounded-2xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
          {card}
        </Link>
      ) : (
        card
      )}
    </motion.div>
  )
}

export default GlassBlogCard
