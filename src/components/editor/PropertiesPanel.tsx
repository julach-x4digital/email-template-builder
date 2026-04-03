import type { ComponentProps, ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useEmailStore } from '@/store/emailStore'
import type { ButtonContent, ImageContent, TextContent } from '@/types'
import { findComponentById, getSectionById } from '@/utils/templateQueries'
import { ImageUploadPanel } from '@/components/editor/ImageUploadPanel'
import { IconUploadPanel } from '@/components/editor/IconUploadPanel'
import { MdOutlineFormatAlignCenter } from "react-icons/md"
import { MdOutlineFormatAlignLeft } from "react-icons/md"
import { MdOutlineFormatAlignRight } from "react-icons/md"
import { MdOutlineFormatBold } from "react-icons/md"
import { MdOutlineFormatItalic } from "react-icons/md"
import { MdOutlineFormatUnderlined } from "react-icons/md"
import { MdOutlineFormatStrikethrough } from "react-icons/md"
import { MdOutlineSubscript } from "react-icons/md"
import { MdOutlineSuperscript } from "react-icons/md"
import { BsParagraph } from "react-icons/bs"
import { BsTypeH1 } from "react-icons/bs"
import { BsTypeH2 } from "react-icons/bs"
import { BsTypeH3 } from "react-icons/bs"
import { BsTypeH4 } from "react-icons/bs"
import { BsTypeH5 } from "react-icons/bs"
import { BsTypeH6 } from "react-icons/bs" 
import { MdLockOpen, MdLockOutline } from 'react-icons/md'
import { MdOutlineFormatListBulleted } from "react-icons/md"
import { MdOutlineFormatListNumbered } from "react-icons/md"
import { CiLineHeight } from "react-icons/ci"
import {
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiImage,
  FiLink,
  FiMinus,
  FiPlus,
  FiTrash2,
  FiUploadCloud,
} from 'react-icons/fi'
import { AiOutlineRadiusUpleft } from "react-icons/ai"
import { AiOutlineRadiusUpright } from "react-icons/ai"
import { AiOutlineRadiusBottomleft } from "react-icons/ai"
import { AiOutlineRadiusBottomright } from "react-icons/ai"
import { BiFontSize } from 'react-icons/bi'
import { RxBorderSolid } from 'react-icons/rx'
import { RxBorderDashed } from 'react-icons/rx'
import { RxBorderDotted } from 'react-icons/rx'
import {
  MdOutlineBorderAll,
  MdOutlineBorderBottom,
  MdOutlineBorderClear,
  MdOutlineBorderLeft,
  MdOutlineBorderRight,
  MdOutlineBorderTop,
} from 'react-icons/md'

/** Merge text edits; subscript and superscript are mutually exclusive. */
function buildTextContent(prev: TextContent, patch: Partial<TextContent>): TextContent {
  const m: TextContent = { ...prev, ...patch }
  if (patch.subscript) m.superscript = undefined
  if (patch.superscript) m.subscript = undefined
  const out: TextContent = { text: m.text }
  if (m.variant) out.variant = m.variant
  if (m.listType) out.listType = m.listType
  if (m.bold) out.bold = true
  if (m.italic) out.italic = true
  if (m.underline) out.underline = true
  if (m.strikethrough) out.strikethrough = true
  if (m.subscript) out.subscript = true
  if (m.superscript) out.superscript = true
  return out
}

/** Group label + controls. Use `div` (not `<label>`) so multiple buttons/counters don’t share one label. */
function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="mb-3 block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      {children}
    </div>
  )
}

const inputInnerClass =
  'box-border w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'

function InputPill(props: ComponentProps<'input'>) {
  return (
    <div className="mt-0.5 rounded-full border border-slate-200 bg-slate-50 p-1.5">
      <input className={inputInnerClass} {...props} />
    </div>
  )
}

function SelectPill(props: ComponentProps<'select'>) {
  return (
    <div className="relative mt-0.5 rounded-full border border-slate-200 bg-slate-50 p-1.5">
      <select
        className={`${inputInnerClass} cursor-pointer appearance-none pr-9`}
        {...props}
      />
      <FiChevronDown
        className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
        aria-hidden
      />
    </div>
  )
}

const toggleBtn =
  'rounded-full border px-2.5 py-1.5 text-xs font-semibold transition-colors'

function AlignSelect({
  value,
  onChange,
}: {
  value: string | undefined
  onChange: (v: 'left' | 'center' | 'right') => void
}) {
  const v = value === 'center' || value === 'right' ? value : 'left'
  return (
    <SelectPill
      value={v}
      onChange={(e) => onChange(e.target.value as 'left' | 'center' | 'right')}
    >
      <option value="left">Left</option>
      <option value="center">Center</option>
      <option value="right">Right</option>
    </SelectPill>
  )
}

function clampInt(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(n)))
}

function parsePx(input: string | undefined): number {
  if (!input) return 0
  const m = String(input).trim().match(/^(-?\d+(\.\d+)?)/)
  if (!m) return 0
  const v = Number.parseFloat(m[1])
  if (Number.isNaN(v)) return 0
  return v
}

function formatPx(v: number): string {
  return `${Math.max(0, Math.round(v))}px`
}

const LINE_HEIGHT_OPTIONS = ['1', '1.2', '1.5', '2'] as const

function lineHeightOptionActive(
  current: string | undefined,
  option: string,
): boolean {
  const t = String(current ?? '').trim()
  if (t === option) return true
  const a = parseFloat(t)
  const b = parseFloat(option)
  if (Number.isFinite(a) && Number.isFinite(b)) return Math.abs(a - b) < 0.002
  return false
}

const counterShell =
  'flex items-center gap-2 border border-solid border-slate-200 rounded-full p-1 bg-slate-50'
const counterShellCompact =
  'inline-flex w-fit max-w-full items-center gap-1 rounded-full border border-solid border-slate-200 bg-slate-50 px-1 py-0.5'
const counterBtn =
  'inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1 active:bg-indigo-100'
const counterBtnCompact =
  'inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1 active:bg-indigo-100'

type CornerRadiusKey =
  | 'borderTopLeftRadius'
  | 'borderTopRightRadius'
  | 'borderBottomRightRadius'
  | 'borderBottomLeftRadius'

const CORNER_RADIUS_KEYS: CornerRadiusKey[] = [
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomRightRadius',
  'borderBottomLeftRadius',
]

function getRadiusPx(
  styles: Record<string, string | undefined>,
  key: CornerRadiusKey,
): number {
  const direct = styles[key]
  if (direct) return parsePx(direct)
  if (styles.borderRadius) return parsePx(styles.borderRadius)
  return 0
}

function buildCornerRadiusPatch(
  styles: Record<string, string | undefined>,
  corner: CornerRadiusKey,
  nextPx: number,
): Record<string, string> {
  const v = clampInt(nextPx, 0, 200)
  const patch: Record<string, string> = { borderRadius: '' }
  for (const k of CORNER_RADIUS_KEYS) {
    const currentPx = k === corner ? v : getRadiusPx(styles, k)
    patch[k] = currentPx === 0 ? '' : formatPx(currentPx)
  }
  return patch
}

const BORDER_STYLE_OPTIONS = [
  { style: 'solid' as const, Icon: RxBorderSolid, label: 'Solid' },
  { style: 'dashed' as const, Icon: RxBorderDashed, label: 'Dashed' },
  { style: 'dotted' as const, Icon: RxBorderDotted, label: 'Dotted' },
]

type BorderEdge = 'all' | 'top' | 'right' | 'bottom' | 'left'

const BORDER_EDGE_META: {
  edge: BorderEdge
  label: string
  Icon: typeof MdOutlineBorderTop
}[] = [
  { edge: 'all', label: 'All sides', Icon: MdOutlineBorderAll },
  { edge: 'top', label: 'Top', Icon: MdOutlineBorderTop },
  { edge: 'right', label: 'Right', Icon: MdOutlineBorderRight },
  { edge: 'bottom', label: 'Bottom', Icon: MdOutlineBorderBottom },
  { edge: 'left', label: 'Left', Icon: MdOutlineBorderLeft },
]

