import type {
  BlockType,
  EmailColumn,
  EmailComponent,
  EmailSection,
  EmailStyles,
  EmailTemplate,
} from '@/types'
import { newId } from '@/utils/id'

/**
 * Coerce unknown / partial JSON into a valid EmailTemplate for HTML generation.
 * Missing arrays become empty; missing style objects become {}.
 */

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export function normalizeStyles(v: unknown): EmailStyles {
  if (!isRecord(v)) return {}
  const out: EmailStyles = {}
  for (const [k, val] of Object.entries(v)) {
    if (typeof val === 'string' && val !== '') out[k] = val
    else if (typeof val === 'number') out[k] = String(val)
  }
  return out
}

function normalizeMeta(v: unknown): EmailTemplate['meta'] {
  if (!isRecord(v)) return undefined
  const subject = typeof v.subject === 'string' ? v.subject : undefined
  const preheader = typeof v.preheader === 'string' ? v.preheader : undefined
  if (subject === undefined && preheader === undefined) return undefined
  return { subject, preheader }
}

function normalizeComponent(raw: unknown): EmailComponent {
  if (!isRecord(raw)) {
    return {
      id: newId(),
      type: 'text',
      content: { text: '' },
      styles: {},
    }
  }

  const id = typeof raw.id === 'string' ? raw.id : newId()
  const styles = normalizeStyles(raw.styles)
  const type = raw.type as BlockType
  const contentRaw = isRecord(raw.content) ? raw.content : {}
  const settingsRaw = isRecord(raw.settings) ? raw.settings : undefined
  const hidden =
    settingsRaw && typeof settingsRaw.hidden === 'boolean' ? settingsRaw.hidden : undefined
  const deviceVisibilityRaw = settingsRaw && isRecord(settingsRaw.deviceVisibility) ? settingsRaw.deviceVisibility : undefined
  const deviceVisibility =
    deviceVisibilityRaw &&
    typeof deviceVisibilityRaw.desktop === 'boolean' &&
    typeof deviceVisibilityRaw.mobile === 'boolean'
      ? { desktop: deviceVisibilityRaw.desktop, mobile: deviceVisibilityRaw.mobile }
      : undefined

  switch (type) {
    case 'text': {
      const text = typeof contentRaw.text === 'string' ? contentRaw.text : ''
      const listType =
        contentRaw.listType === 'ul' || contentRaw.listType === 'ol'
          ? contentRaw.listType
          : contentRaw.listType === 'none'
            ? 'none'
            : undefined
      const bold = contentRaw.bold === true
      const italic = contentRaw.italic === true
      const subscript = contentRaw.subscript === true
      const superscript = contentRaw.superscript === true
      return {
        id,
        type: 'text',
        content: {
          text,
          ...(listType ? { listType } : {}),
          ...(bold ? { bold: true } : {}),
          ...(italic ? { italic: true } : {}),
          ...(subscript ? { subscript: true } : {}),
          ...(superscript ? { superscript: true } : {}),
        },
        styles,
        settings:
          hidden !== undefined || deviceVisibility !== undefined
            ? { ...(hidden !== undefined ? { hidden } : {}), ...(deviceVisibility ? { deviceVisibility } : {}) }
            : undefined,
      }
    }
    case 'image':
      return {
        id,
        type: 'image',
        content: {
          src: typeof contentRaw.src === 'string' ? contentRaw.src : '',
          alt: typeof contentRaw.alt === 'string' ? contentRaw.alt : '',
        },
        styles,
        settings:
          hidden !== undefined || deviceVisibility !== undefined
            ? { ...(hidden !== undefined ? { hidden } : {}), ...(deviceVisibility ? { deviceVisibility } : {}) }
            : undefined,
      }
    case 'button':
      return {
        id,
        type: 'button',
        content: {
          label: typeof contentRaw.label === 'string' ? contentRaw.label : 'Link',
          href: typeof contentRaw.href === 'string' ? contentRaw.href : '#',
          icon: isRecord(contentRaw.icon)
            ? {
                src: typeof contentRaw.icon.src === 'string' ? contentRaw.icon.src : '',
                alt: typeof contentRaw.icon.alt === 'string' ? contentRaw.icon.alt : '',
              }
            : { src: '', alt: '' },
        },
        styles,
        settings:
          hidden !== undefined || deviceVisibility !== undefined
            ? { ...(hidden !== undefined ? { hidden } : {}), ...(deviceVisibility ? { deviceVisibility } : {}) }
            : undefined,
      }
    case 'divider':
      return {
        id,
        type: 'divider',
        content: {},
        styles,
        settings:
          hidden !== undefined || deviceVisibility !== undefined
            ? { ...(hidden !== undefined ? { hidden } : {}), ...(deviceVisibility ? { deviceVisibility } : {}) }
            : undefined,
      }
    case 'spacer':
      return {
        id,
        type: 'spacer',
        content: {
          height: typeof contentRaw.height === 'string' ? contentRaw.height : '24px',
        },
        styles,
        settings:
          hidden !== undefined || deviceVisibility !== undefined
            ? { ...(hidden !== undefined ? { hidden } : {}), ...(deviceVisibility ? { deviceVisibility } : {}) }
            : undefined,
      }
    default:
      return {
        id,
        type: 'text',
        content: { text: typeof contentRaw.text === 'string' ? contentRaw.text : '' },
        styles,
        settings:
          hidden !== undefined || deviceVisibility !== undefined
            ? { ...(hidden !== undefined ? { hidden } : {}), ...(deviceVisibility ? { deviceVisibility } : {}) }
            : undefined,
      }
  }
}

function normalizeColumn(raw: unknown): EmailColumn {
  if (!isRecord(raw)) {
    return { id: newId(), components: [] }
  }
  const id = typeof raw.id === 'string' ? raw.id : newId()
  const comps = Array.isArray(raw.components)
    ? raw.components.map(normalizeComponent)
    : []
  const colStyles = raw.styles !== undefined ? normalizeStyles(raw.styles) : undefined
  return colStyles && Object.keys(colStyles).length > 0
    ? { id, components: comps, styles: colStyles }
    : { id, components: comps }
}

function normalizeSection(raw: unknown): EmailSection {
  if (!isRecord(raw)) {
    return { id: newId(), columns: [{ id: newId(), components: [] }], styles: {} }
  }
  const id = typeof raw.id === 'string' ? raw.id : newId()
  const columns = Array.isArray(raw.columns)
    ? raw.columns.map(normalizeColumn)
    : [{ id: newId(), components: [] }]
  const safeColumns =
    columns.length === 0 ? [{ id: newId(), components: [] as EmailComponent[] }] : columns
  return {
    id,
    columns: safeColumns.slice(0, 3),
    styles: normalizeStyles(raw.styles),
  }
}

/** Default empty template when input is not an object. */
export function emptyEmailTemplate(): EmailTemplate {
  return {
    id: newId(),
    width: '600px',
    bodyStyles: { margin: '0', padding: '0', backgroundColor: '#f4f4f5' },
    sections: [],
  }
}

/**
 * Normalize arbitrary JSON (e.g. from API or file) into EmailTemplate.
 */
export function normalizeEmailTemplate(input: unknown): EmailTemplate {
  if (!isRecord(input)) return emptyEmailTemplate()

  return {
    id: typeof input.id === 'string' ? input.id : newId(),
    width: typeof input.width === 'string' ? input.width : '600px',
    bodyStyles: normalizeStyles(input.bodyStyles),
    meta: normalizeMeta(input.meta),
    sections: Array.isArray(input.sections) ? input.sections.map(normalizeSection) : [],
  }
}
