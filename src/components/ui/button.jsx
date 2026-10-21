import * as React from "react"
import { Slot } from "radix-ui"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { liquidProps } from "@/lib/liquid-glass/material"

const buttonVariants = cva(
  // Compact app-wide style: 32px tall, 12px medium text, 11px corners, 14px icons
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[12px] text-[12px] font-medium transition-[scale,background,color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-3.5 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-ring/50 focus-visible:ring-2 cursor-pointer",
  {
    variants: {
      variant: {
        // Liquid glass (@glass-ui) — the material classes are added in <Button> below
        // tint is stronger on light backgrounds so white text stays readable
        // full tint so the button shows the brand colour (#0D0B61) as-is; hover lightens it a touch
        default: "font-semibold [--lg-tint-amt:100%] hover:[--lg-tint-amt:88%] dark:[--lg-tint-amt:90%] dark:hover:[--lg-tint-amt:80%]",
        liquid: "text-foreground hover:[--lg-base:rgba(255,255,255,0.62)] dark:hover:[--lg-base:rgba(255,255,255,0.13)]",
        outline: "text-foreground hover:[--lg-base:rgba(255,255,255,0.62)] dark:hover:[--lg-base:rgba(255,255,255,0.13)]",
        secondary: "text-secondary-foreground hover:[--lg-base:rgba(255,255,255,0.62)] dark:hover:[--lg-base:rgba(255,255,255,0.13)]",
        destructive: "font-semibold text-white [--lg-tint-amt:84%] hover:[--lg-tint-amt:94%] dark:[--lg-tint-amt:58%] dark:hover:[--lg-tint-amt:74%] focus-visible:ring-red-400/40",
        // Not glass
        solid: "border border-primary bg-primary text-primary-foreground shadow-[inset_0_1px_0_oklch(1_0_0/0.28)] hover:bg-primary/90",
        // flat secondary button: full 1px border, no glass, no shadow
        bordered: "border border-neutral-300 bg-white text-foreground hover:bg-neutral-50 dark:border-neutral-700 dark:bg-transparent dark:hover:bg-neutral-800",
        ghost: "text-foreground/85 hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-8 px-3",
        sm: "h-7 px-2.5",
        lg: "h-9 px-4 text-[13px]",
        icon: "size-8",
        "icon-sm": "size-7",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

// Which variants render as liquid glass, and with what material
const LIQUID = {
  default: { material: "tinted" },
  liquid: { material: "regular" },
  outline: { material: "regular" },
  secondary: { material: "regular" },
  destructive: { material: "tinted", tint: "var(--destructive)" },
}

/**
 * Button with liquid-glass variants (Glass UI). Extra props from the glass material:
 *   material: "regular" | "clear" | "tinted", tint: any CSS colour, glass: { tint, frost }
 */
function Button({ className, variant = "default", size, asChild = false, material, tint, glass, style, ...props }) {
  const Comp = asChild ? Slot.Root : "button"
  const preset = LIQUID[variant]
  const lg = preset
    ? liquidProps({ role: "control", material: material ?? preset.material, tint: tint ?? preset.tint, glass, webgl: false }, { style })
    : null

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      className={cn(lg?.className, buttonVariants({ variant, size }), className)}
      style={lg ? lg.style : style}
      {...props}
    />
  )
}

export { Button, buttonVariants }
