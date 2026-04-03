import type { BlockType } from '@/types'
import { BiImageAlt, BiText } from 'react-icons/bi'
import { MdOutlineHorizontalRule, MdSmartButton } from 'react-icons/md'
import { TbArrowsVertical } from 'react-icons/tb'

const cls = 'h-5 w-5 shrink-0 text-slate-600'

/** Palette / drag-overlay icon for a block type. */
export function PaletteBlockIcon({ type }: { type: BlockType }) {
  switch (type) {
    case 'text':
      return <BiText className={cls} aria-hidden />
    case 'image':
      return <BiImageAlt className={cls} aria-hidden />
    case 'button':
      return <MdSmartButton className={cls} aria-hidden />
    case 'divider':
      return <MdOutlineHorizontalRule className={cls} aria-hidden />
    case 'spacer':
      return <TbArrowsVertical className={cls} aria-hidden />
    default:
      return null
  }
}
