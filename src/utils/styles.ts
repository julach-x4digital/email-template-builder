import type { CSSProperties } from 'react'
import type { EmailStyles } from '@/types'

/** Convert stored style map to React inline `style` object. */
export function stylesToReact(styles: EmailStyles | undefined): CSSProperties {
  if (!styles) return {}
  return styles as unknown as CSSProperties
}

/** camelCase → kebab-case for HTML style attributes */
function camelToKebab(key: string): string {
  return key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)
}

/** Serialize to a single `style="..."` attribute value for email HTML. */
export function stylesToInlineAttr(styles: EmailStyles): string {
  return Object.entries(styles)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${camelToKebab(k)}:${String(v).trim()}`)
    .join(';')
}
