import { del, get, post, put } from "./http"

export const categoryService = {
  list: () => get("/categories"),
  getById: (id) => get(`/categories/${id}`),
  getBySlug: (slug) => get(`/categories/slug/${slug}`),
  // { name*, description }
  create: (payload) => post("/categories", payload),
  update: (id, payload) => put(`/categories/${id}`, payload),
  remove: (id) => del(`/categories/${id}`),
}
