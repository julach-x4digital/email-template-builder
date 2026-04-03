import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { EmailSection } from '@/types'
import { stylesToReact } from '@/utils/styles'
import { ColumnCell } from '@/components/layout/ColumnCell'

type Props = {
  section: EmailSection
  selectedSectionId: string | null
  selectedColumnId: string | null
  selectedComponentId: string | null
  onSelectSection: () => void
  onSelectColumn: (sectionId: string, columnId: string) => void
  onSelectComponent: (sectionId: string, columnId: string, componentId: string) => void
}

/** Full-width section row: sortable in the root list + horizontal columns (1–3). */
export function SortableSectionRow({
  section,
  selectedSectionId,
  selectedColumnId,
  selectedComponentId,
  onSelectSection,
  onSelectColumn,
  onSelectComponent,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
    data: { type: 'section' },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  }

  const sectionSelected = selectedSectionId === section.id
  const colCount = section.columns.length

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`mb-4 rounded-lg border-2 bg-white p-3 shadow-sm ${
        sectionSelected ? 'border-indigo-500' : 'border-slate-200'
      }`}
      onClick={(e) => {
        e.stopPropagation()
        onSelectSection()
      }}
      role="presentation"
    >
      <div className="mb-2 flex items-center gap-2">
        <button
          type="button"
          className="flex h-9 w-8 shrink-0 cursor-grab items-center justify-center rounded border border-slate-200 bg-slate-50 text-slate-500 active:cursor-grabbing"
          aria-label="Drag section"
          {...attributes}
          {...listeners}
        >
          ⣿
        </button>
        <span className="text-sm font-semibold text-slate-700">Section</span>
        <span className="text-xs text-slate-400">
          {colCount} column{colCount === 1 ? '' : 's'}
        </span>
      </div>
      <div className="flex flex-row gap-0 rounded-md" style={stylesToReact(section.styles)}>
        {section.columns.map((col) => (
          <ColumnCell
            key={col.id}
            sectionId={section.id}
            column={col}
            columnCount={colCount}
            selectedComponentId={selectedComponentId}
            selectedColumnId={selectedColumnId}
            onSelectColumn={() => onSelectColumn(section.id, col.id)}
            onSelectComponent={(cid) => onSelectComponent(section.id, col.id, cid)}
          />
        ))}
      </div>
    </div>
  )
}
