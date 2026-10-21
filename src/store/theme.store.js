import { create } from "zustand"
import { persist } from "zustand/middleware"

export const useThemeStore = create(
  persist(
    (set) => ({
      dark: true, // dark by default
      toggle: () => set((s) => ({ dark: !s.dark })),
    }),
    { name: "theme-store" }
  )
)

// Apply the class on load and whenever it changes
const apply = (dark) => document.documentElement.classList.toggle("dark", dark)
apply(useThemeStore.getState().dark)
useThemeStore.subscribe((s) => apply(s.dark))
