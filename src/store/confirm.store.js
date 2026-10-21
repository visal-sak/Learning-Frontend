import { create } from "zustand"

// One app-wide confirmation dialog, driven imperatively:
//   if (!(await confirm({ title: "Delete course?", description: "…", confirmLabel: "Delete" }))) return
export const useConfirmStore = create((set, get) => ({
  open: false,
  options: null,
  resolve: null,

  ask: (options) =>
    new Promise((resolve) => {
      get().resolve?.(false) // a new request cancels any pending one
      set({ open: true, options, resolve })
    }),

  close: (result) => {
    get().resolve?.(result)
    set({ open: false, resolve: null })
  },
}))

/**
 * @param {{ title: string, description?: string, body?: React.ReactNode, confirmLabel?: string,
 *           cancelLabel?: string, tone?: "danger" | "warning" | "default", icon?: React.ComponentType }} options
 * @returns {Promise<boolean>}
 */
export const confirm = (options) => useConfirmStore.getState().ask(options)
