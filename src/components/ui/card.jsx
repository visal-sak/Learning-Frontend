import * as React from "react"

import { cn } from "@/lib/utils"
import { liquidProps, resolveVariant } from "@/lib/liquid-glass/material"

/**
 * Card — liquid glass surface by default (@glass-ui). `variant="default"` gives the plain card.
 * Glass props: material ("regular" | "clear" | "tinted"), tint, glass { tint, frost }.
 */
function Card({ className, variant, material, tint, glass, style, ...props }) {
  const v = resolveVariant(variant, material)
  const base = "text-card-foreground flex flex-col gap-6 py-6"
  const own =
    v.variant === "liquid"
      ? liquidProps({ role: "surface", material: v.material, tint, glass, webgl: false }, { className: cn(base, className), style })
      : { className: cn(base, "rounded-xl border bg-card shadow-sm", className), style }

  return <div data-slot="card" {...own} {...props} />
}

function CardHeader({ className, ...props }) {
  return (
    <div
      data-slot="card-header"
      className={cn("grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto]", className)}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }) {
  return <div data-slot="card-title" className={cn("leading-none font-semibold", className)} {...props} />
}

function CardDescription({ className, ...props }) {
  return <div data-slot="card-description" className={cn("text-muted-foreground text-sm", className)} {...props} />
}

function CardAction({ className, ...props }) {
  return <div data-slot="card-action" className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)} {...props} />
}

function CardContent({ className, ...props }) {
  return <div data-slot="card-content" className={cn("px-6", className)} {...props} />
}

function CardFooter({ className, ...props }) {
  return <div data-slot="card-footer" className={cn("flex items-center px-6", className)} {...props} />
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent }
