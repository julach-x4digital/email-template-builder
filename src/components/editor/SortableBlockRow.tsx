import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { EmailComponent } from '@/types'
import { BlockPreview } from '@/components/blocks/BlockPreview'
import { useEmailStore } from '@/store/emailStore'
import { useState } from 'react'
import {
  FiArrowDown,
  FiArrowUp,
  FiCopy,
  FiMoreHorizontal,
  FiMove,
  FiTrash2,
} from 'react-icons/fi'

type Props = {
  columnId: string
  component: EmailComponent
  index: number
  totalBlocks: number
  selected: boolean
  onSelect: () => void
}

/** Draggable row for a block inside a column’s vertical list (dnd-kit sortable). */
export function SortableBlockRow({
  columnId,
  component,
  index,
  totalBlocks,
  selected,
  onSelect,
}: Props) {
  const duplicateComponent = useEmailStore((s) => s.duplicateComponent)
  const removeComponent = useEmailStore((s) => s.removeComponent)
  const reorderInColumn = useEmailStore((s) => s.reorderInColumn)
  const previewDevice = useEmailStore((s) => s.previewDevice)

  const isVisible =
    !component.settings?.hidden &&
    (component.settings?.deviceVisibility
      ? previewDevice === 'desktop'
        ? component.settings.deviceVisibility.desktop
        : component.settings.deviceVisibility.mobile
      : true)

  const [moreOpen, setMoreOpen] = useState(false)
  const canMoveUp = index > 0
  const canMoveDown = index < totalBlocks - 1

  // Do not pass `data.sortable` — useSortable merges `sortable` itself; a custom `sortable`
  // object would overwrite `index`/`items` and break reordering (dnd-kit).
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: component.id,
    data: { type: 'block', columnId },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
    visibility: isVisible ? ('visible' as const) : ('hidden' as const),
    pointerEvents: isVisible ? ('auto' as const) : ('none' as const),
  }

  const toolbarVisible = selected
    ? 'opacity-100 pointer-events-auto translate-y-0 scale-100'
    : 'opacity-0 pointer-events-none translate-y-1 scale-95 group-hover:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:scale-100'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="touch-none relative group"
      onMouseLeave={() => setMoreOpen(false)}
    >
      <BlockPreview component={component} selected={selected} onSelect={onSelect} />

      {/* Component hover toolbar */}
      <div
        className={[
          'absolute right-2 top-2 z-20 flex items-center gap-1 rounded-md border border-slate-200 bg-white px-1 py-1 shadow-sm',
          'transition-all duration-150',
          toolbarVisible,
        ].join(' ')}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Move block"
          className="flex h-7 w-7 cursor-grab items-center justify-center rounded bg-slate-50 text-slate-600 hover:bg-slate-100 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <FiMove aria-hidden />
        </button>

        <button
          type="button"
          aria-label="Duplicate block"
          className="flex h-7 items-center justify-center rounded bg-slate-50 px-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          onClick={(e) => {
            e.stopPropagation()
            setMoreOpen(false)
            duplicateComponent(component.id)
          }}
        >
          <FiCopy aria-hidden />
        </button>

        <button
          type="button"
          aria-label="Delete block"
          className="flex h-7 items-center justify-center rounded bg-slate-50 px-2 text-xs font-semibold text-red-700 hover:bg-red-50"
          onClick={(e) => {
            e.stopPropagation()
            setMoreOpen(false)
            removeComponent(component.id)
          }}
        >
          <FiTrash2 aria-hidden />
        </button>

        <div className="relative">
          <button
            type="button"
            aria-label="More options"
            className="flex h-7 w-7 items-center justify-center rounded bg-slate-50 text-slate-700 hover:bg-slate-100"
            onClick={(e) => {
              e.stopPropagation()
              setMoreOpen((v) => !v)
            }}
          >
            <FiMoreHorizontal aria-hidden />
          </button>

          {moreOpen ? (
            <div className="absolute right-0 top-8 w-44 rounded-md border border-slate-200 bg-white p-1 shadow-lg">
              <button
                type="button"
                className={[
                  'flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm hover:bg-slate-50',
                  canMoveUp ? 'text-slate-800' : 'cursor-not-allowed opacity-40',
                ].join(' ')}
                disabled={!canMoveUp}
                onClick={(e) => {
                  e.stopPropagation()
                  setMoreOpen(false)
                  if (!canMoveUp) return
                  reorderInColumn(columnId, index, index - 1)
                }}
              >
                <FiArrowUp aria-hidden />
                Move up
              </button>
              <button
                type="button"
                className={[
                  'flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm hover:bg-slate-50',
                  canMoveDown ? 'text-slate-800' : 'cursor-not-allowed opacity-40',
                ].join(' ')}
                disabled={!canMoveDown}
                onClick={(e) => {
                  e.stopPropagation()
                  setMoreOpen(false)
                  if (!canMoveDown) return
                  reorderInColumn(columnId, index, index + 1)
                }}
              >
                <FiArrowDown aria-hidden />
                Move down
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm text-slate-800 hover:bg-slate-50"
                onClick={(e) => {
                  e.stopPropagation()
                  setMoreOpen(false)
                  duplicateComponent(component.id)
                }}
              >
                <FiCopy aria-hidden />
                Duplicate
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm text-red-700 hover:bg-red-50"
                onClick={(e) => {
                  e.stopPropagation()
                  setMoreOpen(false)
                  removeComponent(component.id)
                }}
              >
                <FiTrash2 aria-hidden />
                Delete
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
