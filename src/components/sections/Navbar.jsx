import { useState } from "react"
import { Link, NavLink, useLocation } from "react-router-dom"
import { env, isManualRedirect } from "@/config/env"
import { GraduationCap, Menu, X, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import ProfileDropdown from "@/components/ProfileDropdown"
import { useAuthStore, useThemeStore } from "@/store"
import { useRoles } from "@/hooks/useRoles"
import { useTranslation } from "react-i18next"
import LanguageSwitch from "@/components/LanguageSwitch"
import NotificationBell from "@/components/NotificationBell"

function useNavLinks() {
  const isAuthed = useAuthStore((s) => !!s.accessToken)
  const { isStaff } = useRoles()
  const { t } = useTranslation()
  return [
    { label: t("common.nav.courses"), to: "/courses" },
    isAuthed && { label: t("common.nav.myLearning"), to: "/my-learning" },
    { label: t("common.nav.aboutUs"), to: "/about" },
    isStaff && { label: t("common.nav.dashboard"), to: "/admin" },
  ].filter(Boolean)
}

// Log in / Sign up: straight to the Keycloak forms (PKCE), coming back to the current page afterwards
function AuthButtons({ size, loginVariant }) {
  const startLogin = useAuthStore((s) => s.startLogin)
  const { t } = useTranslation()
  const location = useLocation()
  const direct = env.authFlow === "pkce" && !isManualRedirect
  const returnTo = location.pathname + location.search

  if (!direct) {
    return (
      <>
        <Button variant={loginVariant} size={size} asChild><Link to="/login" state={{ from: location }}>{t("common.nav.logIn")}</Link></Button>
        <Button size={size} asChild><Link to="/register">{t("common.nav.signUp")}</Link></Button>
      </>
    )
  }
  return (
    <>
      <Button variant={loginVariant} size={size} onClick={() => startLogin({ returnTo })}>{t("common.nav.logIn")}</Button>
      <Button size={size} onClick={() => startLogin({ returnTo, action: "register" })}>{t("common.nav.signUp")}</Button>
    </>
  )
}

// Hash links (e.g. "/#section") need a plain <a> so the browser scrolls to the section
// The current page's link is underlined in navy (Courses also stays active on a course page)
const activeLink = "font-medium text-foreground underline decoration-primary decoration-2 underline-offset-[6px]"

function NavItem({ link, className, ...props }) {
  if (link.to.includes("#")) return <a href={link.to} className={className} {...props}>{link.label}</a>
  return (
    <NavLink to={link.to} className={({ isActive }) => cn(className, isActive && activeLink)} {...props}>
      {link.label}
    </NavLink>
  )
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const dark = useThemeStore((s) => s.dark)
  const toggleTheme = useThemeStore((s) => s.toggle)
  const isAuthed = useAuthStore((s) => !!s.accessToken)
  const links = useNavLinks()
  const { t } = useTranslation()

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      {/* logo | centred menu | actions */}
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 md:grid md:grid-cols-[1fr_auto_1fr]">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="size-5" />
          </span>
          <span className="text-lg tracking-tight">Autumn</span>
        </Link>

        <ul className="hidden items-center justify-center gap-1 md:flex">
          {links.map((l) => (
            <li key={l.to}>
              <NavItem link={l} className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground" />
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-end gap-1">
          <LanguageSwitch className="mr-1 hidden sm:inline-flex" />
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={t("common.theme.toggle")}>
            {dark ? <Sun /> : <Moon />}
          </Button>
          {isAuthed && <NotificationBell />}
          {isAuthed ? (
            <ProfileDropdown triggerClassName="ml-1" />
          ) : (
            <div className="hidden items-center gap-1 sm:flex">
              <AuthButtons size="sm" loginVariant="ghost" />
            </div>
          )}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(!open)} aria-label={t("common.nav.menu")}>
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-neutral-200/80 px-4 pb-4 md:hidden dark:border-neutral-800">
          <div className="h-2" />
          {links.map((l) => (
            <NavItem
              key={l.to}
              link={l}
              onClick={() => setOpen(false)}
              className="block rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
            />
          ))}
          <LanguageSwitch className="mt-3 sm:hidden" />
          {!isAuthed && (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:hidden">
              <AuthButtons loginVariant="outline" />
            </div>
          )}
        </div>
      )}
    </header>
  )
}
