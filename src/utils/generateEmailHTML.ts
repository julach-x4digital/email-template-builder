import type {
  EmailColumn,
  EmailComponent,
  EmailSection,
  EmailTemplate,
  TextContent,
  ButtonContent,
} from '@/types'
import { normalizeEmailTemplate } from '@/utils/normalizeEmailTemplate'
import { emailTextAlign } from '@/utils/textAlign'
import { stylesToInlineAttr } from '@/utils/styles'

/**
 * JSON → email-safe HTML: table layout only, inline styles (no flex/grid in output).
 * Use `generateEmailHTMLFromJson` when the input is a JSON string.
 */

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function toRenderableAssetUrl(raw: string): string {
  const v = raw.trim()
  if (!v) return ''
  // Keep already-absolute and special schemes as-is.
  if (
    /^(https?:)?\/\//i.test(v) ||
    /^(data|blob|cid):/i.test(v)
  ) {
    return v
  }
  // In browser preview (srcDoc), make relative paths absolute to current origin.
  if (typeof window !== 'undefined') {
    try {
      return new URL(v, window.location.origin + '/').href
    } catch {
      return v
    }
  }
  return v
}

function tdOpen(styles: Record<string, string>, extra = ''): string {
  const s = stylesToInlineAttr(styles)
  return `<td${extra}${s ? ` style="${esc(s)}"` : ''}>`
}

/** Classic hidden preheader (preview text in inbox clients). */
function renderPreheader(text: string): string {
  if (!text.trim()) return ''
  const t = esc(text)
  return `<!-- Preheader (hidden) -->
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${t}</div>
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">&#847;&zwnj;&nbsp;${t.replace(/ /g, '&#847;&zwnj;&nbsp;')}</div>`
}

/** Escaped plain text → nested &lt;strong&gt;/&lt;em&gt;/&lt;sub&gt;/&lt;sup&gt; (whole block). */
function formatTextInnerHtml(escapedPlain: string, tc: TextContent): string {
  // Convert author-entered newlines to email-safe HTML line breaks.
  let x = escapedPlain.replace(/\r?\n/g, '<br />')
  if (tc.subscript) x = `<sub style="font-size:0.85em;line-height:0">${x}</sub>`
  else if (tc.superscript) x = `<sup style="font-size:0.85em;line-height:0">${x}</sup>`
  if (tc.italic) x = `<em>${x}</em>`
  if (tc.bold) x = `<strong>${x}</strong>`
  if (tc.underline) x = `<u>${x}</u>`
  if (tc.strikethrough) x = `<s>${x}</s>`
  return x
}

