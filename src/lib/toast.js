import { createElement } from "react"
import { gooeyToast } from "goey-toast"
import { FaCircleCheck, FaCircleInfo, FaCircleXmark, FaTriangleExclamation } from "react-icons/fa6"
import { getErrorMessage } from "@/lib/api"

// Filled icons per toast type (replace goey-toast's outline defaults)
const icon = (Icon, className) => createElement(Icon, { className: `size-4 ${className}`, "aria-hidden": true })
const icons = {
  success: () => icon(FaCircleCheck, "text-emerald-500"),
  error: () => icon(FaCircleXmark, "text-red-500"),
  warning: () => icon(FaTriangleExclamation, "text-amber-500"),
  info: () => icon(FaCircleInfo, "text-sky-500"),
}

const opts = (type, description) => ({ icon: icons[type](), ...(description ? { description } : {}) })

// Thin wrapper so call sites stay short and consistent
export const toast = {
  success: (title, description) => gooeyToast.success(title, opts("success", description)),
  info: (title, description) => gooeyToast.info(title, opts("info", description)),
  warning: (title, description) => gooeyToast.warning(title, opts("warning", description)),
  // Accepts an error object (message extracted from the API response) or a string
  error: (title, err) => gooeyToast.error(title, opts("error", err ? (typeof err === "string" ? err : getErrorMessage(err)) : undefined)),
}
