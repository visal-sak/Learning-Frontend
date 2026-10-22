import { ArrowRight, PlayCircle } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { BorderBeamButton } from "@/components/ui/border-beam-button"
import { useAuthStore } from "@/store"
import { Badge } from "@/components/ui/badge"
import { TextGif } from "@/components/ui/text-gif"
import { useTranslation } from "react-i18next"

// GIF used as the fill of the highlighted words (cult-ui preset #4)
const HERO_GIF = "https://media.giphy.com/media/4bhs1boql4XVJgmm4H/giphy.gif"

export default function Hero() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const isAuthed = useAuthStore((s) => !!s.accessToken)
  const startLogin = useAuthStore((s) => s.startLogin)
  // Logged in → catalogue; visitor → Keycloak sign-up, then back to the catalogue
  const startLearning = () => (isAuthed ? navigate("/courses") : startLogin({ action: "register", returnTo: "/courses" }))

  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto flex max-w-4xl flex-col items-center px-4 py-20 text-center sm:px-6 md:py-28">
        <Badge variant="outline" className="mb-6 gap-1.5 rounded-full px-3 py-1 text-xs">
          <span className="size-1.5 rounded-full bg-primary" /> {t("site.home.hero.badge")}
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
          {t("site.home.hero.titleStart")}{" "}
          <TextGif
            gifUrl={HERO_GIF}
            text={t("site.home.hero.titleHighlight")}
            size="inherit"
            weight="inherit"
            fallbackColor="var(--primary)"
            className="pb-0 md:pb-0"
          />{" "}
          {t("site.home.hero.titleEnd")}
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground text-pretty">
          {t("site.home.hero.subtitle")}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <BorderBeamButton size="lg" onClick={startLearning}>
            {t("site.home.hero.start")} <ArrowRight />
          </BorderBeamButton>
          <BorderBeamButton size="lg" variant="outline">
            <PlayCircle /> {t("site.home.hero.demo")}
          </BorderBeamButton>
        </div>
      </div>
    </section>
  )
}
