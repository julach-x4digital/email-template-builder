import { useDraggable } from '@dnd-kit/core'
import { FiChevronLeft } from 'react-icons/fi'
import { FiChevronRight } from 'react-icons/fi'
import { PALETTE_ITEMS } from '@/core/constants'
import { PaletteBlockIcon } from '@/components/editor/paletteIcons'
import type { BlockType } from '@/types'

const collapseBtnClass =
  'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white p-1.5 text-slate-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700'

function PaletteDraggable({
  type,
  label,
}: {
  type: BlockType
  label: string
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { source: 'palette', blockType: type },
  })

  // Hide the list item while dragging; `DragOverlay` in EditorShell shows the preview.
  const style = {
    ...(transform
      ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
      : {}),
    opacity: isDragging ? 0 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="mb-2 flex cursor-grab items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 shadow-sm transition-colors active:cursor-grabbing hover:border-indigo-300 hover:bg-indigo-50/80"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white">
        <PaletteBlockIcon type={type} />
      </span>
      <span className="text-sm font-medium text-slate-800">{label}</span>
    </div>
  )
}

type ComponentPaletteProps = {
  collapsed?: boolean
  onToggleCollapse?: () => void
}

/** Left rail: draggable block types into any column. */
export function ComponentPalette({
  collapsed = false,
  onToggleCollapse,
}: ComponentPaletteProps = {}) {
  if (collapsed && onToggleCollapse) {
    return (
      <div className="flex h-full w-full flex-col items-center border-b border-slate-200 py-3">
        <button
          type="button"
          className={collapseBtnClass}
          aria-label="Expand components panel"
          title="Expand components"
          onClick={onToggleCollapse}
        >
          <FiChevronRight className="h-5 w-5" aria-hidden />
        </button>
        <span
          className="mt-3 select-none text-[10px] font-semibold uppercase leading-tight tracking-wide text-slate-500 [writing-mode:vertical-rl] [text-orientation:mixed]"
          aria-hidden
        >
          Components
        </span>
      </div>
    )
  }

  return (
    <div className="border-b border-slate-200 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Components
        </h2>
        {onToggleCollapse ? (
          <button
            type="button"
            className={collapseBtnClass}
            aria-label="Collapse components panel"
            title="Collapse"
            onClick={onToggleCollapse}
          >
            <FiChevronLeft className="h-5 w-5" aria-hidden />
          </button>
        ) : null}
      </div>
      <p className="mb-3 text-xs text-slate-500">Drag into a column on the canvas.</p>
      {PALETTE_ITEMS.map((item) => (
        <PaletteDraggable key={item.type} type={item.type} label={item.label} />
      ))}
    </div>
  )
}
