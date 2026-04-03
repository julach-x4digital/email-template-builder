import { useState } from 'react'
import { GrUndo, GrRedo } from 'react-icons/gr'
import { PiExport } from 'react-icons/pi'
import { BsEyeSlash, BsEyeSlashFill } from 'react-icons/bs'
import { createExampleTemplate } from '@/core/exampleTemplate'
import { useEmailStore } from '@/store/emailStore'
import { generateEmailHTML } from '@/utils/generateEmailHTML'

/** Top actions: sections, undo/redo, reset demo, export HTML modal. */
export function EditorToolbar() {
  const [exportOpen, setExportOpen] = useState(false)
  const [exportHtml, setExportHtml] = useState('')

  const template = useEmailStore((s) => s.template)
  const addSection = useEmailStore((s) => s.addSection)
  const undo = useEmailStore((s) => s.undo)
  const redo = useEmailStore((s) => s.redo)
  const past = useEmailStore((s) => s.past)
  const future = useEmailStore((s) => s.future)
  const setTemplate = useEmailStore((s) => s.setTemplate)
  const canvasView = useEmailStore((s) => s.canvasView)
  const setCanvasView = useEmailStore((s) => s.setCanvasView)

  const openExport = () => {
    setExportHtml(generateEmailHTML(template))
    setExportOpen(true)
  }

  return (
    <>
      <header className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-4 py-2">
        <h1 className="mr-4 text-sm font-semibold text-slate-800">Email builder</h1>
        <button
          type="button"
          onClick={() => addSection()}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Add section
        </button>
        <button
          type="button"
          onClick={() => setTemplate(createExampleTemplate())}
          className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
        >
          Load example
        </button>
        <div className="mx-2 h-6 w-px bg-slate-200" aria-hidden />
        <button
          type="button"
          disabled={!past.length}
          onClick={() => undo()}
          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1.5 text-sm text-slate-700 disabled:opacity-40"
          aria-label="Undo"
          title="Undo"
        >
          <GrUndo className="h-3.5 w-3.5" aria-hidden />
          Undo
        </button>
        <button
          type="button"
          disabled={!future.length}
          onClick={() => redo()}
          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1.5 text-sm text-slate-700 disabled:opacity-40"
          aria-label="Redo"
          title="Redo"
        >
          <GrRedo className="h-3.5 w-3.5" aria-hidden />
          Redo
        </button>
        <div className="flex-1" />

        <button
          type="button"
          onClick={() => setCanvasView(canvasView === 'editor' ? 'preview' : 'editor')}
          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          aria-label={canvasView === 'editor' ? 'Switch to preview view' : 'Switch to editor view'}
          title={canvasView === 'editor' ? 'Preview view' : 'Editor view'}
        >
          {canvasView === 'editor' ? (
            <BsEyeSlashFill className="h-4 w-4" aria-hidden />
          ) : (
            <BsEyeSlash className="h-4 w-4" aria-hidden />
          )}
          {canvasView === 'editor' ? 'Editor view' : 'Preview view'}
        </button>

        <button
          type="button"
          onClick={openExport}
          className="inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-800 hover:bg-indigo-100"
        >
          <PiExport className="h-4 w-4" aria-hidden />
          Export HTML
        </button>
      </header>

      {exportOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="export-title"
        >
          <div className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h2 id="export-title" className="text-lg font-semibold text-slate-900">
                Email HTML
              </h2>
              <button
                type="button"
                onClick={() => setExportOpen(false)}
                className="rounded p-1 text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <p className="px-4 pt-3 text-xs text-slate-500">
              Table-based layout with inline styles from <code className="rounded bg-slate-100 px-1">generateEmailHTML</code>.
            </p>
            <textarea
              readOnly
              className="m-4 min-h-[240px] flex-1 resize-y rounded-md border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-800"
              value={exportHtml}
            />
            <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3">
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(exportHtml)
                }}
                className="rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-900"
              >
                Copy to clipboard
              </button>
              <button
                type="button"
                onClick={() => setExportOpen(false)}
                className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
