import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useShallow } from "zustand/react/shallow"
import { IoBook } from "react-icons/io5"
import { MdDashboard } from "react-icons/md"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ConfirmDialogView } from "@/components/ConfirmDialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "@/lib/toast"
import { useAuthStore, selectDisplayUser } from "@/store"
import { useRoles } from "@/hooks/useRoles"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"

function ProfileIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" className={className} fill="currentColor" aria-hidden>
      <path d="M2.60518 13.1674C3.69058 10.7157 6.14168 9 8.99999 9C11.7634 9 14.1462 10.6037 15.2822 12.9257C15.3564 13.0774 15.4289 13.2326 15.4797 13.3894C15.8649 14.5805 15.1811 15.8552 13.9874 16.2313C12.705 16.6354 11.0072 17 8.99999 17C6.99283 17 5.29503 16.6354 4.01259 16.2313C2.74425 15.8317 2.05162 14.4186 2.60518 13.1674Z" />
      <path d="M9 7.50049C10.7952 7.50049 12.25 6.04543 12.25 4.25049C12.25 2.45554 10.7952 1.00049 9 1.00049C7.20482 1.00049 5.75 2.45554 5.75 4.25049C5.75 6.04543 7.20482 7.50049 9 7.50049Z" />
    </svg>
  )
}

function SignOutIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" className={className} fill="currentColor" aria-hidden>
      <path d="M11.75,11.5c-.414,0-.75,.336-.75,.75v2.5c0,.138-.112,.25-.25,.25H5.448l1.725-1.069c.518-.322,.827-.878,.827-1.487V5.557c0-.609-.31-1.166-.827-1.487l-1.725-1.069h5.302c.138,0,.25,.112,.25,.25v2.5c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V3.25c0-.965-.785-1.75-1.75-1.75H4.25c-.965,0-1.75,.785-1.75,1.75V14.75c0,.965,.785,1.75,1.75,1.75h6.5c.965,0,1.75-.785,1.75-1.75v-2.5c0-.414-.336-.75-.75-.75Z" />
      <path d="M17.78,8.47l-2.75-2.75c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l1.47,1.47h-4.189c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h4.189l-1.47,1.47c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l2.75-2.75c.293-.293,.293-.768,0-1.061Z" />
    </svg>
  )
}

function UserAvatar({ className, display, textClassName }) {
  return (
    <Avatar className={className}>
      {display.avatarUrl && <AvatarImage src={display.avatarUrl} alt="" />}
      <AvatarFallback className={cn("bg-muted font-semibold text-foreground", textClassName)}>{display.initials}</AvatarFallback>
    </Avatar>
  )
}

// Confirmation before ending the session — also used by the admin sidebar
export function SignOutDialog({ open, onOpenChange }) {
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <ConfirmDialogView
      open={open}
      onOpenChange={onOpenChange}
      icon={SignOutIcon}
      title={t("site.account.signOut.title")}
      description={t("site.account.signOut.description")}
      body={t("site.account.signOut.body")}
      confirmLabel={t("common.account.signOut")}
      onConfirm={async () => {
        await logout()
        onOpenChange(false)
        navigate("/")
        toast.success(t("site.account.signOut.done"), t("site.account.signOut.doneText"))
      }}
    />
  )
}

// Avatar button + account menu (Radix dropdown menu: fade/zoom/slide animation, arrow-key navigation)
export default function ProfileDropdown({ align = "end", side = "bottom", triggerClassName }) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const navigate = useNavigate()
  const display = useAuthStore(useShallow(selectDisplayUser))
  const { isStaff } = useRoles()
  const { t } = useTranslation()

  const items = [
    { key: "profile", label: t("common.account.profile"), icon: ProfileIcon, onSelect: () => navigate("/profile") },
    { key: "learning", label: t("common.account.myLearning"), icon: IoBook, onSelect: () => navigate("/my-learning") },
    isStaff && { key: "admin", label: t("common.account.dashboard"), icon: MdDashboard, onSelect: () => navigate("/admin") },
  ].filter(Boolean)

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={t("site.account.menu")}
            className={cn("flex rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50", triggerClassName)}
          >
            <UserAvatar className="size-8" display={display} textClassName="text-[11px]" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side={side} align={align} sideOffset={8} className="z-[99999] min-w-[224px] p-0 shadow-lg">
          {/* Header */}
          <DropdownMenuLabel className="border-b border-border px-4 py-3 font-normal">
            <div className="flex items-center gap-3">
              <UserAvatar className="size-8" display={display} textClassName="text-[11px]" />
              <div className="flex min-w-0 flex-col space-y-1">
                <p className="truncate text-xs leading-none font-semibold">{display.name || t("site.account.user")}</p>
                <p className="truncate text-xs leading-none text-muted-foreground">{display.email}</p>
              </div>
            </div>
          </DropdownMenuLabel>

          {/* Items */}
          <div className="p-1.5">
            {items.map(({ key, label, icon: Icon, onSelect }) => (
              <DropdownMenuItem key={key} onSelect={onSelect} className="gap-2.5 py-2 pr-2.5 pl-3.5">
                <Icon className="size-4" />
                <span className="flex-1 text-[13px] font-medium">{label}</span>
              </DropdownMenuItem>
            ))}
          </div>

          <DropdownMenuSeparator className="mx-1.5 my-0 bg-border" />

          <div className="p-1.5">
            <DropdownMenuItem
              onSelect={() => setConfirmOpen(true)}
              className="gap-2.5 py-2 pr-2.5 pl-3.5 text-[#EB4747] focus:bg-[#D73535] focus:text-white"
            >
              <SignOutIcon className="size-4" />
              <span className="flex-1 text-[13px] font-medium">{t("common.account.signOut")}</span>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <SignOutDialog open={confirmOpen} onOpenChange={setConfirmOpen} />
    </>
  )
}
