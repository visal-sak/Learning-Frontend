import { useRef, useState } from "react"
import { Upload, Copy, Check, Loader2, FileVideo, FileText, FileArchive } from "lucide-react"
import { BiSolidTrash } from "react-icons/bi"
import { IoEyeOff } from "react-icons/io5"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/admin/AdminUI"
import { DataTable, Tag } from "@/components/admin/DataTable"
import { EmptyState, ErrorState, LoadingState } from "@/components/course/CourseBits"
import { FormError } from "@/components/auth/FormField"
import { useFetch } from "@/hooks/useFetch"
import { mediaService } from "@/services/media.service"
import { toList } from "@/services/http"
import { getErrorMessage } from "@/lib/api"
import { confirm } from "@/store/confirm.store"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"

const isImage = (m) => /^image\//.test(m.mediaType ?? "") || /^(png|jpe?g|gif|webp|svg|avif)$/i.test(m.extension ?? "")
const isVideo = (m) => /^video\//.test(m.mediaType ?? "") || /^(mp4|webm|mov|mkv)$/i.test(m.extension ?? "")
const isDoc = (m) => /pdf|doc|txt|ppt|xls/i.test(m.extension ?? "")

// Type tag colour by kind of file
const kindTag = (m) =>
  isImage(m) ? "bg-sky-500/12 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300"
    : isVideo(m) ? "bg-violet-500/12 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300"
      : isDoc(m) ? "bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
        : "bg-neutral-500/12 text-neutral-700 dark:bg-neutral-500/20 dark:text-neutral-300"

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
          <DataTable
            className="mt-4"
            rows={items}
            rowKey={(m) => m.id ?? m.name}
            columns={[
              {
                key: "file",
                label: "File",
                render: (m) => (
                  <a href={m.uri} target="_blank" rel="noreferrer" className="group flex min-w-0 items-center gap-3">
                    <span className="grid h-10 w-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#f5f5f5] dark:bg-neutral-800">
                      {isImage(m) ? (
                        <img src={m.uri} alt="" loading="lazy" className="size-full object-contain p-1 mix-blend-multiply dark:mix-blend-normal" />
                      ) : isVideo(m) ? (
                        <FileVideo className="size-5 text-violet-500" />
                      ) : isDoc(m) ? (
                        <FileText className="size-5 text-amber-500" />
                      ) : (
                        <FileArchive className="size-5 text-muted-foreground" />
                      )}
                    </span>
                    <span className="max-w-[340px] truncate font-medium group-hover:text-primary group-hover:underline" title={m.name}>{m.name}</span>
                  </a>
                ),
              },
              {
                key: "type",
                label: "Type",
                render: (m) => <Tag className={cn("uppercase", kindTag(m))}>{m.extension ?? "file"}</Tag>,
              },
              {
                key: "size",
                label: "Size",
                nowrap: true,
                render: (m) => (
                  <span className="tabular-nums text-muted-foreground">{m.size != null ? `${Number(m.size).toFixed(1)} ${m.measurement ?? ""}` : "—"}</span>
                ),
              },
              {
                key: "actions",
                label: "Actions",
                align: "right",
                render: (m) => (
                  <div className="flex items-center justify-end gap-1.5">
                    <Button size="sm" variant="bordered" onClick={() => copy(m)}>
                      {copied === m.name ? <Check /> : <Copy />} {copied === m.name ? "Copied" : "Copy URL"}
                    </Button>
                    <Button
                      size="icon"
                      variant="bordered"
                      className="size-8"
                      title="Mark as draft"
                      aria-label="Mark as draft"
                      disabled={busy === m.name}
                      onClick={() => act(m, () => mediaService.markDraft(m.name), "Marked as draft")}
                    >
                      <IoEyeOff className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="bordered"
                      className="size-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-500/10"
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
                      {busy === m.name ? <Loader2 className="animate-spin" /> : <BiSolidTrash className="size-4" />}
                    </Button>
                  </div>
                ),
              },
            ]}
          />
          {data?.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button variant="bordered" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <span className="text-sm text-muted-foreground">Page {page + 1} of {data.totalPages}</span>
              <Button variant="bordered" size="sm" disabled={data.last} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          )}
        </>
      )}
    </>
  )
}
