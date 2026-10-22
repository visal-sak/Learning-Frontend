import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import { IoIosPlayCircle } from "react-icons/io"
import { MdQuiz, MdWorkspacePremium, MdVerified } from "react-icons/md"
import { HiAcademicCap, HiLightningBolt, HiUserGroup } from "react-icons/hi"
import { RiHeart3Fill } from "react-icons/ri"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"

const CARD = "rounded-2xl border border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-900"

// title/text: site.about.steps.<key>.*
const STEPS = [
  { key: "learn", icon: IoIosPlayCircle, tone: "bg-sky-500/12 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300" },
  { key: "practice", icon: MdQuiz, tone: "bg-teal-500/12 text-teal-600 dark:bg-teal-500/20 dark:text-teal-300" },
  { key: "certify", icon: MdWorkspacePremium, tone: "bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300" },
]

// title/text: site.about.values.<key>.*
const VALUES = [
  { key: "practical", icon: HiLightningBolt },
  { key: "honest", icon: MdVerified },
  { key: "instructors", icon: HiUserGroup },
  { key: "free", icon: RiHeart3Fill },
]

export default function AboutPage() {
  const { t } = useTranslation()
  return (
    <div className="mx-auto max-w-6xl space-y-16 px-4 py-14 sm:px-6">
      {/* Hero */}
      <section className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <HiAcademicCap className="size-4" /> {t("site.about.badge")}
        </span>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">{t("site.about.title")}</h1>
        <p className="mt-4 text-lg font-medium text-muted-foreground">
          {t("site.about.intro")}
        </p>
      </section>

      {/* Mission */}
      <section className={cn(CARD, "grid gap-6 p-6 sm:p-10 md:grid-cols-[220px_1fr] md:items-center")}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">{t("site.about.missionLabel")}</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">{t("site.about.missionTitle")}</h2>
        </div>
        <p className="leading-relaxed text-foreground/80">
          {t("site.about.missionText")}
        </p>
      </section>

      {/* How it works */}
      <section>
        <div className="mb-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight">{t("site.about.howTitle")}</h2>
          <p className="mt-2 text-muted-foreground">{t("site.about.howSubtitle")}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.key} className={cn(CARD, "p-6")}>
              <div className="flex items-center justify-between">
                <span className={cn("grid size-11 place-items-center rounded-xl", s.tone)}>
                  <s.icon className="size-6" />
                </span>
                <span className="text-sm font-bold text-muted-foreground tabular-nums">0{i + 1}</span>
              </div>
              <h3 className="mt-4 text-lg font-bold">{t(`site.about.steps.${s.key}.title`)}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t(`site.about.steps.${s.key}.text`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section>
        <div className="mb-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight">{t("site.about.valuesTitle")}</h2>
          <p className="mt-2 text-muted-foreground">{t("site.about.valuesSubtitle")}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {VALUES.map((v) => (
            <div key={v.key} className={cn(CARD, "flex gap-4 p-5")}>
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <v.icon className="size-5" />
              </span>
              <div>
                <h3 className="font-bold">{t(`site.about.values.${v.key}.title`)}</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">{t(`site.about.values.${v.key}.text`)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden rounded-2xl bg-primary px-6 py-12 text-center text-primary-foreground sm:px-12">
        <span className="pointer-events-none absolute -left-16 -top-16 size-56 rounded-full bg-white/10" />
        <span className="pointer-events-none absolute -bottom-20 -right-10 size-64 rounded-full bg-white/10" />
        <div className="relative">
          <h2 className="text-3xl font-bold tracking-tight">{t("site.about.ctaTitle")}</h2>
          <p className="mx-auto mt-2 max-w-xl opacity-80">{t("site.about.ctaText")}</p>
          <Button size="lg" asChild className="mt-6 bg-white text-[#0d0b61] [--lg-tint:#ffffff] hover:[--lg-tint-amt:90%]">
            <Link to="/courses">{t("site.about.ctaButton")} <ArrowRight /></Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