function renderText(c: EmailComponent): string {
  const tc = c.content as TextContent
  const align = emailTextAlign(c.styles.textAlign)
  const listType = tc.listType ?? 'none'

  if (listType === 'ul' || listType === 'ol') {
    const lines = tc.text.split(/\r?\n/)
    const rows = lines.length > 0 ? lines : [tc.text]
    const listItems = rows.map((line) => {
      const t = line.trimEnd()
      const inner =
        t.length > 0 ? formatTextInnerHtml(esc(t), tc) : '&nbsp;'
      return `<li style="margin:0;padding:0;">${inner}</li>`
    })
    const ListTag = listType === 'ul' ? 'ul' : 'ol'
    const listStyles = {
      margin: '0',
      paddingLeft: c.styles.paddingLeft ?? '18px',
      listStyleType: listType === 'ul' ? 'disc' : 'decimal',
      ...c.styles,
      textAlign: align,
      listStylePosition: 'inside',
    } as Record<string, string>
    const st = stylesToInlineAttr(listStyles)
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="${align}" style="padding:0"><${ListTag} style="${esc(st)}">${listItems.join('')}</${ListTag}></td></tr></table>`
  }

  const inner = formatTextInnerHtml(esc(tc.text), tc)
  const pStyles = { margin: '0', ...c.styles, textAlign: align }
  const st = stylesToInlineAttr(pStyles)
  const variant = tc.variant ?? 'p'
  const tag = variant === 'p' ? 'p' : variant
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="${align}" style="padding:0"><${tag} style="${esc(st)}">${inner}</${tag}></td></tr></table>`
}

function renderImage(c: EmailComponent): string {
  const src =
    'src' in c.content ? esc(toRenderableAssetUrl(c.content.src)) : ''
  const alt = 'alt' in c.content ? esc(c.content.alt) : ''
  if (!src) return ''
  const { textAlign, ...imgStyleRest } = c.styles
  const align = emailTextAlign(textAlign)
  const st = { display: 'block', border: '0', ...imgStyleRest }
  const styleAttr = esc(stylesToInlineAttr(st))
  const core = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${tdOpen({ padding: '0' })}<img src="${src}" alt="${alt}" width="100%" style="${styleAttr}" /></td></tr></table>`
  if (align === 'left') return core
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="${align}" style="padding:0">${core}</td></tr></table>`
}

/**
 * Button: all visual styles on &lt;a&gt; (matches editor `BlockPreview`) so live iframe preview
 * matches the edit canvas. Outer table only handles alignment.
 */
function renderButton(c: EmailComponent): string {
  const label = 'label' in c.content ? esc(c.content.label) : ''
  const href = 'href' in c.content ? esc(c.content.href) : '#'
  const { textAlign, ...linkRest } = c.styles
  const align = emailTextAlign(textAlign)
  const btn = c.content as ButtonContent
  const icon = btn.icon
  const iconSrc = icon?.src ? esc(toRenderableAssetUrl(icon.src)) : ''
  const iconAlt = icon?.alt ? esc(icon.alt) : ''
  const aStyles = stylesToInlineAttr({
    display: 'inline-block',
    textDecoration: 'none',
    ...linkRest,
  })
  const iconHtml = iconSrc
    ? `<img src="${iconSrc}" alt="${iconAlt}" width="18" height="18" style="display:inline-block;vertical-align:middle;margin:0 8px 0 0;border:0;object-fit:contain;" />`
    : ''
  const core = `<table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td align="left" style="padding:0"><a href="${href}" target="_blank" rel="noopener noreferrer"${aStyles ? ` style="${esc(aStyles)}"` : ''}>${iconHtml}${label}</a></td></tr></table>`
  if (align === 'left') return core
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="${align}" style="padding:0">${core}</td></tr></table>`
}

function renderDivider(c: EmailComponent): string {
  const { textAlign, ...rest } = c.styles
  const align = emailTextAlign(textAlign)
  const hasCustomBorder =
    !!(rest.border ?? rest.borderTop ?? rest.borderRight ?? rest.borderBottom ?? rest.borderLeft)
  const defaults: Record<string, string> = {
    margin: '0',
    fontSize: '1px',
    lineHeight: '1px',
    height: '1px',
  }
  if (!hasCustomBorder) {
    defaults.borderTop = '1px solid #e5e7eb'
  }
  const st = stylesToInlineAttr({
    ...defaults,
    ...rest,
  })
  const core = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="${esc(st)}">&nbsp;</td></tr></table>`
  if (align === 'left') return core
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="${align}" style="padding:0">${core}</td></tr></table>`
}

function renderSpacer(c: EmailComponent): string {
  const h = 'height' in c.content ? c.content.height : '16px'
  const st = stylesToInlineAttr({
    fontSize: '1px',
    lineHeight: '1px',
    height: h,
    ...c.styles,
  })
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="${esc(st)}">&nbsp;</td></tr></table>`
}

function renderComponent(c: EmailComponent): string {
  if (c.settings?.hidden) return ''
  // Export defaults to "desktop" (no per-device HTML generation yet).
  if (c.settings?.deviceVisibility && c.settings.deviceVisibility.desktop === false) return ''
  switch (c.type) {
    case 'text':
      return renderText(c)
    case 'image':
      return renderImage(c)
    case 'button':
      return renderButton(c)
    case 'divider':
      return renderDivider(c)
    case 'spacer':
      return renderSpacer(c)
    default:
      return ''
  }
}

function columnWidthPercent(colCount: number): string {
  if (colCount <= 1) return '100%'
  if (colCount === 2) return '50%'
  return '33.33%'
}

function renderColumn(col: EmailColumn, colCount: number): string {
  const w = columnWidthPercent(colCount)
  const cellStyles: Record<string, string> = {
    width: w,
    verticalAlign: 'top',
    padding: '8px',
    ...(col.styles ?? {}),
  }
  const inner = col.components.map((c) => renderComponent(c)).join('\n')
  const cellAttr = esc(stylesToInlineAttr(cellStyles))
  return `<td valign="top" style="${cellAttr}">${inner}</td>`
}

function renderSection(section: EmailSection): string {
  const colCount = Math.min(3, Math.max(1, section.columns.length))
  const cols = section.columns.slice(0, 3)
  const rowInner = cols.map((c) => renderColumn(c, colCount)).join('')
  const sectionOuter = stylesToInlineAttr(section.styles)

  return `
<tr>
  <td${sectionOuter ? ` style="${esc(sectionOuter)}"` : ''}>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>${rowInner}</tr>
    </table>
  </td>
</tr>`
}

/**
 * Convert a typed template object to a full HTML document (tables + inline CSS).
 */
export function generateEmailHTML(templateJson: EmailTemplate): string {
  const t = templateJson
  const width = t.width || '600px'
  const body = stylesToInlineAttr(t.bodyStyles ?? {})
  const sectionsHtml = t.sections.map(renderSection).join('\n')
  const preheader = t.meta?.preheader ? renderPreheader(t.meta.preheader) : ''
  const title = t.meta?.subject ? esc(t.meta.subject) : 'Email'
  const baseHref =
    typeof window !== 'undefined' ? esc(`${window.location.origin}/`) : '/'

  const inner = `
<table role="presentation" width="${esc(width)}" cellpadding="0" cellspacing="0" border="0" style="max-width:100%;width:100%;margin:0 auto;background-color:#ffffff;">
  ${sectionsHtml}
</table>`.trim()

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <base href="${baseHref}" />
  <title>${title}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body${body ? ` style="${esc(body)}"` : ''}>
  ${preheader}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:0;margin:0;">
        ${inner}
      </td>
    </tr>
  </table>
</body>
</html>`
}

/**
 * Parse JSON string → normalize → HTML. Throws `SyntaxError` if JSON is invalid.
 */
export function generateEmailHTMLFromJson(json: string): string {
  const parsed: unknown = JSON.parse(json)
  return generateEmailHTML(normalizeEmailTemplate(parsed))
}

/**
 * Accept unknown parsed JSON (e.g. `fetch().json()`) and return HTML safely.
 */
export function generateEmailHTMLFromUnknown(data: unknown): string {
  return generateEmailHTML(normalizeEmailTemplate(data))
}
