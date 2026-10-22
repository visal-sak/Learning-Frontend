import { forwardRef, useEffect, useLayoutEffect, useRef, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { GraduationCap, Link2, Check, Download, ImageDown, Loader2 } from "lucide-react"
import { RiCheckboxCircleFill } from "react-icons/ri"
import { BiSolidXCircle } from "react-icons/bi"
import "@fontsource-variable/playfair-display"
import { Button } from "@/components/ui/button"
import { LaurelWreath } from "@/components/ui/award"
import { LoadingState } from "@/components/course/CourseBits"
import { useFetch } from "@/hooks/useFetch"
import { certificateService } from "@/services/certificate.service"
import { formatDate } from "@/lib/format"
import { toast } from "@/lib/toast"
import { Trans, useTranslation } from "react-i18next"

// The certificate is drawn at a fixed A4-landscape size (px at 96 dpi) and scaled to fit the screen,
// so the screen, the PNG and the PDF are pixel-for-pixel the same.
const PAGE_W = 1123
const PAGE_H = 794

// Public page: anyone with the serial (an employer, say) can check a certificate — no account needed
export default function CertificatePage() {
  const { serial } = useParams()
  const { data: cert, loading, error } = useFetch(() => certificateService.verify(serial), [serial])
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(null) // "pdf" | "png"
  const { t } = useTranslation()
  const sheetRef = useRef(null)

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { /* clipboard blocked */ }
  }

  // Renders the certificate to an image in the browser, then (for PDF) places it on one A4 landscape page.
  // No print dialog: no browser header/footer, no wrong orientation.
  const download = async (kind) => {
    if (!sheetRef.current) return
    setBusy(kind)
    try {
      const { toPng } = await import("html-to-image")
      const png = await toPng(sheetRef.current, { pixelRatio: 2.5, width: PAGE_W, height: PAGE_H, style: { transform: "none" }, cacheBust: true })
      const name = `${cert.courseTitle} certificate`.replace(/[\\/:*?"<>|]+/g, "")
      if (kind === "png") {
        const a = document.createElement("a")
        a.href = png
        a.download = `${name}.png`
        a.click()
      } else {
        const { jsPDF } = await import("jspdf")
        const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4", compress: true })
        pdf.setProperties({ title: `${cert.courseTitle} — ${cert.studentName}`, subject: `Certificate ${cert.serialNo}`, creator: "Autumn" })
        pdf.addImage(png, "PNG", 0, 0, 297, 210)
        pdf.save(`${name}.pdf`)
      }
    } catch {
      toast.error(t("site.certificate.downloadFailed"))
    } finally {
      setBusy(null)
    }
  }

  if (loading) return <LoadingState />

  if (error) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-24 text-center">
        <BiSolidXCircle className="size-12 text-rose-500" />
        <h1 className="text-xl font-bold">{t("site.certificate.notFound")}</h1>
        <p className="text-sm text-muted-foreground">
          <Trans
            i18nKey="site.certificate.notFoundText"
            values={{ serial }}
            components={{ code: <span className="font-mono font-semibold text-foreground" /> }}
          />
        </p>
        <Button variant="bordered" asChild><Link to="/courses">{t("site.shared.browseCourses")}</Link></Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-10 sm:px-6">
      {/* verification banner + actions */}
      <div className="flex flex-col gap-3 rounded-2xl border bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-500/10">
            <RiCheckboxCircleFill className="size-5 text-emerald-600 dark:text-emerald-400" />
          </span>
          <div>
            <p className="text-sm font-semibold">{t("site.certificate.verified", { date: formatDate(cert.issuedAt) })}</p>
            <p className="text-xs text-muted-foreground">{t("site.certificate.shareHint")}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="bordered" onClick={copyLink}>
            {copied ? <Check /> : <Link2 />} {copied ? t("common.actions.copied") : t("common.actions.copyLink")}
          </Button>
          <Button size="sm" variant="bordered" onClick={() => download("png")} disabled={!!busy}>
            {busy === "png" ? <Loader2 className="animate-spin" /> : <ImageDown />} {t("site.certificate.downloadImage")}
          </Button>
          <Button size="sm" onClick={() => download("pdf")} disabled={!!busy}>
            {busy === "pdf" ? <Loader2 className="animate-spin" /> : <Download />} {busy === "pdf" ? t("site.certificate.preparing") : t("site.certificate.downloadPdf")}
          </Button>
        </div>
      </div>

      <FitToWidth>
        <CertificateSheet ref={sheetRef} cert={cert} />
      </FitToWidth>

      {cert.courseId && (
        <p className="text-center text-sm">
          <Link to={`/courses/${cert.courseId}`} className="text-primary hover:underline">{t("site.certificate.viewCourse")}</Link>
        </p>
      )}
    </div>
  )
}

// Scales the fixed-size sheet down to the available width
function FitToWidth({ children }) {
  const box = useRef(null)
  const [scale, setScale] = useState(1)
  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const update = () => setScale(Math.min(1, el.clientWidth / PAGE_W))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return (
    <div ref={box} className="w-full">
      <div className="overflow-hidden rounded-xl shadow-[0_20px_50px_-20px_rgb(13_11_97/0.35)]" style={{ height: PAGE_H * scale }}>
        <div style={{ width: PAGE_W, height: PAGE_H, transform: `scale(${scale})`, transformOrigin: "top left" }}>{children}</div>
      </div>
    </div>
  )
}

const NAVY = "#0D0B61"
const GOLD = "#B8893B"
const serif = { fontFamily: "'Playfair Display Variable', 'Noto Sans Khmer Variable', Georgia, serif" }

// The printable certificate. Fixed colours (not theme tokens) so it looks the same in dark mode and in the PDF.
const CertificateSheet = forwardRef(function CertificateSheet({ cert }, ref) {
  const { t } = useTranslation()
  const verifyUrl = `${window.location.host}/certificates/${cert.serialNo}`
  const qr = useQrCode(`${window.location.origin}/certificates/${cert.serialNo}`)

  return (
    <div
      ref={ref}
      className="relative overflow-hidden bg-white text-[#1f2340]"
      style={{ width: PAGE_W, height: PAGE_H, fontFamily: "'Geist Variable', 'Noto Sans Khmer Variable', system-ui, sans-serif" }}
    >
      {/* soft background: faint navy dots + corner washes */}
      <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(${NAVY}0d 1px, transparent 1px)`, backgroundSize: "18px 18px" }} />
      <div className="absolute -left-40 -top-40 size-[420px] rounded-full" style={{ background: `radial-gradient(circle, ${NAVY}14, transparent 70%)` }} />
      <div className="absolute -bottom-48 -right-40 size-[460px] rounded-full" style={{ background: `radial-gradient(circle, ${GOLD}1f, transparent 70%)` }} />

      {/* frame: navy band + thin gold line */}
      <div className="absolute inset-[22px] rounded-[6px]" style={{ border: `10px solid ${NAVY}` }} />
      <div className="absolute inset-[40px] rounded-[2px]" style={{ border: `1.5px solid ${GOLD}` }} />
      <Corner className="left-[46px] top-[46px]" />
      <Corner className="right-[46px] top-[46px] rotate-90" />
      <Corner className="bottom-[46px] right-[46px] rotate-180" />
      <Corner className="bottom-[46px] left-[46px] -rotate-90" />

      <div className="relative flex h-full flex-col items-center px-[120px] pb-[70px] pt-[78px] text-center">
        {/* brand */}
        <div className="flex items-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-xl text-white" style={{ background: NAVY }}>
            <GraduationCap className="size-6" />
          </span>
          <span className="text-[22px] font-bold tracking-tight" style={{ color: NAVY }}>Autumn</span>
        </div>

        {/* title */}
        <h1 className="mt-7 text-[54px] font-bold uppercase leading-none tracking-[0.18em]" style={{ ...serif, color: NAVY }}>
          {t("site.certificate.title")}
        </h1>
        <div className="mt-3 flex items-center gap-3">
          <span className="h-px w-14" style={{ background: GOLD }} />
          <p className="text-[15px] font-semibold uppercase tracking-[0.35em]" style={{ color: GOLD }}>{t("site.certificate.subtitle")}</p>
          <span className="h-px w-14" style={{ background: GOLD }} />
        </div>

        <p className="mt-9 text-[16px] text-[#5b6075]">{t("site.certificate.presentedTo")}</p>
        <p className="mt-2 max-w-full truncate text-[62px] font-semibold italic leading-[1.15]" style={{ ...serif, color: NAVY }}>
          {cert.studentName}
        </p>
        <Divider />
        <p className="mt-4 text-[16px] text-[#5b6075]">{t("site.certificate.forCompleting")}</p>
        <p className="mt-2 line-clamp-2 max-w-[760px] text-[28px] font-bold leading-tight" style={{ color: NAVY }}>{cert.courseTitle}</p>

        {/* signatures + seal */}
        <div className="mt-auto grid w-full grid-cols-[1fr_auto_1fr] items-end gap-10">
          <Signature label={t("site.certificate.dateIssued")} value={formatDate(cert.issuedAt)} />
          <Seal label={t("site.certificate.verifiedSeal")} score={cert.quizScore} />
          <Signature label={t("site.certificate.instructor")} value={cert.instructorName ?? "Autumn"} script />
        </div>

        {/* QR: scan to open the public verification page */}
        {qr && (
          <div className="absolute bottom-[60px] right-[62px] flex flex-col items-center gap-1">
            <img src={qr} alt="" className="size-[72px] rounded-md bg-white p-1" style={{ border: `1px solid ${GOLD}66` }} />
            <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#7a7f93]">{t("site.certificate.scanToVerify")}</span>
          </div>
        )}

        {/* serial */}
        <p className="mt-7 text-[11px] tracking-wide text-[#7a7f93]">
          {t("site.certificate.serialLabel")} <span className="font-mono font-semibold text-[#1f2340]">{cert.serialNo}</span>
          <span className="mx-2">·</span>
          {t("site.certificate.verifyAt")} <span className="font-mono">{verifyUrl}</span>
          {cert.quizScore != null && (
            <>
              <span className="mx-2">·</span>
              {t("site.certificate.score")} <span className="font-semibold text-[#1f2340]">{cert.quizScore}%</span>
            </>
          )}
        </p>
      </div>
    </div>
  )
})

// QR code (data URL) for the verification link, drawn in navy
function useQrCode(text) {
  const [src, setSrc] = useState(null)
  useEffect(() => {
    let alive = true
    import("qrcode")
      .then((QR) => QR.toDataURL(text, { margin: 0, width: 240, errorCorrectionLevel: "M", color: { dark: NAVY, light: "#ffffff" } }))
      .then((url) => alive && setSrc(url))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [text])
  return src
}

function Divider() {
  return (
    <div className="mt-3 flex items-center gap-2">
      <span className="h-px w-28" style={{ background: `linear-gradient(to right, transparent, ${GOLD})` }} />
      <span className="size-2 rotate-45" style={{ background: GOLD }} />
      <span className="h-px w-28" style={{ background: `linear-gradient(to left, transparent, ${GOLD})` }} />
    </div>
  )
}

function Signature({ label, value, script }) {
  return (
    <div className="flex flex-col items-center">
      <p className={script ? "text-[26px] font-semibold italic leading-tight" : "text-[19px] font-semibold"} style={script ? { ...serif, color: NAVY } : { color: NAVY }}>
        {value}
      </p>
      <span className="mt-2 h-px w-48 bg-[#c9ccd8]" />
      <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7a7f93]">{label}</p>
    </div>
  )
}

// Navy medal inside a gold laurel wreath (wreath from components/ui/award)
function Seal({ label, score }) {
  return (
    <div className="relative grid h-[150px] w-[200px] place-items-center">
      <LaurelWreath className="absolute inset-0 size-full" style={{ fill: GOLD }} />
      <div className="relative grid size-[96px] place-items-center rounded-full text-white" style={{ background: NAVY, boxShadow: `0 0 0 4px #fff, 0 0 0 6px ${GOLD}` }}>
        <div className="flex flex-col items-center">
          <GraduationCap className="size-7" />
          <span className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.15em]">{label}</span>
          {score != null && <span className="text-[10px] font-semibold opacity-80">{score}%</span>}
        </div>
      </div>
    </div>
  )
}

// Small gold L-shaped ornament for the frame corners
function Corner({ className }) {
  return (
    <svg viewBox="0 0 40 40" className={`absolute size-10 ${className}`}>
      <path d="M2 30V2h28" fill="none" stroke={GOLD} strokeWidth="2.5" />
      <path d="M8 22V8h14" fill="none" stroke={GOLD} strokeWidth="1.2" />
      <rect x="5" y="5" width="4" height="4" fill={GOLD} transform="rotate(45 7 7)" />
    </svg>
  )
}
