import * as React from "react"
import { Card as BaseCard, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { hoverEffects } from "@/lib/hover-effects"

/**
 * Glass UI Card — liquid glass surface (from @glass-ui, ported to JSX).
 *   <Card>Regular liquid glass</Card>
 *   <Card material="clear">Clear glass</Card>
 *   <Card material="tinted" tint="#8b5cf6">Tinted glass</Card>
 *   <Card glass={{ tint: "rgba(139, 92, 246, 0.6)", frost: 0.5 }} gradient animated>…</Card>
 */
export const Card = React.forwardRef(function Card({ className, gradient = false, animated = false, hover = "none", children, ...props }, ref) {
  return (
    <BaseCard
      ref={ref}
      className={cn(
        "relative overflow-hidden",
        // A violet wash through the glass (a background utility would replace the material)
        gradient && "[--lg-tint:oklch(0.62_0.2_290)] [--lg-tint-amt:14%]",
        animated && "transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_18px_40px_-16px_var(--lg-drop)]",
        hoverEffects({ hover }),
        className
      )}
      {...props}
    >
      {children}
    </BaseCard>
  )
})

export { CardContent, CardDescription, CardFooter, CardHeader, CardTitle }
export default Card
