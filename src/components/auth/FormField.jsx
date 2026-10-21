import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export default function FormField({ id, label, error, as: Comp = Input, ...props }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Comp id={id} name={id} aria-invalid={!!error} className={error ? "border-destructive" : undefined} {...props} />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

export function FormError({ message }) {
  if (!message) return null
  return (
    <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {message}
    </div>
  )
}
