import { MdAdminPanelSettings, MdSchool } from "react-icons/md"
import { CountBadge } from "@/components/ui/count-badge"
import { cn } from "@/lib/utils"
import { Suspense, useEffect, useState } from "react"
import { WiDirectionLeft } from "react-icons/wi"
import { Link, Outlet, useLocation } from "react-router-dom"
import { LoadingState } from "@/components/course/CourseBits"
import { useShallow } from "zustand/react/shallow"
import { useTranslation } from "react-i18next"
import {
  GraduationCap, Menu, X, LogOut, Moon, Sun,
} from "lucide-react"
import { TbApps, TbLibraryPhoto, TbClipboardCheck, TbReportAnalytics, TbFlag, TbCertificate } from "react-icons/tb"
import { BiBookOpen } from "react-icons/bi"
import { LuFileCheck } from "react-icons/lu"
import { RiStackLine } from "react-icons/ri"
import ErrorBoundary from "@/components/ErrorBoundary"
import AdminBreadcrumb from "@/components/admin/AdminBreadcrumb"
import LanguageSwitch from "@/components/LanguageSwitch"
import NotificationBell from "@/components/NotificationBell"
import ProfileDropdown, { SignOutDialog } from "@/components/ProfileDropdown"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sidebar, SidebarFooter, SidebarHeader, SidebarItem, SidebarNav, SidebarSection, SidebarToggle, useSidebar } from "@/components/ui/sidebar"
import { useAuthStore, useThemeStore, selectDisplayUser } from "@/store"
import { useRoles } from "@/hooks/useRoles"
import { useFetch } from "@/hooks/useFetch"
import { courseService } from "@/services/course.service"
import { moderationService } from "@/services/moderation.service"

const COLLAPSE_KEY = "admin-sidebar-collapsed"
// Outline react-icons for the nav; `size` can shrink a visually denser glyph
const icon = (Icon, size = "size-[18px]") => <Icon className={size} aria-hidden />

function useNavSections() {
  const { t } = useTranslation()
  const { isAdmin } = useRoles()
  // Pending-review count for the badge (admins only)
  const { data: pending } = useFetch(() => (isAdmin ? courseService.pendingReview() : Promise.resolve([])), [isAdmin])
  const pendingCount = Array.isArray(pending) ? pending.length : 0
  // Open review reports for the Moderation badge (admins only)
  const { data: modSummary } = useFetch(() => (isAdmin ? moderationService.summary() : Promise.resolve(null)), [isAdmin])
  const openReports = modSummary?.openReviewReports ?? 0

  return [
    {
      label: t("admin.nav.workspace"),
      items: [
        { to: "/admin", label: t("admin.nav.overview"), icon: TbApps, end: true },
        { to: "/admin/courses", label: t("admin.nav.myCourses"), icon: BiBookOpen },
        { to: "/admin/reviews", label: t("admin.nav.studentReviews"), icon: LuFileCheck },
        { to: "/admin/media", label: t("admin.nav.mediaLibrary"), icon: TbLibraryPhoto },
        { to: "/admin/assessments", label: t("admin.nav.assessments"), icon: TbReportAnalytics },
        { to: "/admin/certificates", label: t("admin.nav.certificates"), icon: TbCertificate },
      ],
    },
    isAdmin && {
      label: t("admin.nav.administration"),
      items: [
        { to: "/admin/review-queue", label: t("admin.nav.reviewQueue"), icon: TbClipboardCheck, badge: pendingCount || null },
        { to: "/admin/categories", label: t("admin.nav.categories"), icon: RiStackLine },
        { to: "/admin/moderation", label: t("admin.nav.moderation"), icon: TbFlag, badge: openReports || null },
      ],
    },
  ].filter(Boolean)
}

function SidebarCount({ children }) {
  return <CountBadge className="bg-rose-500/12 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">{children}</CountBadge>
}

function BrandMark() {
  const { t } = useTranslation()
  const { collapsed } = useSidebar()
  const { isAdmin } = useRoles()
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-[8px] bg-primary text-primary-foreground">
        <GraduationCap className="size-4" />
      </div>
      {!collapsed && (
        <>
          <span className="truncate text-[13.5px] font-semibold leading-none">Autumn</span>
          {/* role pill: navy for admins, violet for instructors */}
          <span
            className={cn(
              "inline-flex h-5 shrink-0 items-center gap-1 rounded-full pl-1.5 pr-2 text-[11px] font-semibold leading-none ring-1 ring-inset",
              isAdmin
                ? "bg-primary/10 text-primary ring-primary/15 dark:bg-primary/20"
                : "bg-violet-500/10 text-violet-700 ring-violet-500/20 dark:text-violet-300"
            )}
          >
            {isAdmin ? <MdAdminPanelSettings className="size-3.5" /> : <MdSchool className="size-3.5" />}
            {isAdmin ? t("admin.roles.admin") : t("admin.roles.instructor")}
          </span>
        </>
      )}
    </div>
  )
}

