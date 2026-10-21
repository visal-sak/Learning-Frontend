import { api, unwrap } from "@/lib/api"
import { del, get, put } from "./http"

const multipart = { headers: { "Content-Type": "multipart/form-data" } }

export const mediaService = {
  // PageResponse<MediaResponse { id, name, extension, mediaType, size, measurement, uri }>
  list: ({ page = 0, size = 25 } = {}) => get("/medias", { pageNumber: page, pageSize: size }),
  findByName: (name) => get(`/medias/${name}`),
  upload: (file, onProgress) => {
    const fd = new FormData()
    fd.append("file", file)
    return api
      .post("/medias", fd, { ...multipart, onUploadProgress: (e) => onProgress?.(Math.round((e.loaded / (e.total || 1)) * 100)) })
      .then(unwrap)
  },
  uploadMany: (files) => {
    const fd = new FormData()
    Array.from(files).forEach((f) => fd.append("files", f))
    return api.post("/medias/multiples", fd, multipart).then(unwrap)
  },
  remove: (name) => del(`/medias/${name}`),
  markDraft: (name) => put(`/medias/${name}/is-draft`),
}
