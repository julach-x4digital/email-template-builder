import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { SECTIONS_ROOT_ID } from '@/core/constants'
import { useEmailStore } from '@/store/emailStore'
import { SortableSectionRow } from '@/components/layout/SortableSectionRow'

/** Simplified editor canvas that only handles the editor view. */
export function EditorCanvasSimple() {
  const template = useEmailStore((s) => s.template)
  const selected = useEmailStore((s) => s.selected)
  const select = useEmailStore((s) => s.select)
  const addSection = useEmailStore((s) => s.addSection)
  const previewDevice = useEmailStore((s) => s.previewDevice)

  const sectionIds = template.sections.map((s) => s.id)

  const selectedSectionId = selected?.kind === 'section' ? selected.id : null
  const selectedColumnId = selected?.kind === 'column' ? selected.id : null
  const selectedComponentId = selected?.kind === 'component' ? selected.id : null
  const desktopWidth = template.width?.trim() || '600px'
  const editAreaMaxWidth = previewDevice === 'mobile' ? '390px' : desktopWidth

  return (
    <div
      className="flex h-full min-h-0 min-w-0 w-full flex-1 flex-col rounded-xl border border-slate-200 bg-slate-100/80 shadow-inner"
      onClick={() => select(null)}
      role="presentation"
    >
      <div className="flex w-full flex-1 justify-center px-3 py-4 sm:px-6 sm:py-6">
        <section
          className="flex min-h-[480px] w-full min-w-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-[max-width] duration-200 ease-out"
          style={{ maxWidth: editAreaMaxWidth }}
          onClick={(e) => e.stopPropagation()}
          aria-label="Edit area"
        >
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Edit area
            </div>
            <button
              onClick={() => addSection()}
              className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700 transition-colors"
            >
              Add Section
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <SortableContext
              id={SECTIONS_ROOT_ID}
              items={sectionIds}
              strategy={verticalListSortingStrategy}
            >
              {template.sections.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-sm text-slate-400 mb-4">
                    Add a section to get started, then drag components from the left panel.
                  </p>
                  <button
                    onClick={() => addSection()}
                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                  >
                    Add Your First Section
                  </button>
                </div>
              ) : (
                template.sections.map((sec) => (
                  <SortableSectionRow
                    key={sec.id}
                    section={sec}
                    selectedSectionId={selectedSectionId}
                    selectedColumnId={selectedColumnId}
                    selectedComponentId={selectedComponentId}
                    onSelectSection={() =>
                      select({ kind: 'section', id: sec.id, sectionId: sec.id })
                    }
                    onSelectColumn={(sectionId, columnId) =>
                      select({ kind: 'column', id: columnId, sectionId, columnId })
                    }
                    onSelectComponent={(sectionId, columnId, componentId) =>
                      select({
                        kind: 'component',
                        id: componentId,
                        sectionId,
                        columnId,
                      })
                    }
                  />
                ))
              )}
            </SortableContext>
          </div>
        </section>
      </div>
    </div>
  )
}