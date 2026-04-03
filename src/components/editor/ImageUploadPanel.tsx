import { useEffect, useMemo, useRef, useState } from 'react'
import type { ImageContent } from '@/types'
import { useEmailBuilderApi } from '@/context/useEmailBuilderApi'
import { uploadFileToEndpoint } from '@/utils/emailBuilderApi'
import { FiUploadCloud, FiLink, FiImage, FiTrash2 } from 'react-icons/fi'

const MAX_MB = 3
const MAX_BYTES = MAX_MB * 1024 * 1024

function isBlobUrl(url: string) {
  return url.startsWith('blob:')
}

export function ImageUploadPanel({
  image,
  align,
  onUpdateContent,
  onUpdateStyles,
}: {
  image: ImageContent
  align: 'left' | 'center' | 'right'
  onUpdateContent: (content: ImageContent) => void
  onUpdateStyles: (styles: Record<string, string>) => void
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const prevBlobUrlRef = useRef<string | null>(null)
  const apiCfg = useEmailBuilderApi()

  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const [urlDraft, setUrlDraft] = useState(image.src)

  const canApplyUrl = useMemo(() => urlDraft.trim().length > 0, [urlDraft])

  const applyUrl = () => {
    const next = urlDraft.trim()
    if (!next) return
    setError(null)
    onUpdateContent({ src: next, alt: image.alt || 'Image' })
  }

  useEffect(() => {
    return () => {
      if (prevBlobUrlRef.current && isBlobUrl(prevBlobUrlRef.current)) {
        URL.revokeObjectURL(prevBlobUrlRef.current)
      }
    }
  }, [])

  const updateFromFile = async (file: File) => {
    setError(null)
    if (file.size > MAX_BYTES) {
      setError(`Max size is ${MAX_MB}MB.`)
      return
    }

    if (apiCfg.api && apiCfg.imgUrl) {
      setUploading(true)
      try {
        const url = await uploadFileToEndpoint(apiCfg.imgUrl, file, {
          fieldName: apiCfg.uploadFieldName,
          credentials: apiCfg.credentials,
          parseUploadResponse: apiCfg.parseUploadResponse,
        })
        if (prevBlobUrlRef.current && isBlobUrl(prevBlobUrlRef.current)) {
          URL.revokeObjectURL(prevBlobUrlRef.current)
        }
        prevBlobUrlRef.current = null
        onUpdateContent({ src: url, alt: image.alt || file.name || 'Image' })
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Upload failed')
      } finally {
        setUploading(false)
      }
      return
    }

    const blobUrl = URL.createObjectURL(file)
    if (prevBlobUrlRef.current && isBlobUrl(prevBlobUrlRef.current)) {
      URL.revokeObjectURL(prevBlobUrlRef.current)
    }
    prevBlobUrlRef.current = blobUrl
    onUpdateContent({ src: blobUrl, alt: image.alt || file.name || 'Image' })
  }

  return (
    <div className="space-y-3">
      <div
        className={[
          'relative rounded-lg border-2 border-dashed p-4',
          'transition-colors',
          isDragging ? 'border-indigo-400 bg-indigo-50/30' : 'border-slate-200 bg-white/70',
        ].join(' ')}
        onDragEnter={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          const f = e.dataTransfer.files?.[0]
          if (!f) return
          void updateFromFile(f)
        }}
      >
        {image.src ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FiImage aria-hidden />
              <div className="text-xs font-semibold text-slate-800">Image Preview</div>
              <div className="flex-1" />
              <button
                type="button"
                className="rounded p-1 text-slate-600 hover:bg-slate-100"
                onClick={() => onUpdateContent({ src: '', alt: image.alt })}
                aria-label="Remove image"
              >
                <FiTrash2 aria-hidden />
              </button>
            </div>
            <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
              <img
                src={image.src}
                alt={image.alt || 'Image'}
                className="block w-full object-contain"
              />
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-indigo-600">
              <FiUploadCloud aria-hidden />
            </div>
            <div className="text-sm font-semibold text-slate-800">
              Drag & drop your image
            </div>
            <div className="mt-1 text-xs text-slate-500">
              PNG, JPG, or GIF (max {MAX_MB}MB)
              {apiCfg.api && apiCfg.imgUrl ? (
                <span className="block text-indigo-600">Files upload to your server.</span>
              ) : null}
            </div>

            <div className="mt-3 flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={uploading}
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? 'Uploading…' : 'Browse'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (!f) return
                  void updateFromFile(f)
                  e.currentTarget.value = ''
                }}
              />
              <div className="text-xs font-semibold text-indigo-600">or paste URL</div>
            </div>
          </div>
        )}

        <div className="mt-4 text-[11px] text-slate-500">
          Drop zone • {image.src ? 'Change image below' : 'Add image or paste a URL'}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <FiLink aria-hidden />
          <div className="text-xs font-semibold text-slate-800">Paste Image URL</div>
        </div>
        <div className="flex items-center gap-2">
          <input
            className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            value={urlDraft}
            placeholder="https://example.com/image.png"
            onChange={(e) => setUrlDraft(e.target.value)}
          />
          <button
            type="button"
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            onClick={async () => {
              try {
                const txt = await navigator.clipboard.readText()
                if (typeof txt === 'string' && txt.trim()) {
                  setUrlDraft(txt.trim())
                  setError(null)
                }
              } catch {
                setError('Clipboard paste is blocked by browser permissions.')
              }
            }}
            aria-label="Paste from clipboard"
          >
            Paste
          </button>
          <button
            type="button"
            disabled={!canApplyUrl}
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
            onClick={applyUrl}
          >
            Add
          </button>
        </div>
        <div className="text-[11px] text-slate-500">
          Tip: after uploading, you can still paste a URL to replace it.
          {!(apiCfg.api && apiCfg.imgUrl) ? (
            <span> Local files use a preview URL; export inlines images as data when needed.</span>
          ) : null}
        </div>
      </div>

      {error ? <div className="text-xs font-semibold text-red-700">{error}</div> : null}

      <div className="space-y-2">
        <div className="text-xs font-semibold text-slate-800">Alignment</div>
        <div className="flex gap-2">
          {(['left', 'center', 'right'] as const).map((a) => (
            <button
              key={a}
              type="button"
              className={[
                'flex-1 rounded-md border px-2 py-1.5 text-xs font-semibold',
                a === align ? 'border-indigo-200 bg-indigo-50 text-indigo-800' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
              ].join(' ')}
              onClick={() => onUpdateStyles({ textAlign: a })}
            >
              {a[0].toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

