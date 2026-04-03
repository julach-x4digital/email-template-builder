import { useEffect, useMemo, useRef, useState } from 'react'
import { FiLink, FiTrash2, FiUploadCloud } from 'react-icons/fi'

type Icon = { src: string; alt: string }

function isBlobUrl(url: string) {
  return url.startsWith('blob:')
}

export function IconUploadPanel({
  icon,
  onUpdate,
  onRemove,
}: {
  icon: Icon
  onUpdate: (next: Icon) => void
  onRemove: () => void
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const prevBlobRef = useRef<string | null>(null)

  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [urlDraft, setUrlDraft] = useState(icon.src)

  const canApplyUrl = useMemo(() => urlDraft.trim().length > 0, [urlDraft])

  // We intentionally don't sync local draft with `icon.src` via effect:
  // it avoids eslint warnings and keeps typing stable while the user edits.

  useEffect(() => {
    return () => {
      if (prevBlobRef.current && isBlobUrl(prevBlobRef.current)) {
        URL.revokeObjectURL(prevBlobRef.current)
      }
    }
  }, [])

  const applyUrl = () => {
    const nextSrc = urlDraft.trim()
    if (!nextSrc) return
    setError(null)
    onUpdate({ src: nextSrc, alt: icon.alt || 'Icon' })
  }

  const updateFromFile = (file: File) => {
    setError(null)
    // 3MB is consistent with the image panel.
    const maxBytes = 3 * 1024 * 1024
    if (file.size > maxBytes) {
      setError('Max size is 3MB.')
      return
    }
    const blobUrl = URL.createObjectURL(file)
    if (prevBlobRef.current && isBlobUrl(prevBlobRef.current)) {
      URL.revokeObjectURL(prevBlobRef.current)
    }
    prevBlobRef.current = blobUrl
    onUpdate({ src: blobUrl, alt: icon.alt || file.name || 'Icon' })
  }

  return (
    <div className="space-y-3">
      <div
        className={[
          'rounded-lg border-2 border-dashed p-4 transition-colors',
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
          updateFromFile(f)
        }}
      >
        {icon.src ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white">
                <img src={icon.src} alt={icon.alt || 'Icon'} className="h-7 w-7 object-contain" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-800">Icon preview</div>
                <div className="text-[11px] text-slate-500">Shown next to button text</div>
              </div>
            </div>
            <button
              type="button"
              className="rounded p-1 text-slate-600 hover:bg-slate-100"
              onClick={() => {
                setUrlDraft('')
                onRemove()
              }}
              aria-label="Remove icon"
            >
              <FiTrash2 aria-hidden />
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-indigo-600">
              <FiUploadCloud aria-hidden />
            </div>
            <div className="text-sm font-semibold text-slate-800">Drop an icon</div>
            <div className="mt-1 text-xs text-slate-500">PNG, JPG, or GIF (max 3MB)</div>
            <div className="mt-3 flex items-center justify-center gap-2">
              <button
                type="button"
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                onClick={() => fileInputRef.current?.click()}
              >
                Browse
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (!f) return
                  updateFromFile(f)
                  e.currentTarget.value = ''
                }}
              />
            </div>
          </div>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-800">
          <FiLink aria-hidden />
          <span>Paste icon URL</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            value={urlDraft}
            placeholder="https://example.com/icon.png"
            onChange={(e) => setUrlDraft(e.target.value)}
          />
          <button
            type="button"
            disabled={!canApplyUrl}
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
            onClick={applyUrl}
          >
            Add
          </button>
        </div>
        {error ? <div className="mt-2 text-xs font-semibold text-red-700">{error}</div> : null}
      </div>
    </div>
  )
}

