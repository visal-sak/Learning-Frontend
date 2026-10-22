import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { MdNotifications, MdNotificationsNone, MdDoneAll } from "react-icons/md"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { BunnyAvatar } from "@/components/ai/Bunny"
import { notificationService } from "@/services/notification.service"
import { useAuthStore } from "@/store"
import { env } from "@/config/env"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"

// "3 min ago" in the UI language
function timeAgo(iso, lang) {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000
  const rtf = new Intl.RelativeTimeFormat(lang === "km" ? "km" : "en", { numeric: "auto" })
  const steps = [[60, "second"], [3600, "minute"], [86400, "hour"], [604800, "day"], [2629800, "week"], [31557600, "month"], [Infinity, "year"]]
  const units = { second: 1, minute: 60, hour: 3600, day: 86400, week: 604800, month: 2629800, year: 31557600 }
  for (const [limit, unit] of steps) {
    if (Math.abs(diff) < limit) return rtf.format(Math.round(diff / units[unit]), unit)
  }
  return ""
}

/**
 * Bell with unread count. Loads the latest notifications and keeps a live connection
 * (Server-Sent Events over fetch, so the bearer token can be sent) for new ones.
 */
export default function NotificationBell({ className }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const isAuthed = useAuthStore((s) => !!s.accessToken)
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const seen = useRef(new Set())

  // first load
  useEffect(() => {
    if (!isAuthed) return
    notificationService.list(20).then((data) => {
      const list = Array.isArray(data) ? data : [] // never let an odd response break the navbar
      setItems(list)
      list.forEach((n) => seen.current.add(n.id))
    }).catch(() => {})
    notificationService.unreadCount().then((r) => setUnread(Number(r?.unread) || 0)).catch(() => {})
  }, [isAuthed])

  // live stream, reconnecting after drops
  useEffect(() => {
    if (!isAuthed) return
    let stopped = false
    let ctrl = null
    let timer = null

    const onEvent = (raw) => {
      let event = "message"
      const data = []
      raw.split("\n").forEach((line) => {
        if (line.startsWith("event:")) event = line.slice(6).trim()
        else if (line.startsWith("data:")) data.push(line.slice(5).trim())
      })
      if (event !== "notification" || !data.length) return
      try {
        const n = JSON.parse(data.join("\n"))
        if (seen.current.has(n.id)) return
        seen.current.add(n.id)
        setItems((list) => [n, ...list].slice(0, 30))
        setUnread((u) => u + 1)
        toast.success(n.title, n.body)
      } catch {
        /* ignore malformed event */
      }
    }

    const connect = async () => {
      if (stopped) return
      try {
        const token = await useAuthStore.getState().getValidAccessToken()
        if (!token) throw new Error("no token")
        ctrl = new AbortController()
        const res = await fetch(`${env.apiBaseUrl}/my/notifications/stream`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "text/event-stream" },
          signal: ctrl.signal,
        })
        if (!res.ok || !res.body) throw new Error(`stream ${res.status}`)
        const reader = res.body.pipeThrough(new TextDecoderStream()).getReader()
        let buffer = ""
        for (;;) {
          const { value, done } = await reader.read()
          if (done) break
          buffer += value.replace(/\r\n/g, "\n")
          let cut
          while ((cut = buffer.indexOf("\n\n")) >= 0) {
            onEvent(buffer.slice(0, cut))
            buffer = buffer.slice(cut + 2)
          }
        }
      } catch {
        /* dropped or not available — try again shortly */
      }
      if (!stopped) timer = setTimeout(connect, 5000)
    }
    connect()
    return () => {
      stopped = true
      clearTimeout(timer)
      ctrl?.abort()
    }
  }, [isAuthed])

  if (!isAuthed) return null

  const openItem = async (n) => {
    setOpen(false)
    if (!n.read) {
      setItems((list) => list.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
      setUnread((u) => Math.max(0, u - 1))
      notificationService.markRead(n.id).catch(() => {})
    }
    if (n.link) navigate(n.link)
  }

  const readAll = async () => {
    setItems((list) => list.map((x) => ({ ...x, read: true })))
    setUnread(0)
    notificationService.markAllRead().catch(() => {})
  }

  const lang = i18n.resolvedLanguage || i18n.language

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("common.notifications.title")}
          className={cn("relative grid size-9 cursor-pointer place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground data-[state=open]:bg-accent data-[state=open]:text-foreground", className)}
        >
          {unread > 0 ? <MdNotifications className="size-5" /> : <MdNotificationsNone className="size-5" />}
          {unread > 0 && (
            <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-background tabular-nums">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[22rem] max-w-[calc(100vw-1.5rem)] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">{t("common.notifications.title")}</p>
          {unread > 0 && (
            <button type="button" onClick={readAll} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              <MdDoneAll className="size-4" /> {t("common.notifications.markAll")}
            </button>
          )}
        </div>
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary"><MdNotificationsNone className="size-6" /></span>
            <p className="text-sm font-medium">{t("common.notifications.empty")}</p>
            <p className="text-xs text-muted-foreground">{t("common.notifications.emptyHint")}</p>
          </div>
        ) : (
          <ul className="max-h-[26rem] divide-y overflow-y-auto">
            {items.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => openItem(n)}
                  className={cn("flex w-full cursor-pointer gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/60", !n.read && "bg-primary/[0.04] dark:bg-primary/10")}
                >
                  {n.type === "AI_ACCESS_GRANTED" ? (
                    <BunnyAvatar size={34} />
                  ) : (
                    <span className="grid size-[34px] shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><MdNotifications className="size-4" /></span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start gap-2">
                      <span className={cn("min-w-0 flex-1 text-sm leading-snug", !n.read ? "font-semibold" : "font-medium text-foreground/80")}>{n.title}</span>
                      {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
                    </span>
                    {n.body && <span className="mt-0.5 line-clamp-2 block whitespace-pre-line text-xs text-muted-foreground">{n.body}</span>}
                    <span className="mt-1 block text-[11px] text-muted-foreground/80">{timeAgo(n.createdAt, lang)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
