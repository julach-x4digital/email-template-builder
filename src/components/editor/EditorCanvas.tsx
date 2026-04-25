import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { MdOutlineDesktopWindows } from 'react-icons/md'
import { ImMobile } from 'react-icons/im'
import { SECTIONS_ROOT_ID } from '@/core/constants'
import { useEmailStore } from '@/store/emailStore'
import { SortableSectionRow } from '@/components/layout/SortableSectionRow'
import { TemplateGalleryView } from '@/components/editor/TemplateGalleryView'
import { generateEmailHTML } from '@/utils/generateEmailHTML'

/** Center panel: split editor canvas + isolated live preview. */
export function EditorCanvas() {
  const template = useEmailStore((s) => s.template)
  const selected = useEmailStore((s) => s.selected)
  const select = useEmailStore((s) => s.select)
  const previewDevice = useEmailStore((s) => s.previewDevice)
  const setPreviewDevice = useEmailStore((s) => s.setPreviewDevice)
  const canvasView = useEmailStore((s) => s.canvasView)

  const sectionIds = template.sections.map((s) => s.id)

  const selectedSectionId = selected?.kind === 'section' ? selected.id : null
  const selectedColumnId = selected?.kind === 'column' ? selected.id : null
  const selectedComponentId = selected?.kind === 'component' ? selected.id : null

  const desktopMax = template.width?.trim() || '600px'
  const frameMaxWidth =
    previewDevice === 'mobile' ? 'min(100%, 390px)' : desktopMax
  const editAreaMaxWidth = previewDevice === 'mobile' ? '390px' : desktopMax
  const previewHtml = generateEmailHTML(template)

  return (
    <div
      className="flex h-full min-h-0 min-w-0 w-full flex-1 flex-col rounded-xl border border-slate-200 bg-slate-100/80 shadow-inner"
      onClick={() => select(null)}
      role="presentation"
    >
      <div className="flex w-full flex-1 px-3 py-4 sm:px-6 sm:py-6">
        {canvasView === 'templates' ? (
          <TemplateGalleryView />
        ) : canvasView === 'editor' ? (
          <div className="flex w-full justify-center">
            <section
              className="flex min-h-[480px] w-full min-w-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-[max-width] duration-200 ease-out"
              style={{ maxWidth: editAreaMaxWidth }}
              onClick={(e) => e.stopPropagation()}
              aria-label="Edit area"
            >
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                Edit area
              </div>
              <div className="flex-1 overflow-auto p-4">
                <SortableContext
                  id={SECTIONS_ROOT_ID}
                  items={sectionIds}
                  strategy={verticalListSortingStrategy}
                >
                  {template.sections.length === 0 ? (
                    <p className="py-16 text-center text-sm text-slate-400">
                      Add a section from the toolbar, then drag components here.
                    </p>
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
        ) : (
          <div className="flex w-full min-w-0 flex-1 justify-center">
            <div
              className="flex w-full min-w-0 flex-col gap-3"
              style={{ maxWidth: frameMaxWidth }}
            >
              <div className="flex flex-wrap items-center justify-center gap-2">
                <div
                  className="flex overflow-hidden rounded-full border border-slate-200 bg-white"
                  role="group"
                  aria-label="Preview device"
                >
                  <button
                    type="button"
                    title="Desktop preview"
                    aria-label="Desktop preview"
                    aria-pressed={previewDevice === 'desktop'}
                    className={[
                      'inline-flex items-center justify-center px-2.5 py-2 text-xs font-semibold transition-colors sm:px-3',
                      previewDevice === 'desktop'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-50',
                    ].join(' ')}
                    onClick={() => setPreviewDevice('desktop')}
                  >
                    <MdOutlineDesktopWindows className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="sr-only">Desktop</span>
                  </button>
                  <button
                    type="button"
                    title="Mobile preview"
                    aria-label="Mobile preview"
                    aria-pressed={previewDevice === 'mobile'}
                    className={[
                      'inline-flex items-center justify-center px-2.5 py-2 text-xs font-semibold transition-colors sm:px-3',
                      previewDevice === 'mobile'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-50',
                    ].join(' ')}
                    onClick={() => setPreviewDevice('mobile')}
                  >
                    <ImMobile className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="sr-only">Mobile</span>
                  </button>
                </div>
              </div>
              <section
                className="flex min-h-[480px] w-full min-w-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-md transition-[max-width] duration-300 ease-out"
                data-preview-device={previewDevice}
                aria-label="Live preview area"
              >
                <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Live preview
                </div>
                <iframe
                  title="Email preview"
                  srcDoc={previewHtml}
                  className="flex-1 w-full border-0 bg-white"
                />
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
