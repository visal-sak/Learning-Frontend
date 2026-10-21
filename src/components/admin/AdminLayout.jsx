import { useEffect, useState } from "react"
import { WiDirectionLeft } from "react-icons/wi"
import { Link, Outlet, useLocation } from "react-router-dom"
import { useShallow } from "zustand/react/shallow"
import {
  GraduationCap, Menu, X, LogOut, Moon, Sun,
} from "lucide-react"
import { TbApps, TbLibraryPhoto, TbClipboardCheck } from "react-icons/tb"
import { BiBookOpen } from "react-icons/bi"
import { LuFileCheck } from "react-icons/lu"
import { RiStackLine } from "react-icons/ri"
import ErrorBoundary from "@/components/ErrorBoundary"
import AdminBreadcrumb from "@/components/admin/AdminBreadcrumb"
import ProfileDropdown, { SignOutDialog } from "@/components/ProfileDropdown"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sidebar, SidebarFooter, SidebarHeader, SidebarItem, SidebarNav, SidebarSection, SidebarToggle, useSidebar } from "@/components/ui/sidebar"
import { useAuthStore, useThemeStore, selectDisplayUser } from "@/store"
import { useRoles } from "@/hooks/useRoles"
import { useFetch } from "@/hooks/useFetch"
import { courseService } from "@/services/course.service"

const COLLAPSE_KEY = "admin-sidebar-collapsed"
// Outline react-icons for the nav; `size` can shrink a visually denser glyph
const icon = (Icon, size = "size-[18px]") => <Icon className={size} aria-hidden />

function useNavSections() {
  const { isAdmin } = useRoles()
  // Pending-review count for the badge (admins only)
  const { data: pending } = useFetch(() => (isAdmin ? courseService.pendingReview() : Promise.resolve([])), [isAdmin])
  const pendingCount = Array.isArray(pending) ? pending.length : 0

  return [
    {
      label: "Workspace",
      items: [
        { to: "/admin", label: "Overview", icon: TbApps, end: true },
        { to: "/admin/courses", label: "My courses", icon: BiBookOpen },
        { to: "/admin/reviews", label: "Student reviews", icon: LuFileCheck },
        { to: "/admin/media", label: "Media library", icon: TbLibraryPhoto },
      ],
    },
    isAdmin && {
      label: "Administration",
      items: [
        { to: "/admin/review-queue", label: "Review queue", icon: TbClipboardCheck, badge: pendingCount || null },
        { to: "/admin/categories", label: "Categories", icon: RiStackLine },
      ],
    },
  ].filter(Boolean)
}

function CountBadge({ children }) {
  return (
    <span className="rounded-md bg-[color-mix(in_srgb,var(--foreground)_7%,transparent)] px-1.5 py-0.5 text-[10.5px] font-medium leading-none text-muted-foreground tabular-nums">
      {children}
    </span>
  )
}

function BrandMark() {
  const { collapsed } = useSidebar()
  const { isAdmin } = useRoles()
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-[8px] bg-primary text-primary-foreground">
        <GraduationCap className="size-4" />
      </div>
      {!collapsed && (
        <>
          <span className="truncate text-[13.5px] font-semibold leading-none">Learnova</span>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {isAdmin ? "Admin" : "Instructor"}
          </span>
        </>
      )}
    </div>
  )
}

function UserFooter({ onNavigate }) {
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
        <Button variant="ghost" size="icon-sm" onClick={() => setConfirmSignOut(true)} aria-label="Sign out" title="Sign out">
          <LogOut />
        </Button>
      )}
      <SignOutDialog open={confirmSignOut} onOpenChange={setConfirmSignOut} />
    </>
  )
}

function AdminSidebar({ variant, collapsed, onCollapsedChange, onNavigate, width = 248 }) {
  const { pathname } = useLocation()
  const sections = useNavSections()
  const isActive = (item) => (item.end ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`))

  return (
    <Sidebar
      variant={variant}
      collapsed={collapsed}
      onCollapsedChange={onCollapsedChange}
      width={width}
      aria-label="Dashboard navigation"
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
                badge={item.badge ? <CountBadge>{item.badge}</CountBadge> : undefined}
                onClick={onNavigate}
              >
                {item.label}
              </SidebarItem>
            ))}
          </SidebarSection>
        ))}
        <SidebarSection>
          <SidebarItem to="/" icon={<WiDirectionLeft className="size-[22px]" />} onClick={onNavigate}>Back to site</SidebarItem>
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
            <Button variant="ghost" size="icon" className="absolute top-2.5 right-2" onClick={() => setMobileOpen(false)} aria-label="Close menu">
              <X />
            </Button>
          </div>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 flex h-[52px] items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu />
          </Button>
          <AdminBreadcrumb />
          <Button variant="ghost" size="icon" className="ml-auto" onClick={toggleTheme} aria-label="Toggle theme">
            {dark ? <Sun /> : <Moon />}
          </Button>
          <ProfileDropdown />
        </header>
        {/* Full-width content, 20px padding on every side */}
        <main className="w-full p-5">
          <ErrorBoundary resetKey={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
