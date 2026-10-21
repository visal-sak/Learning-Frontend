import { forwardRef } from "react";
import { BorderBeam } from "border-beam";

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useThemeStore } from "@/store/theme.store"

export const BorderBeamButton = forwardRef(function BorderBeamButton(
  {
    beamSize = "md",
    borderBeamClassName,
    borderBeamStyle,
    theme,
    colorVariant = "forest",
    staticColors,
    duration,
    active,
    // Button corners are 11px + the 2px ring below = 13px
    borderRadius = 13,
    brightness,
    saturation,
    hueRange,
    strength,
    onActivate,
    onDeactivate,
    className,
    ...buttonProps
  },
  ref
) {
  // Follow the app’s light/dark toggle (theme store), not the OS preference.
  // The library’s light preset is very faint, so boost it on light backgrounds.
  const dark = useThemeStore((st) => st.dark)
  return (
    <BorderBeam
      active={active}
      borderRadius={borderRadius}
      brightness={brightness ?? (dark ? 1.6 : 2.4)}
      className={cn(
        // 2px ring around the button: the beam travels in this gap, so it stays visible even on a filled button
        "overflow-visible! inline-flex w-fit min-w-0 flex-col items-stretch rounded-[14px] p-[2px] leading-none",
        borderBeamClassName
      )}
      colorVariant={colorVariant}
      duration={duration}
      hueRange={hueRange}
      onActivate={onActivate}
      onDeactivate={onDeactivate}
      ref={ref}
      saturation={saturation ?? (dark ? undefined : 2.6)}
      size={beamSize}
      staticColors={staticColors}
      strength={strength}
      style={borderBeamStyle}
      theme={theme ?? (dark ? "dark" : "light")}
    >
      <Button className={className} {...buttonProps} />
    </BorderBeam>
  )
})

BorderBeamButton.displayName = "BorderBeamButton"

export const BorderBeamIconButton = forwardRef(function BorderBeamIconButton(
  { size = "icon-sm", className, ...props },
  ref
) {
  return (
    <BorderBeamButton
      className={cn("!leading-none [&_svg]:block [&_svg]:shrink-0", className)}
      ref={ref}
      size={size}
      {...props}
    />
  )
})

BorderBeamIconButton.displayName = "BorderBeamIconButton"