function parseBorderTriplet(
  raw: string | undefined,
): { width: string; style: string; color: string } {
  const t = (raw ?? '').trim()
  if (!t) return { width: '1px', style: 'solid', color: '#e5e7eb' }
  const m = t.match(/^(\S+)\s+(solid|dashed|dotted|double|none)\s+(.+)$/i)
  if (m) {
    return {
      width: m[1],
      style: m[2].toLowerCase(),
      color: m[3].trim(),
    }
  }
  return { width: '1px', style: 'solid', color: '#e5e7eb' }
}

function getActiveBorderEdge(styles: Record<string, string | undefined>): BorderEdge {
  if (styles.border?.trim()) return 'all'
  if (styles.borderTop?.trim()) return 'top'
  if (styles.borderRight?.trim()) return 'right'
  if (styles.borderBottom?.trim()) return 'bottom'
  if (styles.borderLeft?.trim()) return 'left'
  return 'top'
}

function borderKeyForEdge(edge: BorderEdge): keyof Record<string, string | undefined> {
  if (edge === 'all') return 'border'
  if (edge === 'top') return 'borderTop'
  if (edge === 'right') return 'borderRight'
  if (edge === 'bottom') return 'borderBottom'
  return 'borderLeft'
}

function clearAllBorders(): Record<string, string> {
  return {
    border: '',
    borderTop: '',
    borderRight: '',
    borderBottom: '',
    borderLeft: '',
    borderTopStyle: '',
    borderRightStyle: '',
    borderBottomStyle: '',
    borderLeftStyle: '',
  }
}

function hasAnyBorderSet(styles: Record<string, string | undefined>): boolean {
  const keys = [
    'border',
    'borderTop',
    'borderRight',
    'borderBottom',
    'borderLeft',
    'borderTopStyle',
    'borderRightStyle',
    'borderBottomStyle',
    'borderLeftStyle',
  ] as const
  for (const k of keys) {
    if ((styles[k] ?? '').trim()) return true
  }
  return false
}

function setBorderOnEdge(
  edge: BorderEdge,
  triplet: { width: string; style: string; color: string },
): Record<string, string> {
  const v = `${triplet.width} ${triplet.style} ${triplet.color}`.trim()
  const base = clearAllBorders()
  const key = borderKeyForEdge(edge)
  base[key] = v
  return base
}

function readBorderTriplet(
  styles: Record<string, string | undefined>,
): { width: string; style: string; color: string } {
  const edge = getActiveBorderEdge(styles)
  const key = borderKeyForEdge(edge)
  const raw = styles[key]?.trim() ?? ''
  return parseBorderTriplet(raw || undefined)
}

function getActiveBorderLineStyle(
  styles: Record<string, string | undefined>,
): 'solid' | 'dashed' | 'dotted' {
  const t = readBorderTriplet(styles)
  if (t.style === 'dashed' || t.style === 'dotted') return t.style
  return 'solid'
}

function patchBorderLineStyle(
  styles: Record<string, string | undefined>,
  nextStyle: 'solid' | 'dashed' | 'dotted',
): Record<string, string> {
  const edge = getActiveBorderEdge(styles)
  const t = readBorderTriplet(styles)
  return setBorderOnEdge(edge, { ...t, style: nextStyle })
}

function patchBorderColor(
  styles: Record<string, string | undefined>,
  color: string,
): Record<string, string> {
  const edge = getActiveBorderEdge(styles)
  const t = readBorderTriplet(styles)
  return setBorderOnEdge(edge, { ...t, color })
}

function patchBorderEdge(
  styles: Record<string, string | undefined>,
  nextEdge: BorderEdge,
): Record<string, string> {
  const t = readBorderTriplet(styles)
  return setBorderOnEdge(nextEdge, t)
}

function patchBorderWidthPx(
  styles: Record<string, string | undefined>,
  px: number,
): Record<string, string> {
  const edge = getActiveBorderEdge(styles)
  const t = readBorderTriplet(styles)
  const w = clampInt(px, 0, 24)
  const width = w === 0 ? '0px' : `${w}px`
  return setBorderOnEdge(edge, { ...t, width })
}

function getRawBorderValue(styles: Record<string, string | undefined>): string {
  const edge = getActiveBorderEdge(styles)
  const key = borderKeyForEdge(edge)
  return (styles[key] ?? '').trim()
}

function setRawBorderValue(
  styles: Record<string, string | undefined>,
  value: string,
): Record<string, string> {
  const edge = getActiveBorderEdge(styles)
  const base = clearAllBorders()
  const key = borderKeyForEdge(edge)
  base[key] = value
  return base
}

const FONT_FAMILY_OPTIONS: { value: string; label: string }[] = [
  { value: 'Arial, Helvetica, sans-serif', label: 'Arial' },
  { value: 'Roboto, Arial, sans-serif', label: 'Roboto' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: '"Times New Roman", Times, serif', label: 'Times New Roman' },
  { value: 'Verdana, Geneva, sans-serif', label: 'Verdana' },
  { value: '"Trebuchet MS", Helvetica, sans-serif', label: 'Trebuchet MS' },
  { value: 'Tahoma, Geneva, sans-serif', label: 'Tahoma' },
]

function CounterRow({
  value,
  onDec,
  onInc,
  format = (n: number) => String(n),
  compact = false,
}: {
  value: number
  onDec: () => void
  onInc: () => void
  format?: (n: number) => string
  compact?: boolean
}) {
  const shell = compact ? counterShellCompact : counterShell
  const btn = compact ? counterBtnCompact : counterBtn
  const iconCls = compact
    ? 'pointer-events-none h-2.5 w-2.5'
    : 'pointer-events-none h-3 w-3'
  const valueCls = compact
    ? 'w-6 shrink-0 text-center text-xs font-semibold tabular-nums text-slate-800'
    : 'min-w-[2rem] text-center text-xs font-semibold tabular-nums text-slate-800'
  return (
    <div className={shell}>
      <button type="button" className={btn} onClick={onDec}>
        <FiMinus className={iconCls} aria-hidden />
      </button>
      <div className={valueCls}>{format(value)}</div>
      <button type="button" className={btn} onClick={onInc}>
        <FiPlus className={iconCls} aria-hidden />
      </button>
    </div>
  )
}

