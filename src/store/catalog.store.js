import { create } from "zustand"
import { categoryService } from "@/services/category.service"

// Categories are shared by the homepage, catalogue filters and course forms — fetch once, reuse everywhere
export const useCatalogStore = create((set, get) => ({
  categories: [],
  categoriesStatus: "idle", // idle | loading | success | error
  categoriesError: null,

  fetchCategories: async ({ force = false } = {}) => {
    const { categoriesStatus } = get()
    if (!force && (categoriesStatus === "loading" || categoriesStatus === "success")) return get().categories
    set({ categoriesStatus: "loading", categoriesError: null })
    try {
      const categories = await categoryService.list()
      set({ categories: Array.isArray(categories) ? categories : [], categoriesStatus: "success" })
      return categories
    } catch (err) {
      set({ categoriesStatus: "error", categoriesError: err })
      throw err
    }
  },

  createCategory: async (payload) => {
    await categoryService.create(payload)
    return get().fetchCategories({ force: true })
  },
  updateCategory: async (id, payload) => {
    await categoryService.update(id, payload)
    return get().fetchCategories({ force: true })
  },
  deleteCategory: async (id) => {
    await categoryService.remove(id)
    set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }))
  },
}))
