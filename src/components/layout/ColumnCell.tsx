import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { EmailColumn } from '@/types'
import { SortableBlockRow } from '@/components/editor/SortableBlockRow'

type Props = {
  sectionId: string
  column: EmailColumn
  columnCount: number
  selectedComponentId: string | null
  selectedColumnId: string | null
  onSelectColumn: () => void
  onSelectComponent: (id: string) => void
}

/**
 * One column: outer droppable uses `column.id` (palette append / empty insert).
 * Inner list is a SortableContext for vertical reorder and cross-column moves.
 */
export function ColumnCell({
  sectionId,
  column,
  columnCount,
  selectedComponentId,
  selectedColumnId,
  onSelectColumn,
  onSelectComponent,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: 'column', sectionId, columnId: column.id },
  })

  const widthPct = columnCount === 1 ? '100%' : columnCount === 2 ? '50%' : '33.333%'
  const colSelected = selectedColumnId === column.id

  return (
    <div
      className="min-w-0 border-l border-slate-200/80 first:border-l-0"
      style={{ width: widthPct, flexBasis: widthPct }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onSelectColumn()
        }}
        className={`mb-2 w-full rounded px-2 py-1 text-left text-xs font-medium uppercase tracking-wide ${
          colSelected ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
      >
        Column
      </button>
      <div
        ref={setNodeRef}
        className={`min-h-[120px] rounded-md border border-dashed p-2 transition-colors ${
          isOver ? 'border-indigo-400 bg-indigo-50/40' : 'border-slate-200 bg-white/60'
        }`}
      >
        <SortableContext
          id={column.id}
          items={column.components.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.components.length === 0 ? (
            <div className="flex h-28 items-center justify-center rounded bg-slate-50 text-sm text-slate-400">
              Drop blocks here
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {column.components.map((c, idx) => (
                <SortableBlockRow
                  key={c.id}
                  columnId={column.id}
                  index={idx}
                  totalBlocks={column.components.length}
                  component={c}
                  selected={selectedComponentId === c.id}
                  onSelect={() => onSelectComponent(c.id)}
                />
              ))}
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  )
}