function hexForColorInput(raw: string | undefined): string {
  const s = raw?.trim() ?? ''
  if (/^#[0-9A-Fa-f]{6}$/.test(s)) return s
  if (/^#[0-9A-Fa-f]{3}$/.test(s)) {
    return `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`
  }
  return '#000000'
}

function ColorFieldPill({
  value,
  onChange,
}: {
  value: string
  onChange: (hex: string) => void
}) {
  const v = value?.trim() || '#000000'
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 p-1.5">
      <input
        type="color"
        aria-label="Pick color"
        className="box-border h-8 w-8 shrink-0 cursor-pointer rounded-full border border-slate-200 bg-white p-0"
        value={hexForColorInput(v)}
        onChange={(e) => onChange(e.target.value)}
      />
      <input
        className="box-border h-8 min-w-0 flex-1 rounded-full border border-slate-200 bg-white px-3 text-sm leading-8 text-slate-900"
        value={v}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

const BG_LAYER_KEYS = [
  'backgroundImage',
  'backgroundSize',
  'backgroundPosition',
  'backgroundRepeat',
] as const

function clearBackgroundLayerKeys(): Record<string, string> {
  const o: Record<string, string> = {}
  for (const k of BG_LAYER_KEYS) o[k] = ''
  return o
}

function detectBackgroundMode(styles: Record<string, string | undefined>): 'solid' | 'gradient' | 'image' {
  const bi = (styles.backgroundImage ?? '').trim()
  if (!bi) return 'solid'
  /** Image mode with no asset yet — keeps the upload UI visible (no placeholder URL). */
  if (bi === 'none') return 'image'
  if (/^url\s*\(/i.test(bi)) return 'image'
  return 'gradient'
}

function parseLinearGradient(
  raw: string,
): { angle: number; from: string; to: string } | null {
  const s = raw.trim()
  const m = s.match(/^linear-gradient\s*\(\s*([^,)]+)\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)/i)
  if (!m) return null
  const anglePart = m[1].trim()
  const degM = anglePart.match(/(-?[\d.]+)\s*deg/i)
  const angle = degM ? Number.parseFloat(degM[1]) : 135
  return { angle: Number.isFinite(angle) ? angle : 135, from: m[2].trim(), to: m[3].trim() }
}

function buildLinearGradient(angle: number, from: string, to: string): string {
  return `linear-gradient(${angle}deg, ${from.trim()}, ${to.trim()})`
}

/** Inner payload of CSS `url(...)`, including `data:` URLs with commas. */
function parseBackgroundImageUrl(raw: string): string {
  const s = raw.trim()
  if (!s || s === 'none') return ''
  if (!/^url\s*\(/i.test(s)) return ''
  const inner = s.replace(/^url\s*\(\s*/i, '').replace(/\)\s*$/i, '').trim()
  if (
    (inner.startsWith('"') && inner.endsWith('"')) ||
    (inner.startsWith("'") && inner.endsWith("'"))
  ) {
    return inner.slice(1, -1)
  }
  return inner
}

function normalizeBackgroundImageUrl(input: string): string {
  const t = input.trim()
  if (!t) return ''
  if (t === 'none') return 'none'
  if (/^url\s*\(/i.test(t)) return t
  const escaped = t.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  return `url("${escaped}")`
}

const GRADIENT_PRESETS: { label: string; value: string }[] = [
  { label: 'Indigo → violet', value: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' },
  { label: 'Sunset', value: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)' },
  { label: 'Ocean', value: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' },
  { label: 'Forest', value: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)' },
  { label: 'Slate', value: 'linear-gradient(135deg, #64748b 0%, #0f172a 100%)' },
]

const BG_IMAGE_MAX_MB = 3
const BG_IMAGE_MAX_BYTES = BG_IMAGE_MAX_MB * 1024 * 1024

/** Matches `ImageUploadPanel` layout: drop zone, preview row, then URL + Paste + Add. */
function BackgroundImageDropzone({
  previewSrc,
  onApplyDataUrl,
  onApplyUrl,
  onRemove,
}: {
  previewSrc: string
  onApplyDataUrl: (dataUrl: string) => void
  onApplyUrl: (url: string) => void
  onRemove: () => void
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [urlDraft, setUrlDraft] = useState(previewSrc)

  useEffect(() => {
    setUrlDraft(previewSrc)
  }, [previewSrc])

  const canApplyUrl = useMemo(() => urlDraft.trim().length > 0, [urlDraft])

  const applyUrl = () => {
    const next = urlDraft.trim()
    if (!next) return
    setError(null)
    onApplyUrl(next)
  }

  const applyFile = (file: File) => {
    setError(null)
    if (file.size > BG_IMAGE_MAX_BYTES) {
      setError(`Max size is ${BG_IMAGE_MAX_MB}MB.`)
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const r = reader.result
      if (typeof r === 'string') onApplyDataUrl(r)
    }
    reader.onerror = () => setError('Could not read file.')
    reader.readAsDataURL(file)
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
          applyFile(f)
        }}
      >
        {previewSrc ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FiImage aria-hidden />
              <div className="text-xs font-semibold text-slate-800">Image Preview</div>
              <div className="flex-1" />
              <button
                type="button"
                className="rounded p-1 text-slate-600 hover:bg-slate-100"
                onClick={onRemove}
                aria-label="Remove image"
              >
                <FiTrash2 aria-hidden />
              </button>
            </div>
            <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
              <img
                src={previewSrc}
                alt=""
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
              PNG, JPG, or GIF (max {BG_IMAGE_MAX_MB}MB)
            </div>

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
                  applyFile(f)
                  e.currentTarget.value = ''
                }}
              />
              <div className="text-xs font-semibold text-indigo-600">or paste URL</div>
            </div>
          </div>
        )}

        <div className="mt-4 text-[11px] text-slate-500">
          Drop zone • {previewSrc ? 'Change image below' : 'Add image or paste a URL'}
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
          Tip: after uploading, you can still paste a URL to replace it. Uploaded images are embedded
          as data for export.
        </div>
      </div>

      {error ? <div className="text-xs font-semibold text-red-700">{error}</div> : null}
    </div>
  )
}

/** Solid color, linear gradient, or background image — updates `background*` style keys. */
function BackgroundField({
  styles,
  onPatch,
  defaultColor = '#ffffff',
}: {
  styles: Record<string, string | undefined>
  onPatch: (patch: Record<string, string>) => void
  defaultColor?: string
}) {
  const mode = detectBackgroundMode(styles)
  const bgImage = (styles.backgroundImage ?? '').trim()
  const solidFallback = styles.backgroundColor?.trim() || defaultColor
  const parsed = parseLinearGradient(bgImage)
  const gAngle = parsed?.angle ?? 135
  const gFrom = parsed?.from ?? '#6366f1'
  const gTo = parsed?.to ?? '#a855f7'
  const imgUrl = parseBackgroundImageUrl(bgImage)

  const modeBtn = (m: 'solid' | 'gradient' | 'image', label: string) => (
    <button
      key={m}
      type="button"
      className={[
        toggleBtn,
        mode === m ? 'border-indigo-600 bg-indigo-50 text-indigo-800' : 'border-slate-200 bg-white text-slate-700',
      ].join(' ')}
      onClick={() => {
        if (m === 'solid') {
          onPatch({
            ...clearBackgroundLayerKeys(),
            backgroundColor: solidFallback,
          })
        } else if (m === 'gradient') {
          onPatch({
            ...clearBackgroundLayerKeys(),
            backgroundColor: solidFallback,
            backgroundImage: buildLinearGradient(gAngle, gFrom, gTo),
          })
        } else {
          onPatch({
            ...clearBackgroundLayerKeys(),
            backgroundColor: solidFallback,
            backgroundImage: 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat',
          })
        }
      }}
    >
      {label}
    </button>
  )

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {modeBtn('solid', 'Solid')}
        {modeBtn('gradient', 'Gradient')}
        {modeBtn('image', 'Image')}
      </div>

      {mode === 'solid' ? (
        <ColorFieldPill
          value={solidFallback}
          onChange={(hex) =>
            onPatch({
              ...clearBackgroundLayerKeys(),
              backgroundColor: hex,
            })
          }
        />
      ) : null}

      {mode === 'gradient' ? (
        <>
          <div className="flex flex-wrap gap-1.5">
            {GRADIENT_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                title={p.label}
                className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:border-indigo-300 hover:bg-indigo-50"
                onClick={() =>
                  onPatch({
                    backgroundImage: p.value,
                    backgroundColor: solidFallback,
                  })
                }
              >
                {p.label}
              </button>
            ))}
          </div>
          <Field label="Angle (deg)">
            <InputPill
              type="number"
              min={0}
              max={360}
              step={1}
              value={String(Math.round(gAngle))}
              onChange={(e) => {
                const n = Number.parseInt(e.target.value, 10)
                const a = Number.isFinite(n) ? ((n % 360) + 360) % 360 : 135
                onPatch({
                  backgroundImage: buildLinearGradient(a, gFrom, gTo),
                })
              }}
            />
          </Field>
          <Field label="Gradient start">
            <ColorFieldPill
              value={hexForColorInput(gFrom)}
              onChange={(hex) =>
                onPatch({
                  backgroundImage: buildLinearGradient(gAngle, hex, gTo),
                })
              }
            />
          </Field>
          <Field label="Gradient end">
            <ColorFieldPill
              value={hexForColorInput(gTo)}
              onChange={(hex) =>
                onPatch({
                  backgroundImage: buildLinearGradient(gAngle, gFrom, hex),
                })
              }
            />
          </Field>
          <Field label="Fallback (behind gradient)">
            <ColorFieldPill
              value={solidFallback}
              onChange={(hex) => onPatch({ backgroundColor: hex })}
            />
          </Field>
        </>
      ) : null}

      {mode === 'image' ? (
        <>
          <BackgroundImageDropzone
            previewSrc={imgUrl}
            onApplyDataUrl={(dataUrl) =>
              onPatch({
                backgroundImage: normalizeBackgroundImageUrl(dataUrl),
                backgroundSize: 'cover',
                backgroundPosition: 'center center',
                backgroundRepeat: 'no-repeat',
              })
            }
            onApplyUrl={(url) =>
              onPatch({
                backgroundImage: normalizeBackgroundImageUrl(url),
                backgroundSize: 'cover',
                backgroundPosition: 'center center',
                backgroundRepeat: 'no-repeat',
              })
            }
            onRemove={() =>
              onPatch({
                ...clearBackgroundLayerKeys(),
                backgroundColor: solidFallback,
              })
            }
          />
          <Field label="Fallback color">
            <ColorFieldPill
              value={solidFallback}
              onChange={(hex) => onPatch({ backgroundColor: hex })}
            />
          </Field>
          <Field label="Size">
            <SelectPill
              value={styles.backgroundSize?.trim() || 'cover'}
              onChange={(e) => onPatch({ backgroundSize: e.target.value })}
            >
              <option value="cover">cover</option>
              <option value="contain">contain</option>
              <option value="100% 100%">stretch (100% 100%)</option>
              <option value="auto">auto</option>
            </SelectPill>
          </Field>
        </>
      ) : null}
    </div>
  )
}

