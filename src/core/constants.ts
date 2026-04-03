import type { BlockType } from '@/types'

/** Palette entries: draggable block types shown in the left sidebar. */
export const PALETTE_ITEMS: { type: BlockType; label: string }[] = [
  { type: 'text', label: 'Text' },
  { type: 'image', label: 'Image' },
  { type: 'button', label: 'Button' },
  { type: 'divider', label: 'Divider' },
  { type: 'spacer', label: 'Spacer' },
]

export const SECTIONS_ROOT_ID = 'sections-root'