function UserFooter({ onNavigate }) {
  const { t } = useTranslation()
  const { collapsed } = useSidebar()
  const display = useAuthStore(useShallow(selectDisplayUser))
  const [confirmSignOut, setConfirmSignOut] = useState(false)
  return (
    <>
      <Link to="/profile" onClick={onNavigate} title={collapsed ? display.name : undefined} className={collapsed ? "flex justify-center" : "flex min-w-0 flex-1 items-center gap-2.5"}>
        <Avatar className="size-7 shrink-0">
          {display.avatarUrl && <AvatarImage src={display.avatarUrl} alt="" />}
          <AvatarFallback className="bg-muted text-[10px] font-semibold text-foreground">{display.initials}</AvatarFallback>
        </Avatar>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12.5px] font-medium leading-tight">{display.name}</div>
            <div className="truncate text-[11px] leading-tight text-muted-foreground">{display.email}</div>
          </div>
        )}
      </Link>
      {!collapsed && (
        <Button variant="ghost" size="icon-sm" onClick={() => setConfirmSignOut(true)} aria-label={t("common.account.signOut")} title={t("common.account.signOut")}>
          <LogOut />
        </Button>
      )}
      <SignOutDialog open={confirmSignOut} onOpenChange={setConfirmSignOut} />
    </>
  )
}

function AdminSidebar({ variant, collapsed, onCollapsedChange, onNavigate, width = 248 }) {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const sections = useNavSections()
  const isActive = (item) => (item.end ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`))

  return (
    <Sidebar
      variant={variant}
      collapsed={collapsed}
      onCollapsedChange={onCollapsedChange}
      width={width}
      aria-label={t("admin.nav.ariaLabel")}
      className="bg-card"
    >
      <SidebarHeader>
        <BrandMark />
        <SidebarToggle className="ml-auto" />
      </SidebarHeader>
      <SidebarNav>
        {sections.map((section) => (
          <SidebarSection key={section.label} label={section.label}>
            {section.items.map((item) => (
              <SidebarItem
                key={item.to}
                to={item.to}
                icon={icon(item.icon, item.iconSize)}
                active={isActive(item)}
                badge={item.badge ? <SidebarCount>{item.badge}</SidebarCount> : undefined}
                onClick={onNavigate}
              >
                {item.label}
              </SidebarItem>
            ))}
          </SidebarSection>
        ))}
        <SidebarSection>
          <SidebarItem to="/" icon={<WiDirectionLeft className="size-[22px]" />} onClick={onNavigate}>{t("admin.nav.backToSite")}</SidebarItem>
        </SidebarSection>
      </SidebarNav>
      <SidebarFooter>
        <UserFooter onNavigate={onNavigate} />
      </SidebarFooter>
    </Sidebar>
  )
}

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === "1"
  } catch {
    return false
  }
}

export default function AdminLayout() {
  const { t } = useTranslation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const dark = useThemeStore((s) => s.dark)
  const toggleTheme = useThemeStore((s) => s.toggle)
  const location = useLocation()

  const onCollapsedChange = (next) => {
    setCollapsed(next)
    try {
      localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0")
    } catch { /* ignore */ }
  }

  // Close the mobile drawer with Esc
  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e) => e.key === "Escape" && setMobileOpen(false)
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [mobileOpen])

  return (
    <div className="flex min-h-screen">
      {/* Desktop: collapsible rail */}
      <aside className="sticky top-0 hidden h-screen lg:block">
        <AdminSidebar variant="collapsible" collapsed={collapsed} onCollapsedChange={onCollapsedChange} />
      </aside>

      {/* Mobile: slide-in drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 max-w-[85vw] shadow-xl animate-in slide-in-from-left duration-200">
            <AdminSidebar variant="default" width={272} onNavigate={() => setMobileOpen(false)} />
            <Button variant="ghost" size="icon" className="absolute top-2.5 right-2" onClick={() => setMobileOpen(false)} aria-label={t("admin.nav.closeMenu")}>
              <X />
            </Button>
          </div>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 flex h-[52px] items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label={t("admin.nav.openMenu")}>
            <Menu />
          </Button>
          <AdminBreadcrumb />
          <LanguageSwitch className="ml-auto" />
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={t("common.theme.toggle")}>
            {dark ? <Sun /> : <Moon />}
          </Button>
          <NotificationBell />
          <ProfileDropdown />
        </header>
        {/* Full-width content, 20px padding on every side */}
        <main className="w-full p-5">
          <ErrorBoundary resetKey={location.pathname}>
            {/* Own loading boundary: opening a page swaps only this area, the sidebar and header stay put */}
            <Suspense fallback={<LoadingState />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
