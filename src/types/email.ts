/**
 * Email template JSON model: sections → columns → components.
 * Styles use camelCase keys; they are inlined in export (converted for HTML attributes).
 */

export type BlockType = 'text' | 'image' | 'button' | 'divider' | 'spacer'

/** Inline-style map compatible with email clients (string values). */
export type EmailStyles = Record<string, string>

/** Semantic tag for export (paragraph vs headings). */
export type TextVariant = 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

/** Plain text plus whole-block formatting (email-safe tags in HTML export). */
export type TextContent = {
  text: string
  variant?: TextVariant
  listType?: 'none' | 'ul' | 'ol'
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strikethrough?: boolean
  subscript?: boolean
  superscript?: boolean
}
export type ImageContent = { src: string; alt: string }
export type ButtonContent = {
  label: string
  href: string
  /**
   * Optional icon shown next to the label (preview + export).
   * Use empty `src` to represent "icon disabled".
   */
  icon?: { src: string; alt: string }
}
export type DividerContent = Record<string, never>
export type SpacerContent = { height: string }

export type BlockContent =
  | TextContent
  | ImageContent
  | ButtonContent
  | DividerContent
  | SpacerContent

export type EmailComponent = {
  id: string
  type: BlockType
  content: BlockContent
  styles: EmailStyles
  settings?: {
    /** Hide component in editor + export. */
    hidden?: boolean
    /** Toggle device-specific visibility in editor + (desktop export only). */
    deviceVisibility?: {
      desktop: boolean
      mobile: boolean
    }
  }
}

export type EmailColumn = {
  id: string
  components: EmailComponent[]
  /** Optional width hint for export (e.g. "50%"); defaults by column count. */
  styles?: EmailStyles
}

export type EmailSection = {
  id: string
  /** 1–3 columns per product requirement */
  columns: EmailColumn[]
  styles: EmailStyles
}

export type EmailTemplate = {
  id: string
  /** Builder document title (e.g. “New Message”). */
  documentName?: string
  meta?: { subject?: string; preheader?: string }
  /** Max width of inner email body (e.g. 600px) */
  width: string
  bodyStyles: EmailStyles
  sections: EmailSection[]
}

export type SelectionKind = 'section' | 'column' | 'component'

export type EditorSelection = {
  kind: SelectionKind
  /** section id, column id, or component id */
  id: string
  /** When kind is column or component, parent section id */
  sectionId?: string
  /** When kind is component, parent column id */
  columnId?: string
}
