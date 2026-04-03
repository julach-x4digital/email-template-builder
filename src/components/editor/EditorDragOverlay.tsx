import type { UniqueIdentifier } from '@dnd-kit/core'
import { PaletteBlockIcon } from '@/components/editor/paletteIcons'
import { PALETTE_ITEMS } from '@/core/constants'
import type { BlockType } from '@/types'

type DragData = {
  source?: string
  blockType?: BlockType
  type?: string
}

/** Floating preview while dragging (palette item, section, or block). */
export function EditorDragOverlay({
  activeId,
  data,
}: {
  activeId: UniqueIdentifier | null
  data: DragData | undefined
}) {
  if (activeId == null) return null

  const idStr = String(activeId)
  if (idStr.startsWith('palette-')) {
    const t = data?.blockType
    const item = t ? PALETTE_ITEMS.find((p) => p.type === t) : undefined
    return (
      <div className="flex cursor-grabbing items-center gap-3 rounded-full border-2 border-indigo-400 bg-white px-3 py-2 shadow-lg">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-indigo-200 bg-indigo-50">
          {item ? <PaletteBlockIcon type={item.type} /> : <span className="text-slate-400">?</span>}
        </span>
        <span className="text-sm font-medium text-slate-800">{item?.label ?? 'Component'}</span>
      </div>
    )
  }

  if (data?.type === 'section') {
    return (
      <div className="rounded-lg border-2 border-indigo-400 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-lg">
        Section
      </div>
    )
  }

  return (
    <div className="rounded-lg border-2 border-indigo-400 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-lg">
      Block
    </div>
  )
}
