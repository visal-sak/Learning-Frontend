import * as React from "react"
import { Button as BaseButton } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { hoverEffects } from "@/lib/hover-effects"

/**
 * Glass UI Button — liquid glass by default (from @glass-ui, ported to JSX).
 *   <Button>Continue</Button>
 *   <Button material="clear">Clear glass</Button>
 *   <Button material="tinted" tint="#3b82f6">Tinted</Button>
 *   <Button glass={{ tint: "rgba(59, 130, 246, 0.6)", frost: 0.4 }}>Custom</Button>
 * effect: "none" | "glow" | "shimmer" | "ripple" | "lift" | "scale"
 */
export const Button = React.forwardRef(function Button({ className, effect = "none", variant = "liquid", ...props }, ref) {
  return <BaseButton ref={ref} variant={variant} className={cn("relative overflow-hidden", hoverEffects({ hover: effect }), className)} {...props} />
})

export default Button
