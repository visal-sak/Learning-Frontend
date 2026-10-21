import { api, unwrap } from "@/lib/api"

// Drop empty params so the backend never receives `?q=&categoryId=`
const clean = (params = {}) => Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v != null))

export const get = (url, params) => api.get(url, { params: clean(params) }).then(unwrap)
export const post = (url, body) => api.post(url, body).then(unwrap)
export const put = (url, body) => api.put(url, body).then(unwrap)
export const patch = (url, body) => api.patch(url, body).then(unwrap)
export const del = (url) => api.delete(url).then(unwrap)

// Lists may come back as an array or as a page { content: [...] }
export const toList = (data) => (Array.isArray(data) ? data : data?.content ?? [])
