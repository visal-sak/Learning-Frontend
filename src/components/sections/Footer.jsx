import { Link } from "react-router-dom"
import { GraduationCap } from "lucide-react"
import { FaGithub, FaYoutube, FaLinkedin, FaDiscord } from "react-icons/fa"
import { FaXTwitter } from "react-icons/fa6"
import { useTranslation } from "react-i18next"

// Column / item keys → site.footer.columns.* and site.footer.links.*
const columns = {
  learn: ["courses", "paths", "certificates", "resources"],
  company: ["about", "careers", "blog", "mentor"],
  support: ["help", "contact", "privacy", "terms"],
}
const socials = [FaGithub, FaXTwitter, FaYoutube, FaLinkedin, FaDiscord]
// Footer items that have a page in the app (the rest are placeholders)
const routes = { courses: "/courses", certificates: "/my-learning?tab=certificates", about: "/about" }

export default function Footer() {
  const { t } = useTranslation()
  return (
    <footer className="mt-8 border-t border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-5">
        <div className="md:col-span-2">
          <a href="#" className="flex items-center gap-2 font-semibold">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="size-5" />
            </span>
            <span className="text-lg">Autumn</span>
          </a>
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            {t("site.footer.tagline")}
          </p>
          <div className="mt-6 flex gap-2">
            {socials.map((Icon, i) => (
              <a key={i} href="#" className="grid size-9 place-items-center rounded-md border text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary">
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>
        {Object.entries(columns).map(([title, items]) => (
          <div key={title}>
            <h4 className="mb-4 text-sm font-semibold">{t(`site.footer.columns.${title}`)}</h4>
            <ul className="space-y-2">
              {items.map((item) => (
                <li key={item}>
                  {routes[item] ? (
                    <Link to={routes[item]} className="text-sm text-muted-foreground hover:text-foreground">{t(`site.footer.links.${item}`)}</Link>
                  ) : (
                    <a href="#" className="text-sm text-muted-foreground hover:text-foreground">{t(`site.footer.links.${item}`)}</a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-neutral-200/80 py-6 text-center dark:border-neutral-800 text-xs text-muted-foreground">
        {t("site.footer.rights", { year: new Date().getFullYear() })}
      </div>
    </footer>
  )
}
