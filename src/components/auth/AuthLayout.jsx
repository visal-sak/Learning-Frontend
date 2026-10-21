import { Link } from "react-router-dom"
import { GraduationCap } from "lucide-react"

function Logo({ className }) {
  return (
    <Link to="/" className={`flex items-center gap-2 font-semibold ${className ?? ""}`}>
      <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
        <GraduationCap className="size-5" />
      </span>
      <span className="text-lg tracking-tight">Learnova</span>
    </Link>
  )
}

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden border-r bg-card lg:flex lg:flex-col lg:justify-between lg:p-10">
        <div className="pointer-events-none absolute -left-24 -top-24 size-96 rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 right-0 size-96 rounded-full bg-primary/10 blur-3xl" />
        <Logo className="relative" />
        <blockquote className="relative max-w-md space-y-3">
          <p className="text-2xl font-medium leading-snug tracking-tight">
            “The beautiful thing about learning is that nobody can take it away from you.”
          </p>
          <footer className="text-sm text-muted-foreground">— B.B. King</footer>
        </blockquote>
      </aside>

      <main className="flex items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-sm space-y-6">
          <Logo className="lg:hidden" />
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {children}
          {footer && <p className="text-center text-sm text-muted-foreground">{footer}</p>}
        </div>
      </main>
    </div>
  )
}