const panelCollapseBtn =
  'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white p-1.5 text-slate-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700'

/** Right rail: template / section / column / component fields. */
export function PropertiesPanel({
  collapsed = false,
  onToggleCollapse,
}: {
  collapsed?: boolean
  onToggleCollapse?: () => void
} = {}) {
  const template = useEmailStore((s) => s.template)
  const selected = useEmailStore((s) => s.selected)
  const updateDocument = useEmailStore((s) => s.updateDocument)
  const updateSectionStyles = useEmailStore((s) => s.updateSectionStyles)
  const setSectionColumnCount = useEmailStore((s) => s.setSectionColumnCount)
  const updateColumnStyles = useEmailStore((s) => s.updateColumnStyles)
  const updateComponent = useEmailStore((s) => s.updateComponent)
  const removeComponent = useEmailStore((s) => s.removeComponent)
  const removeSection = useEmailStore((s) => s.removeSection)

  const [componentTab, setComponentTab] = useState<'settings' | 'styles' | 'device'>('settings')
  const [paddingLocked, setPaddingLocked] = useState(true)

  if (collapsed && onToggleCollapse) {
    return (
      <aside className="flex h-full w-full min-w-0 flex-col items-center border-l border-slate-200 bg-white py-3">
        <button
          type="button"
          className={panelCollapseBtn}
          aria-label="Expand properties panel"
          title="Expand properties"
          onClick={onToggleCollapse}
        >
          <FiChevronLeft className="h-5 w-5" aria-hidden />
        </button>
        <span
          className="mt-3 select-none text-[10px] font-semibold uppercase leading-tight tracking-wide text-slate-500 [writing-mode:vertical-rl] [text-orientation:mixed]"
          aria-hidden
        >
          Properties
        </span>
      </aside>
    )
  }

  return (
    <aside className="flex h-full min-w-0 flex-1 flex-col border-l border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 p-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Properties
        </h2>
        {onToggleCollapse ? (
          <button
            type="button"
            className={panelCollapseBtn}
            aria-label="Collapse properties panel"
            title="Collapse"
            onClick={onToggleCollapse}
          >
            <FiChevronRight className="h-5 w-5" aria-hidden />
          </button>
        ) : null}
      </div>
      <div className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-3">
        {/* Document-level when nothing is selected */}
        {!selected && (
          <section className="mb-6">
            <h3 className="mb-2 text-sm font-semibold text-slate-800">Email canvas</h3>
            <Field label="Width (max)">
              <InputPill
                value={template.width}
                onChange={(e) => updateDocument({ width: e.target.value })}
              />
            </Field>
            <Field label="Outer background">
              <BackgroundField
                styles={template.bodyStyles}
                defaultColor="#f4f4f5"
                onPatch={(patch) => updateDocument({ bodyStyles: patch })}
              />
            </Field>
            <Field label="Subject (meta / title)">
              <InputPill
                value={template.meta?.subject ?? ''}
                onChange={(e) => updateDocument({ meta: { subject: e.target.value } })}
              />
            </Field>
            <Field label="Preheader">
              <InputPill
                value={template.meta?.preheader ?? ''}
                onChange={(e) => updateDocument({ meta: { preheader: e.target.value } })}
              />
            </Field>
          </section>
        )}

        {selected?.kind === 'section' && (() => {
          const sec = getSectionById(template, selected.id)
          if (!sec) return <p className="text-sm text-slate-500">Section not found.</p>
          return (
            <section>
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-800">Section</h3>
                <button
                  type="button"
                  onClick={() => removeSection(sec.id)}
                  className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:border-red-300 hover:bg-red-50"
                >
                  Delete section
                </button>
              </div>
              <Field label="Columns (1–3)">
                <SelectPill
                  value={String(sec.columns.length)}
                  onChange={(e) =>
                    setSectionColumnCount(sec.id, Number.parseInt(e.target.value, 10))
                  }
                >
                  <option value={1}>1 column</option>
                  <option value={2}>2 columns</option>
                  <option value={3}>3 columns</option>
                </SelectPill>
              </Field>
              <Field label="Background">
                <BackgroundField
                  styles={sec.styles}
                  defaultColor="#ffffff"
                  onPatch={(patch) => updateSectionStyles(sec.id, patch)}
                />
              </Field>
              <Field label="Padding">
                <InputPill
                  value={sec.styles.padding ?? ''}
                  placeholder="24px"
                  onChange={(e) => updateSectionStyles(sec.id, { padding: e.target.value })}
                />
              </Field>
            </section>
          )
        })()}

        {selected?.kind === 'column' && selected.sectionId && (() => {
          const sec = getSectionById(template, selected.sectionId)
          const col = sec?.columns.find((c) => c.id === selected.id)
          if (!sec || !col) return <p className="text-sm text-slate-500">Column not found.</p>
          return (
            <section>
              <h3 className="mb-2 text-sm font-semibold text-slate-800">Column</h3>
              <Field label="Cell padding">
                <InputPill
                  value={col.styles?.padding ?? ''}
                  placeholder="8px"
                  onChange={(e) =>
                    updateColumnStyles(sec.id, col.id, { padding: e.target.value })
                  }
                />
              </Field>
              <Field label="Background">
                <BackgroundField
                  styles={col.styles ?? {}}
                  defaultColor="#ffffff"
                  onPatch={(patch) => updateColumnStyles(sec.id, col.id, patch)}
                />
              </Field>
            </section>
          )
        })()}

        {selected?.kind === 'component' && (() => {
          const found = findComponentById(template, selected.id)
          if (!found) return <p className="text-sm text-slate-500">Component not found.</p>
          const { component: c } = found

          return (
            <section>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold capitalize text-slate-800">{c.type}</h3>
                <button
                  type="button"
                  onClick={() => removeComponent(c.id)}
                  className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:border-red-300 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={[
                    'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                    componentTab === 'settings'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-slate-50',
                  ].join(' ')}
                  onClick={() => setComponentTab('settings')}
                >
                  Settings
                </button>
                <button
                  type="button"
                  className={[
                    'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                    componentTab === 'styles'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-slate-50',
                  ].join(' ')}
                  onClick={() => setComponentTab('styles')}
                >
                  Styles
                </button>
                <button
                  type="button"
                  className={[
                    'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                    componentTab === 'device'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-slate-50',
                  ].join(' ')}
                  onClick={() => setComponentTab('device')}
                >
                  Device
                </button>
              </div>

              {componentTab === 'settings' ? (
                <>
                  {c.type === 'text' && 'text' in c.content && (() => {
                const tc = c.content as TextContent

                const isActive = (v: boolean) =>
                  v
                    ? 'border-indigo-600 bg-indigo-600 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-slate-50'

                const alignment = c.styles.textAlign

                const paddingTop = parsePx(c.styles.paddingTop ?? c.styles.padding)
                const paddingRight = parsePx(c.styles.paddingRight ?? c.styles.padding)
                const paddingBottom = parsePx(c.styles.paddingBottom ?? c.styles.padding)
                const paddingLeft = parsePx(c.styles.paddingLeft ?? c.styles.padding)

                const setAllPadding = (v: number) => {
                  const pv = formatPx(v)
                  updateComponent(c.id, {
                    styles: {
                      padding: pv,
                      paddingTop: pv,
                      paddingRight: pv,
                      paddingBottom: pv,
                      paddingLeft: pv,
                    },
                  })
                }

                const setSidePadding = (
                  side: 'top' | 'right' | 'bottom' | 'left',
                  v: number,
                ) => {
                  const value = clampInt(v, 0, 200)
                  if (paddingLocked) {
                    setAllPadding(value)
                    return
                  }

                  updateComponent(c.id, {
                    styles: {
                      padding: '',
                      paddingTop:
                        side === 'top' ? formatPx(value) : formatPx(paddingTop),
                      paddingRight:
                        side === 'right' ? formatPx(value) : formatPx(paddingRight),
                      paddingBottom:
                        side === 'bottom'
                          ? formatPx(value)
                          : formatPx(paddingBottom),
                      paddingLeft:
                        side === 'left' ? formatPx(value) : formatPx(paddingLeft),
                    },
                  })
                }

                return (
                  <>
                    {/* Paragraph style (P / H1..H6) */}
                    <Field label="Paragraph Style">
                      <div className="flex flex-wrap gap-2">
                        {(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const).map((v) => (
                          // Keep variant changes visually obvious even when a fixed fontSize exists in styles.
                          <button
                            key={v}
                            type="button"
                            className={[
                              'min-w-10 rounded-full border px-2 py-1.5 text-xs font-semibold transition-colors',
                              'border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-slate-50',
                              (tc.variant ?? 'p') === v
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-800'
                                : '',
                            ].join(' ')}
                            onClick={() => {
                              const variantTypography: Record<
                                typeof v,
                                { fontSize: string; lineHeight: string }
                              > = {
                                p: { fontSize: '16px', lineHeight: '1.5' },
                                h1: { fontSize: '28px', lineHeight: '1.2' },
                                h2: { fontSize: '24px', lineHeight: '1.25' },
                                h3: { fontSize: '20px', lineHeight: '1.3' },
                                h4: { fontSize: '18px', lineHeight: '1.35' },
                                h5: { fontSize: '16px', lineHeight: '1.4' },
                                h6: { fontSize: '14px', lineHeight: '1.4' },
                              }

                              updateComponent(c.id, {
                                content: buildTextContent(tc, { variant: v }),
                                styles: {
                                  fontSize: variantTypography[v].fontSize,
                                  lineHeight: variantTypography[v].lineHeight,
                                },
                              })
                            }}
                          >
                            {v === 'p' ? (
                              <BsParagraph className="h-4 w-4" />
                            ) : v === 'h1' ? (
                              <BsTypeH1 className="h-4 w-4" />
                            ) : v === 'h2' ? (
                              <BsTypeH2 className="h-4 w-4" />
                            ) : v === 'h3' ? (
                              <BsTypeH3 className="h-4 w-4" />
                            ) : v === 'h4' ? (
                              <BsTypeH4 className="h-4 w-4" />
                            ) : v === 'h5' ? (
                              <BsTypeH5 className="h-4 w-4" />
                            ) : (
                              <BsTypeH6 className="h-4 w-4" />
                            )}
                          </button>
                        ))}
                      </div>
                    </Field>

                    {/* Text style toggles */}
                    <Field label="Text Style">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className={`${toggleBtn} border-slate-200 ${isActive(!!tc.bold)}`}
                          onClick={() =>
                            updateComponent(c.id, {
                              content: buildTextContent(tc, { bold: !tc.bold }),
                            })
                          }
                          title="Bold"
                        >
                          <MdOutlineFormatBold className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          className={`${toggleBtn} border-slate-200 italic ${isActive(!!tc.italic)}`}
                          onClick={() =>
                            updateComponent(c.id, {
                              content: buildTextContent(tc, { italic: !tc.italic }),
                            })
                          }
                          title="Italic"
                        >
                          <MdOutlineFormatItalic className="w-4 h-4" /> 
                        </button>
                        <button
                          type="button"
                          className={`${toggleBtn} border-slate-200 ${tc.underline ? 'text-indigo-600' : ''} ${isActive(!!tc.underline)}`}
                          style={{ textDecoration: 'underline' }}
                          onClick={() =>
                            updateComponent(c.id, {
                              content: buildTextContent(tc, { underline: !tc.underline }),
                            })
                          }
                          title="Underline"
                        >
                          <MdOutlineFormatUnderlined className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          className={`${toggleBtn} border-slate-200 ${tc.strikethrough ? 'text-indigo-600' : ''} ${isActive(!!tc.strikethrough)}`}
                          style={{ textDecoration: 'line-through' }}
                          onClick={() =>
                            updateComponent(c.id, {
                              content: buildTextContent(tc, { strikethrough: !tc.strikethrough }),
                            })
                          }
                          title="Strikethrough"
                        >
                          <MdOutlineFormatStrikethrough className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          className={`${toggleBtn} border-slate-200 ${isActive(!!tc.subscript)}`}
                          style={{ fontSize: '0.7em' }}
                          onClick={() =>
                            updateComponent(c.id, {
                              content: buildTextContent(tc, {
                                subscript: !tc.subscript,
                                superscript: false,
                              }),
                            })
                          }
                          title="Subscript"
                        >
                          <MdOutlineSubscript className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          className={`${toggleBtn} border-slate-200 ${isActive(!!tc.superscript)}`}
                          onClick={() =>
                            updateComponent(c.id, {
                              content: buildTextContent(tc, {
                                superscript: !tc.superscript,
                                subscript: false,
                              }),
                            })
                          }
                          title="Superscript"
                        >
                          <MdOutlineSuperscript className="w-4 h-4" />
                        </button>
                      </div>
                    </Field>

                    {/* Bullets / numbering */}
                    <Field label="Bullets & Numbering">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className={[
                            toggleBtn,
                            'border-slate-200',
                            (tc.listType ?? 'none') === 'ul'
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-800'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-slate-50',
                          ].join(' ')}
                          onClick={() =>
                            updateComponent(c.id, {
                              content: buildTextContent(tc, {
                                listType: (tc.listType ?? 'none') === 'ul' ? 'none' : 'ul',
                              }),
                            })
                          }
                          title="Bullets"
                        >
                          <MdOutlineFormatListBulleted className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          className={[
                            toggleBtn,
                            'border-slate-200',
                            (tc.listType ?? 'none') === 'ol'
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-800'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-slate-50',
                          ].join(' ')}
                          onClick={() =>
                            updateComponent(c.id, {
                              content: buildTextContent(tc, {
                                listType: (tc.listType ?? 'none') === 'ol' ? 'none' : 'ol',
                              }),
                            })
                          }
                          title="Numbering"
                        >
                          <MdOutlineFormatListNumbered className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="mt-1 text-[11px] text-slate-500">
                        Use new lines in the text box to create list items.
                      </div>
                    </Field>

                    {(tc.listType === 'ul' || tc.listType === 'ol') && (
                      <Field label={tc.listType === 'ul' ? 'Bullet items' : 'Numbered items'}>
                        {(() => {
                          // Keep empty lines so "Add item" (blank row) persists after join/split.
                          const rawLines = tc.text.split(/\r?\n/)
                          const safeItems =
                            rawLines.length > 0 ? rawLines.map((line) => line.trimEnd()) : ['']

                          const setItems = (nextItems: string[]) => {
                            updateComponent(c.id, {
                              content: buildTextContent(tc, {
                                text: nextItems.join('\n'),
                              }),
                            })
                          }

                          return (
                            <div className="space-y-2">
                              <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-2">
                                <div
                                  className={[
                                    'pl-5',
                                    tc.listType === 'ul' ? 'list-disc' : 'list-decimal',
                                  ].join(' ')}
                                >
                                  {safeItems.map((item, idx) => (
                                    <div key={idx} className="list-item py-1">
                                      <div className="flex items-center gap-2">
                                        <div className="min-w-0 flex-1 rounded-full border border-slate-200 bg-white px-2 py-1">
                                          <input
                                            className="w-full border-0 bg-transparent px-1 py-0.5 text-sm text-slate-900 outline-none focus:ring-0"
                                            value={item}
                                            onChange={(e) => {
                                              const next = [...safeItems]
                                              next[idx] = e.target.value
                                              setItems(next)
                                            }}
                                          />
                                        </div>
                                        <button
                                          type="button"
                                          className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 transition-colors hover:border-indigo-200 hover:bg-slate-50"
                                          onClick={() => {
                                            const next = safeItems.filter((_, i) => i !== idx)
                                            setItems(next.length ? next : [''])
                                          }}
                                          aria-label="Remove item"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="flex items-center justify-between gap-2">
                                <button
                                  type="button"
                                  className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-950"
                                  onClick={() => setItems([...safeItems, ''])}
                                >
                                  Add item
                                </button>
                                <button
                                  type="button"
                                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-indigo-200 hover:bg-slate-50"
                                  onClick={() =>
                                    updateComponent(c.id, {
                                      content: buildTextContent(tc, { listType: 'none' }),
                                    })
                                  }
                                >
                                  Disable list
                                </button>
                              </div>
                            </div>
                          )
                        })()}
                      </Field>
                    )}

                    {/* Alignment */}
                    <Field label="Text Alignment on Desktop">
                      <div className="flex items-center gap-2">
                        {(['left', 'center', 'right'] as const).map((a) => (
                          <button
                            key={a}
                            type="button"
                            className={[
                              'h-8 rounded-full border px-2.5 text-sm font-semibold transition-colors',
                              'border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-slate-50',
                              alignment === a ? 'border-indigo-600 bg-indigo-50 text-indigo-800' : '',
                            ].join(' ')}
                            onClick={() =>
                              updateComponent(c.id, {
                                styles: { textAlign: a },
                              })
                            }
                          >
                            {a === 'left' ? <MdOutlineFormatAlignLeft className="w-4 h-4" /> : a === 'center' ? <MdOutlineFormatAlignCenter className="w-4 h-4" /> : <MdOutlineFormatAlignRight className="w-4 h-4" />}
                          </button>
                        ))}
                      </div>
                    </Field>

                    {/* Padding on Desktop (compact uniform +/- like the reference) */}
                    <Field label="Padding on Desktop">
                      <div className="mt-1 w-full min-w-0 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
                        <div className="mx-auto grid w-[272px] shrink-0 grid-cols-3 grid-rows-3 items-center justify-items-center gap-2">
                          {/* Top */}
                          <div className="col-start-2 row-start-1 flex items-center gap-2 border border-solid border-slate-200 rounded-full p-1 bg-slate-50">
                            <button
                              type="button"
                              className={counterBtn}
                              onClick={() => setSidePadding('top', paddingTop - 1)}
                            >
                              <FiMinus className="w-3 h-3" />
                            </button>
                            <div className="w-8 text-center text-xs font-semibold text-slate-700">
                              {paddingTop}
                            </div>
                            <button
                              type="button"
                              className={counterBtn}
                              onClick={() => setSidePadding('top', paddingTop + 1)}
                            >
                              <FiPlus className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Left */}
                          <div className="col-start-1 row-start-2 flex items-center gap-2 border border-solid border-slate-200 rounded-full p-1 bg-slate-50">
                            <button
                              type="button"
                              className={counterBtn}
                              onClick={() => setSidePadding('left', paddingLeft - 1)}
                            >
                              <FiMinus className="w-3 h-3" />
                            </button>
                            <div className="w-8 text-center text-xs font-semibold text-slate-700">
                              {paddingLeft}
                            </div>
                            <button
                              type="button"
                              className={counterBtn}
                              onClick={() => setSidePadding('left', paddingLeft + 1)}
                            >
                              <FiPlus className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Lock center */}
                          <div className="col-start-2 row-start-2 flex items-center justify-center">
                            <button
                              type="button"
                              aria-label={paddingLocked ? 'Unlock padding' : 'Lock padding'}
                              className={[
                                'flex h-10 w-10 items-center justify-center rounded-full border transition-colors',
                                paddingLocked
                                  ? 'border-indigo-400 bg-indigo-50'
                                  : 'border-slate-200 bg-white',
                              ].join(' ')}
                              onClick={() => setPaddingLocked((v) => !v)}
                            >
                              {paddingLocked ? (
                                <MdLockOutline className="h-5 w-5 text-indigo-600" />
                              ) : (
                                <MdLockOpen className="h-5 w-5 text-slate-600" />
                              )}
                            </button>
                          </div>

                          {/* Right */}
                          <div className="col-start-3 row-start-2 flex items-center gap-2 border border-solid border-slate-200 rounded-full p-1 bg-slate-50">
                            <button
                              type="button"
                              className={counterBtn}
                              onClick={() => setSidePadding('right', paddingRight - 1)}
                            >
                              <FiMinus className="w-3 h-3" />
                            </button>
                            <div className="w-8 text-center text-xs font-semibold text-slate-700">
                              {paddingRight}
                            </div>
                            <button
                              type="button"
                              className={counterBtn}
                              onClick={() => setSidePadding('right', paddingRight + 1)}
                            >
                              <FiPlus className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Bottom */}
                          <div className="col-start-2 row-start-3 flex items-center gap-2 border border-solid border-slate-200 rounded-full p-1 bg-slate-50">
                            <button
                              type="button"
                              className={counterBtn}
                              onClick={() => setSidePadding('bottom', paddingBottom - 1)}
                            >
                              <FiMinus className="w-3 h-3" />
                            </button>
                            <div className="w-8 text-center text-xs font-semibold text-slate-700">
                              {paddingBottom}
                            </div>
                            <button
                              type="button"
                              className={counterBtn}
                              onClick={() => setSidePadding('bottom', paddingBottom + 1)}
                            >
                              <FiPlus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </Field>
                  </>
                )
                  })()}

                  {c.type === 'image' && 'src' in c.content && (() => {
                    const img = c.content as ImageContent
                    const align =
                      c.styles.textAlign === 'center' || c.styles.textAlign === 'right'
                        ? (c.styles.textAlign as 'left' | 'center' | 'right')
                        : 'left'

                    return (
                      <>
                        <Field label="Image">
                          <ImageUploadPanel
                            image={img}
                            align={align}
                            onUpdateContent={(next) =>
                              updateComponent(c.id, {
                                content: next,
                              })
                            }
                            onUpdateStyles={(styles) =>
                              updateComponent(c.id, {
                                styles: styles as Record<string, string>,
                              })
                            }
                          />
                        </Field>
                        <Field label="Alt text">
                          <InputPill
                            value={img.alt}
                            onChange={(e) =>
                              updateComponent(c.id, {
                                content: { src: img.src, alt: e.target.value },
                              })
                            }
                          />
                        </Field>
                      </>
                    )
                  })()}

                  {c.type === 'button' && 'label' in c.content && (() => {
                    const btn = c.content as ButtonContent
                    const icon = btn.icon ?? { src: '', alt: '' }
                    const iconEnabled = !!icon.src

                    const fixedHeightEnabled = parsePx(c.styles.height ?? '') > 0
                    const currentButtonHeight = parsePx(c.styles.height ?? '')

                    return (
                      <>
                        <Field label="Link">
                          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-stretch">
                            <div className="min-w-0 flex-1">
                              <InputPill
                                value={btn.href}
                                onChange={(e) =>
                                  updateComponent(c.id, {
                                    content: {
                                      label: btn.label,
                                      href: e.target.value,
                                      icon,
                                    },
                                  })
                                }
                              />
                            </div>
                          </div>
                        </Field>

                        <Field label="Button Text">
                          <InputPill
                            value={btn.label}
                            onChange={(e) =>
                              updateComponent(c.id, {
                                content: {
                                  label: e.target.value,
                                  href: btn.href,
                                  icon,
                                },
                              })
                            }
                          />
                        </Field>

                        <Field label="Alignment on Desktop">
                          <div className="flex gap-2">
                            {(['left', 'center', 'right'] as const).map((a) => (
                              <button
                                key={a}
                                type="button"
                                className={[
                                  'h-8 rounded-full border px-2.5 text-sm font-semibold transition-colors',
                                  'border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-slate-50',
                                  c.styles.textAlign === a ? 'border-indigo-600 bg-indigo-50 text-indigo-800' : '',
                                ].join(' ')}
                                onClick={() =>
                                  updateComponent(c.id, { styles: { textAlign: a } })
                                }
                              >
                                {a === 'left' ? (
                                  <MdOutlineFormatAlignLeft className="h-4 w-4" />
                                ) : a === 'center' ? (
                                  <MdOutlineFormatAlignCenter className="h-4 w-4" />
                                ) : (
                                  <MdOutlineFormatAlignRight className="h-4 w-4" />
                                )}
                              </button>
                            ))}
                          </div>
                        </Field>

                        <Field label="Fixed height">
                          <div className="rounded-full border border-slate-200 bg-slate-50 p-1.5">
                            <label className="flex cursor-pointer items-center gap-2 px-2 py-1 text-sm text-slate-800">
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                checked={fixedHeightEnabled}
                                onChange={(e) => {
                                  const checked = e.target.checked
                                  if (checked) {
                                    const v = currentButtonHeight > 0 ? currentButtonHeight : 44
                                    updateComponent(c.id, {
                                      styles: {
                                        height: formatPx(v),
                                        lineHeight: formatPx(v),
                                      },
                                    })
                                  } else {
                                    updateComponent(c.id, {
                                      styles: { height: '', lineHeight: '' },
                                    })
                                  }
                                }}
                              />
                              {fixedHeightEnabled ? 'On' : 'Off'}
                            </label>
                          </div>
                        </Field>

                        {iconEnabled ? (
                          <Field label="Icon Upload">
                            <IconUploadPanel
                              icon={icon}
                              onRemove={() =>
                                updateComponent(c.id, {
                                  content: {
                                    label: btn.label,
                                    href: btn.href,
                                    icon: { src: '', alt: '' },
                                  },
                                })
                              }
                              onUpdate={(next) =>
                                updateComponent(c.id, {
                                  content: {
                                    label: btn.label,
                                    href: btn.href,
                                    icon: next,
                                  },
                                })
                              }
                            />
                          </Field>
                        ) : null}
                      </>
                    )
                  })()}

                  {c.type === 'spacer' && 'height' in c.content && (
                    <Field label="Height">
                      <InputPill
                        value={c.content.height}
                        onChange={(e) =>
                          updateComponent(c.id, {
                            content: { height: e.target.value },
                            styles: {
                              height: e.target.value,
                              lineHeight: e.target.value,
                            },
                          })
                        }
                      />
                    </Field>
                  )}

                  {c.type === 'divider' && (
                    <>
                      <p className="mb-3 text-xs text-slate-500">
                        Divider uses border styles below.
                      </p>
                      <Field label="Align">
                        <AlignSelect
                          value={c.styles.textAlign}
                          onChange={(align) =>
                            updateComponent(c.id, { styles: { textAlign: align } })
                          }
                        />
                      </Field>
                    </>
                  )}
                </>
              ) : null}

              {componentTab === 'device' ? (
                <>
                  <h4 className="mb-2 text-xs font-semibold uppercase text-slate-500">
                    Device visibility
                  </h4>
                  <Field label="Desktop">
                    <div className="rounded-full border border-slate-200 bg-slate-50 p-1.5">
                      <label className="flex cursor-pointer items-center gap-2 px-2 py-1 text-sm text-slate-800">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          checked={c.settings?.deviceVisibility?.desktop ?? true}
                          onChange={(e) =>
                            updateComponent(c.id, {
                              settings: {
                                ...(c.settings ?? {}),
                                deviceVisibility: {
                                  desktop: e.target.checked,
                                  mobile:
                                    c.settings?.deviceVisibility?.mobile ?? true,
                                },
                              },
                            })
                          }
                        />
                        Visible
                      </label>
                    </div>
                  </Field>
                  <Field label="Mobile">
                    <div className="rounded-full border border-slate-200 bg-slate-50 p-1.5">
                      <label className="flex cursor-pointer items-center gap-2 px-2 py-1 text-sm text-slate-800">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          checked={c.settings?.deviceVisibility?.mobile ?? true}
                          onChange={(e) =>
                            updateComponent(c.id, {
                              settings: {
                                ...(c.settings ?? {}),
                                deviceVisibility: {
                                  desktop:
                                    c.settings?.deviceVisibility?.desktop ?? true,
                                  mobile: e.target.checked,
                                },
                              },
                            })
                          }
                        />
                        Visible
                      </label>
                    </div>
                  </Field>
                </>
              ) : null}

              {componentTab === 'styles' ? (
                <>
              {c.type === 'button' ? (
                <>
                  <h4 className="mb-2 mt-4 text-xs font-semibold uppercase text-slate-500">
                    Button Styles
                  </h4>

                  <Field label="Background">
                    <BackgroundField
                      styles={c.styles}
                      defaultColor="#2563eb"
                      onPatch={(patch) => updateComponent(c.id, { styles: patch })}
                    />
                  </Field>

                  <Field label="Font style">
                    {(() => {
                      const ff = c.styles.fontFamily ?? 'Arial, Helvetica, sans-serif'
                      const inList = FONT_FAMILY_OPTIONS.some((o) => o.value === ff)
                      return (
                        <SelectPill
                          value={ff}
                          onChange={(e) =>
                            updateComponent(c.id, { styles: { fontFamily: e.target.value } })
                          }
                        >
                          {FONT_FAMILY_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                          {!inList && ff ? (
                            <option value={ff}>Custom ({ff.slice(0, 24)}…)</option>
                          ) : null}
                        </SelectPill>
                      )
                    })()}
                  </Field>

                  <Field label="Font size">
                    <div className="flex flex-wrap items-center gap-2">
                      <BiFontSize
                        className="h-6 w-6 shrink-0 text-slate-600"
                        aria-hidden
                      />
                      {(() => {
                        const fs = clampInt(parsePx(c.styles.fontSize ?? '') || 16, 8, 96)
                        return (
                          <CounterRow
                            compact
                            value={fs}
                            onDec={() =>
                              updateComponent(c.id, {
                                styles: {
                                  fontSize: formatPx(clampInt(fs - 1, 8, 96)),
                                },
                              })
                            }
                            onInc={() =>
                              updateComponent(c.id, {
                                styles: {
                                  fontSize: formatPx(clampInt(fs + 1, 8, 96)),
                                },
                              })
                            }
                          />
                        )
                      })()}
                    </div>
                  </Field>

                  <Field label="Text Style">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className={`${toggleBtn} border-slate-200 ${
                          (c.styles.fontWeight ?? '').includes('700') ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700'
                        }`}
                        onClick={() =>
                          updateComponent(c.id, {
                            styles: {
                              fontWeight:
                                (c.styles.fontWeight ?? '').includes('700') ? '' : '700',
                            },
                          })
                        }
                      >
                        B
                      </button>
                      <button
                        type="button"
                        className={`${toggleBtn} border-slate-200 italic ${
                          c.styles.fontStyle === 'italic' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700'
                        }`}
                        onClick={() =>
                          updateComponent(c.id, {
                            styles: {
                              fontStyle: c.styles.fontStyle === 'italic' ? '' : 'italic',
                            },
                          })
                        }
                      >
                        I
                      </button>
                    </div>
                  </Field>

                  <Field label="Font Color">
                    <ColorFieldPill
                      value={c.styles.color ?? '#ffffff'}
                      onChange={(hex) =>
                        updateComponent(c.id, { styles: { color: hex } })
                      }
                    />
                  </Field>

                  <Field label="Fit to Container on Desktop">
                    <div className="rounded-full border border-slate-200 bg-slate-50 p-1.5">
                      <label className="flex cursor-pointer items-center gap-2 px-2 py-1 text-sm text-slate-800">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          checked={c.styles.width === '100%' || c.styles.display === 'block'}
                          onChange={(e) => {
                            const checked = e.target.checked
                            updateComponent(c.id, {
                              styles: checked
                                ? { width: '100%', display: 'block' }
                                : { width: '', display: '' },
                            })
                          }}
                        />
                        On
                      </label>
                    </div>
                  </Field>
                </>
              ) : null}

              <h4 className="mb-2 mt-4 text-xs font-semibold uppercase text-slate-500">
                Styles (inline)
              </h4>

              {c.type !== 'button' ? (
                <Field label="Font style">
                  {(() => {
                    const ff = c.styles.fontFamily ?? 'Arial, Helvetica, sans-serif'
                    const inList = FONT_FAMILY_OPTIONS.some((o) => o.value === ff)
                    return (
                      <SelectPill
                        value={ff}
                        onChange={(e) =>
                          updateComponent(c.id, { styles: { fontFamily: e.target.value } })
                        }
                      >
                        {FONT_FAMILY_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                        {!inList && ff ? (
                          <option value={ff}>Custom ({ff.slice(0, 24)}…)</option>
                        ) : null}
                      </SelectPill>
                    )
                  })()}
                </Field>
              ) : null}

              {c.type !== 'button' ? (
                <Field label="Font size">
                  <div className="flex flex-wrap items-center gap-2">
                    <BiFontSize
                      className="h-6 w-6 shrink-0 text-slate-600"
                      aria-hidden
                    />
                    {(() => {
                      const fs = clampInt(parsePx(c.styles.fontSize ?? '') || 16, 8, 96)
                      return (
                        <CounterRow
                          compact
                          value={fs}
                          onDec={() =>
                            updateComponent(c.id, {
                              styles: {
                                fontSize: formatPx(clampInt(fs - 1, 8, 96)),
                              },
                            })
                          }
                          onInc={() =>
                            updateComponent(c.id, {
                              styles: {
                                fontSize: formatPx(clampInt(fs + 1, 8, 96)),
                              },
                            })
                          }
                        />
                      )
                    })()}
                  </div>
                </Field>
              ) : null}

              <Field label="Line height">
                <div className="flex flex-wrap items-center gap-2">
                  <CiLineHeight
                    className="h-7 w-7 shrink-0 text-slate-600"
                    aria-hidden
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {LINE_HEIGHT_OPTIONS.map((lh) => (
                      <button
                        key={lh}
                        type="button"
                        className={[
                          'min-w-[2.25rem] rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors',
                          lineHeightOptionActive(c.styles.lineHeight, lh)
                            ? 'border-indigo-600 bg-indigo-600 text-white'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-slate-50',
                        ].join(' ')}
                        onClick={() =>
                          updateComponent(c.id, { styles: { lineHeight: lh } })
                        }
                      >
                        {lh}
                      </button>
                    ))}
                  </div>
                </div>
              </Field>

              <Field label="Border radius">
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      {
                        key: 'borderTopLeftRadius' as const,
                        Icon: AiOutlineRadiusUpleft,
                        label: 'Top left',
                      },
                      {
                        key: 'borderTopRightRadius' as const,
                        Icon: AiOutlineRadiusUpright,
                        label: 'Top right',
                      },
                      {
                        key: 'borderBottomLeftRadius' as const,
                        Icon: AiOutlineRadiusBottomleft,
                        label: 'Bottom left',
                      },
                      {
                        key: 'borderBottomRightRadius' as const,
                        Icon: AiOutlineRadiusBottomright,
                        label: 'Bottom right',
                      },
                    ] as const
                  ).map(({ key, Icon, label }) => {
                    const px = getRadiusPx(c.styles, key)
                    return (
                      <div
                        key={key}
                        className="flex items-center gap-2"
                        title={label}
                      >
                        <Icon className="h-6 w-6 shrink-0 text-slate-500" aria-hidden />
                        <CounterRow
                          value={px}
                          onDec={() =>
                            updateComponent(c.id, {
                              styles: buildCornerRadiusPatch(c.styles, key, px - 1),
                            })
                          }
                          onInc={() =>
                            updateComponent(c.id, {
                              styles: buildCornerRadiusPatch(c.styles, key, px + 1),
                            })
                          }
                        />
                      </div>
                    )
                  })}
                </div>
              </Field>
              {c.type !== 'button' ? (
                <>
                  <Field label="Text color">
                    <ColorFieldPill
                      value={c.styles.color ?? '#000000'}
                      onChange={(hex) =>
                        updateComponent(c.id, { styles: { color: hex } })
                      }
                    />
                  </Field>
                  <Field label="Background">
                    <BackgroundField
                      styles={c.styles}
                      defaultColor="#ffffff"
                      onPatch={(patch) => updateComponent(c.id, { styles: patch })}
                    />
                  </Field>
                </>
              ) : null}
              <Field label="Border (divider)">
                <div className="space-y-3">
                  <div>
                    <span className="mb-1 block text-xs font-medium text-slate-600">
                      Sides
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {BORDER_EDGE_META.map(({ edge, label, Icon }) => {
                        const active = getActiveBorderEdge(c.styles) === edge
                        return (
                          <button
                            key={edge}
                            type="button"
                            title={label}
                            aria-label={label}
                            className={[
                              'flex h-9 min-w-[2.75rem] flex-1 cursor-pointer items-center justify-center rounded-full border text-slate-600 transition-colors',
                              active
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50',
                            ].join(' ')}
                            onClick={() =>
                              updateComponent(c.id, {
                                styles: patchBorderEdge(c.styles, edge),
                              })
                            }
                          >
                            <Icon className="h-5 w-5 shrink-0" aria-hidden />
                          </button>
                        )
                      })}
                      <button
                        type="button"
                        disabled={!hasAnyBorderSet(c.styles)}
                        onClick={() =>
                          updateComponent(c.id, {
                            styles: clearAllBorders(),
                          })
                        }
                        aria-label="Remove border"
                        title="Remove border"
                        className={[
                          'flex h-9 min-w-[2.75rem] flex-1 cursor-pointer items-center justify-center rounded-full border transition-colors',
                          hasAnyBorderSet(c.styles)
                            ? 'border-slate-200 bg-white text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700'
                            : 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400',
                        ].join(' ')}
                      >
                        <MdOutlineBorderClear className="h-5 w-5 shrink-0" aria-hidden />
                      </button>
                    </div>
                  </div>
                  <div>
                    <span className="mb-1 block text-xs font-medium text-slate-600">
                      Line style
                    </span>
                    <div className="flex gap-2">
                      {BORDER_STYLE_OPTIONS.map(({ style, Icon, label }) => {
                        const active = getActiveBorderLineStyle(c.styles) === style
                        return (
                          <button
                            key={style}
                            type="button"
                            title={label}
                            aria-label={label}
                            className={[
                              'flex h-10 min-w-0 flex-1 cursor-pointer items-center justify-center rounded-full border text-slate-600 transition-colors',
                              active
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50 hover:text-indigo-700',
                            ].join(' ')}
                            onClick={() =>
                              updateComponent(c.id, {
                                styles: patchBorderLineStyle(c.styles, style),
                              })
                            }
                          >
                            <Icon className="h-5 w-5 shrink-0" aria-hidden />
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div>
                    <span className="mb-1 block text-xs font-medium text-slate-600">
                      Border color
                    </span>
                    <ColorFieldPill
                      value={readBorderTriplet(c.styles).color}
                      onChange={(next) =>
                        updateComponent(c.id, {
                          styles: patchBorderColor(c.styles, next),
                        })
                      }
                    />
                  </div>
                  <div>
                    <span className="mb-1 block text-xs font-medium text-slate-600">
                      Width (px)
                    </span>
                    {(() => {
                      const wPx = clampInt(parsePx(readBorderTriplet(c.styles).width), 0, 24)
                      return (
                        <CounterRow
                          compact
                          value={wPx}
                          onDec={() =>
                            updateComponent(c.id, {
                              styles: patchBorderWidthPx(c.styles, wPx - 1),
                            })
                          }
                          onInc={() =>
                            updateComponent(c.id, {
                              styles: patchBorderWidthPx(c.styles, wPx + 1),
                            })
                          }
                        />
                      )
                    })()}
                  </div>
                  <div>
                    <span className="mb-1 block text-xs font-medium text-slate-600">
                      CSS shorthand
                    </span>
                    <InputPill
                      value={getRawBorderValue(c.styles)}
                      placeholder="1px solid #e5e7eb"
                      onChange={(e) =>
                        updateComponent(c.id, {
                          styles: setRawBorderValue(c.styles, e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
              </Field>
              </> ) : null}
            </section>
          )
        })()}
      </div>
    </aside>
  )
}
