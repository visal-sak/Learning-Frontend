import { useCallback, useEffect, useRef } from "react"

/**
 * Read the current time of the lesson video and jump to a moment in it.
 * Works for an uploaded <video>, a YouTube embed and a Vimeo embed (via their postMessage APIs).
 *
 *   const clock = useVideoClock(media)   // media = getLessonMedia(lesson)
 *   <video ref={clock.videoRef} /> or <iframe ref={clock.frameRef} src={clock.src} onLoad={clock.onFrameLoad} />
 *   clock.getTime() → seconds (or null when there is no video)
 *   clock.seek(272)  → jumps to 4:32 and plays
 */
export function useVideoClock(media) {
  const videoRef = useRef(null)
  const frameRef = useRef(null)
  const last = useRef(0) // latest time reported by an embed
  const dur = useRef(0) // duration reported by an embed

  const provider =
    media?.type === "video" ? "video"
      : media?.type === "embed" && /youtube\.com/.test(media.src) ? "youtube"
        : media?.type === "embed" && /vimeo\.com/.test(media.src) ? "vimeo"
          : null

  // Embeds only talk back when their JS API is switched on
  const src =
    provider === "youtube" ? `${media.src}${media.src.includes("?") ? "&" : "?"}enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`
      : media?.src

  const post = useCallback(
    (msg) => {
      const win = frameRef.current?.contentWindow
      if (!win) return
      win.postMessage(JSON.stringify(msg), provider === "youtube" ? "https://www.youtube.com" : "https://player.vimeo.com")
    },
    [provider]
  )

  // Ask the embed to start reporting its time once it has loaded
  const onFrameLoad = useCallback(() => {
    if (provider === "youtube") post({ event: "listening", id: 1, channel: "widget" })
    if (provider === "vimeo") post({ method: "addEventListener", value: "timeupdate" })
  }, [provider, post])

  useEffect(() => {
    last.current = 0
    dur.current = 0
    if (provider !== "youtube" && provider !== "vimeo") return
    const onMessage = (e) => {
      if (e.source !== frameRef.current?.contentWindow) return
      let data = e.data
      try {
        if (typeof data === "string") data = JSON.parse(data)
      } catch {
        return
      }
      if (provider === "youtube" && data?.info) {
        if (typeof data.info.currentTime === "number") last.current = data.info.currentTime
        if (typeof data.info.duration === "number" && data.info.duration > 0) dur.current = data.info.duration
      }
      if (provider === "vimeo" && data?.event === "timeupdate" && typeof data.data?.seconds === "number") {
        last.current = data.data.seconds
        if (typeof data.data.duration === "number") dur.current = data.data.duration
      }
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [provider, src])

  const getTime = useCallback(() => {
    if (provider === "video") return videoRef.current ? Math.floor(videoRef.current.currentTime) : null
    if (provider === "youtube" || provider === "vimeo") return Math.floor(last.current)
    return null
  }, [provider])

  // Seconds, or 0 while unknown
  const getDuration = useCallback(() => {
    if (provider === "video") return videoRef.current && Number.isFinite(videoRef.current.duration) ? videoRef.current.duration : 0
    return dur.current
  }, [provider])

  const seek = useCallback(
    (seconds) => {
      if (provider === "video" && videoRef.current) {
        videoRef.current.currentTime = seconds
        videoRef.current.play?.().catch(() => {})
      } else if (provider === "youtube") {
        post({ event: "command", func: "seekTo", args: [seconds, true] })
        post({ event: "command", func: "playVideo", args: [] })
      } else if (provider === "vimeo") {
        post({ method: "setCurrentTime", value: seconds })
        post({ method: "play" })
      }
      // bring the player into view
      ;(videoRef.current ?? frameRef.current)?.scrollIntoView({ behavior: "smooth", block: "center" })
    },
    [provider, post]
  )

  return { provider, hasVideo: provider != null, src, videoRef, frameRef, onFrameLoad, getTime, getDuration, seek }
}

// 272 → "4:32", 3725 → "1:02:05"
export function formatTimestamp(total = 0) {
  const s = Math.max(0, Math.floor(total))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = String(s % 60).padStart(2, "0")
  return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`
}
