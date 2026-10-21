import { useRef, useState } from "react"
import { Upload, Trash2, Copy, Check, Loader2, FileVideo, FileText, FileArchive, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/admin/AdminUI"
import { EmptyState, ErrorState, LoadingState } from "@/components/course/CourseBits"
import { FormError } from "@/components/auth/FormField"
import { useFetch } from "@/hooks/useFetch"
import { mediaService } from "@/services/media.service"
import { toList } from "@/services/http"
import { getErrorMessage } from "@/lib/api"
import { confirm } from "@/store/confirm.store"
import { toast } from "@/lib/toast"

const isImage = (m) => /^image\//.test(m.mediaType ?? "") || /^(png|jpe?g|gif|webp|svg|avif)$/i.test(m.extension ?? "")
const isVideo = (m) => /^video\//.test(m.mediaType ?? "") || /^(mp4|webm|mov|mkv)$/i.test(m.extension ?? "")

export default function MediaPage() {
  const [page, setPage] = useState(0)
  const { data, loading, error, reload } = useFetch(() => mediaService.list({ page, size: 24 }), [page])
  const items = toList(data)
  const input = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [busy, setBusy] = useState(null)
  const [copied, setCopied] = useState(null)
  const [actionError, setActionError] = useState("")

  const upload = async (files) => {
    if (!files?.length) return
    setActionError("")
    setUploading(true)
    try {
      if (files.length === 1) await mediaService.upload(files[0])
      else await mediaService.uploadMany(files)
      setPage(0)
      reload()
      toast.success(files.length === 1 ? "File uploaded" : `${files.length} files uploaded`)
    } catch (err) {
      setActionError(getErrorMessage(err, "Upload failed"))
      toast.error("Upload failed", err)
    } finally {
      setUploading(false)
      if (input.current) input.current.value = ""
    }
  }

  const act = async (m, fn, successMsg) => {
    setActionError("")
    setBusy(m.name)
    try {
      await fn()
      reload()
      if (successMsg) toast.success(successMsg)
    } catch (err) {
      setActionError(getErrorMessage(err, "Action failed"))
      toast.error("Action failed", err)
    } finally {
      setBusy(null)
    }
  }

  const copy = async (m) => {
    try {
      await navigator.clipboard.writeText(m.uri)
      setCopied(m.name)
      setTimeout(() => setCopied(null), 1500)
    } catch { /* clipboard blocked */ }
  }

  return (
    <>
      <PageHeader title="Media library" description="Images, videos and files you can use in courses and lessons.">
        <Button onClick={() => input.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="animate-spin" /> : <Upload />} Upload files
        </Button>
        <input ref={input} type="file" multiple hidden onChange={(e) => upload(e.target.files)} />
      </PageHeader>

      <FormError message={actionError} />

      {loading && !data ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : items.length === 0 ? (
        <EmptyState title="No media yet">Upload thumbnails, lesson videos or attachments.</EmptyState>
      ) : (
        <>
          <div className="mt-4 overflow-x-auto rounded-xl border bg-card">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">File</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Size</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((m) => (
                  <tr key={m.id ?? m.name} className="transition-colors hover:bg-muted/40">
                    <td className="px-4 py-2.5">
                      <a href={m.uri} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-3 hover:text-primary">
                        <span className="grid h-10 w-16 shrink-0 place-items-center overflow-hidden rounded-md border bg-muted/50">
                          {isImage(m) ? (
                            <img src={m.uri} alt="" loading="lazy" className="size-full object-cover" />
                          ) : isVideo(m) ? (
                            <FileVideo className="size-4 text-muted-foreground" />
                          ) : /pdf|doc|txt/i.test(m.extension ?? "") ? (
                            <FileText className="size-4 text-muted-foreground" />
                          ) : (
                            <FileArchive className="size-4 text-muted-foreground" />
                          )}
                        </span>
                        <span className="max-w-[320px] truncate font-medium" title={m.name}>{m.name}</span>
                      </a>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium uppercase text-muted-foreground">{m.extension ?? "—"}</span>
                    </td>
                    <td className="px-4 py-2.5 tabular-nums text-muted-foreground">
                      {m.size != null ? `${Number(m.size).toFixed(1)} ${m.measurement ?? ""}` : "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="outline" onClick={() => copy(m)}>
                          {copied === m.name ? <Check /> : <Copy />} {copied === m.name ? "Copied" : "Copy URL"}
                        </Button>
                        <Button size="icon" variant="ghost" title="Mark as draft" aria-label="Mark as draft" disabled={busy === m.name} onClick={() => act(m, () => mediaService.markDraft(m.name), "Marked as draft")}>
                          <EyeOff />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          title="Delete"
                          aria-label="Delete"
                          disabled={busy === m.name}
                          onClick={async () => {
                            const ok = await confirm({
                              title: "Delete this file?",
                              description: m.name,
                              body: "Anything that uses this file’s URL (thumbnails, lesson videos) will stop showing it.",
                              confirmLabel: "Delete file",
                            })
                            if (ok) act(m, () => mediaService.remove(m.name), "File deleted")
                          }}
                        >
                          {busy === m.name ? <Loader2 className="animate-spin" /> : <Trash2 />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data?.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <span className="text-sm text-muted-foreground">Page {page + 1} of {data.totalPages}</span>
              <Button variant="outline" size="sm" disabled={data.last} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          )}
        </>
      )}
    </>
  )
}
