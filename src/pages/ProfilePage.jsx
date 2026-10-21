import { useEffect, useRef, useState } from "react"
import { Loader2, Check, KeyRound, Upload } from "lucide-react"
import { useShallow } from "zustand/react/shallow"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import FormField, { FormError } from "@/components/auth/FormField"
import { useAuthStore, selectDisplayUser } from "@/store"
import { getErrorMessage } from "@/lib/api"
import { NativeSelect } from "@/components/ui/native-select"
import { mediaService } from "@/services/media.service"
import { userService } from "@/services/user.service"
import { toast } from "@/lib/toast"

function AvatarUploadButton({ onUploaded }) {
  const input = useRef(null)
  const [busy, setBusy] = useState(false)
  return (
    <>
      <Button type="button" variant="outline" disabled={busy} onClick={() => input.current?.click()}>
        {busy ? <Loader2 className="animate-spin" /> : <Upload />} Upload
      </Button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const file = e.target.files?.[0]
          if (!file) return
          setBusy(true)
          try {
            onUploaded((await mediaService.upload(file)).uri)
          } finally {
            setBusy(false)
            e.target.value = ""
          }
        }}
      />
    </>
  )
}

// GET /users/me/password returns where to change it (Keycloak account console)
function ChangePasswordButton() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const open = async () => {
    setError("")
    setBusy(true)
    try {
      const res = await userService.passwordChangeLocation()
      const url = res?.url ?? res?.location ?? Object.values(res ?? {})[0]
      if (url) window.open(url, "_blank", "noopener")
      else setError("No password page configured.")
    } catch (err) {
      setError(getErrorMessage(err, "Couldn’t open the password page"))
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="flex flex-col items-start gap-1">
      <Button type="button" variant="outline" onClick={open} disabled={busy}>
        {busy ? <Loader2 className="animate-spin" /> : <KeyRound />} Change password
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

const toForm = (u) => ({
  displayName: u?.displayName ?? "",
  headline: u?.headline ?? "",
  bio: u?.bio ?? "",
  avatarUrl: u?.avatarUrl ?? "",
  gender: u?.gender ?? "",
  facebookProfile: u?.facebookProfile ?? "",
  telegramProfile: u?.telegramProfile ?? "",
})

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const isLoadingUser = useAuthStore((s) => s.isLoadingUser)
  const fetchMe = useAuthStore((s) => s.fetchMe)
  const updateMe = useAuthStore((s) => s.updateMe)
  const claims = useAuthStore((s) => s.claims)
  const display = useAuthStore(useShallow(selectDisplayUser))
  // Show app roles (ADMIN, INSTRUCTOR…), hide Keycloak defaults
  const roles = (claims?.realm_access?.roles ?? []).filter((r) => /^[A-Z_]+$/.test(r))

  const [form, setForm] = useState(() => toForm(user))
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchMe()
      .then((u) => setForm(toForm(u)))
      .catch((err) => setError(getErrorMessage(err, "Couldn’t load your profile")))
  }, [fetchMe])

  const onChange = (e) => {
    setSaved(false)
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!form.displayName.trim()) return setError("Display name is required.")
    setError("")
    setSaving(true)
    try {
      await updateMe(form)
      setSaved(true)
      toast.success("Profile updated")
    } catch (err) {
      setError(getErrorMessage(err, "Couldn’t save changes"))
      toast.error("Couldn’t save changes", err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6">
      <div className="flex items-center gap-4">
        <Avatar className="size-16">
          {form.avatarUrl && <AvatarImage src={form.avatarUrl} alt="" />}
          <AvatarFallback className="bg-accent text-lg text-accent-foreground">{display.initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight">{form.displayName || display.name}</h1>
          <p className="truncate text-sm text-muted-foreground">
            {display.username && `@${display.username}`}
            {display.username && display.email && " · "}
            {display.email}
          </p>
          {roles.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {roles.map((r) => <Badge key={r} variant="secondary">{r}</Badge>)}
            </div>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>This is how other learners and instructors see you.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingUser && !user ? (
            <div className="flex justify-center py-10">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <FormError message={error} />
              <FormField id="displayName" label="Display name" value={form.displayName} onChange={onChange} />
              <FormField id="headline" label="Headline" placeholder="e.g. Frontend developer & lifelong learner" value={form.headline} onChange={onChange} />
              <FormField id="bio" label="Bio" as={Textarea} rows={4} value={form.bio} onChange={onChange} />
              <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                <FormField id="avatarUrl" label="Avatar URL" type="url" placeholder="https://…" value={form.avatarUrl} onChange={onChange} />
                <AvatarUploadButton onUploaded={(uri) => onChange({ target: { name: "avatarUrl", value: uri } })} />
              </div>
              <FormField id="gender" label="Gender" as={NativeSelect} value={form.gender} onChange={onChange}>
                <option value="">Prefer not to say</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField id="facebookProfile" label="Facebook" placeholder="https://facebook.com/…" value={form.facebookProfile} onChange={onChange} maxLength={255} />
                <FormField id="telegramProfile" label="Telegram" placeholder="@username" value={form.telegramProfile} onChange={onChange} maxLength={255} />
              </div>
              <div className="flex items-center justify-end gap-3">
                {saved && (
                  <span className="flex items-center gap-1 text-sm text-primary">
                    <Check className="size-4" /> Saved
                  </span>
                )}
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="animate-spin" />}
                  Save changes
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Your password is managed by the sign-in service.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordButton />
        </CardContent>
      </Card>
    </div>
  )
}
