import { GrUndo, GrRedo } from 'react-icons/gr'
import { BsEyeSlash, BsEyeSlashFill } from 'react-icons/bs'
import { FiEdit2 } from 'react-icons/fi'
import { createExampleTemplate } from '@/core/exampleTemplate'
import { useEmailBuilderApi } from '@/context/useEmailBuilderApi'
import { useEmailStore } from '@/store/emailStore'
import { updateTemplateRecord } from '@/utils/emailBuilderApi'
import { generateEmailHTML } from '@/utils/generateEmailHTML'

/** Top actions: sections, undo/redo, views, template update. */
export function EditorToolbar() {
  const apiCfg = useEmailBuilderApi()
  const template = useEmailStore((s) => s.template)
  const addSection = useEmailStore((s) => s.addSection)
  const undo = useEmailStore((s) => s.undo)
  const redo = useEmailStore((s) => s.redo)
  const past = useEmailStore((s) => s.past)
  const future = useEmailStore((s) => s.future)
  const setTemplate = useEmailStore((s) => s.setTemplate)
  const canvasView = useEmailStore((s) => s.canvasView)
  const setCanvasView = useEmailStore((s) => s.setCanvasView)
  const activeTemplateId = useEmailStore((s) => s.activeTemplateId)

  const isTemplatesView = canvasView === 'templates'
  const canUseCrud = apiCfg.api && !!apiCfg.templatesBaseUrl

  const updateCurrentTemplate = async () => {
    if (!canUseCrud) return
    if (!activeTemplateId) {
      apiCfg.onExportError?.(new Error('Select a template first from Templates view.'))
      return
    }
    try {
      const html = generateEmailHTML(template)
      await updateTemplateRecord(
        apiCfg.templatesBaseUrl,
        activeTemplateId,
        {
          name: template.documentName || 'Untitled template',
          description: '',
          html,
          template,
          isActive: true,
        },
        { credentials: apiCfg.credentials, headers: apiCfg.exportUrl?.headers },
      )
      apiCfg.onExportSuccess?.(new Response(null, { status: 200, statusText: 'Updated' }))
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e))
      apiCfg.onExportError?.(err)
    }
  }

  return (
    <header className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-4 py-2">
      <h1 className="mr-4 text-sm font-semibold text-slate-800">Email builder</h1>
      <button
        type="button"
        disabled={isTemplatesView}
        onClick={() => addSection()}
        className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        Add section
      </button>
      <button
        type="button"
        disabled={isTemplatesView}
        onClick={() => setTemplate(createExampleTemplate())}
        className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        Load welcome sample
      </button>
      <div className="mx-2 h-6 w-px bg-slate-200" aria-hidden />
      <button
        type="button"
        disabled={!past.length || isTemplatesView}
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
        disabled={!future.length || isTemplatesView}
        onClick={() => redo()}
        className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1.5 text-sm text-slate-700 disabled:opacity-40"
        aria-label="Redo"
        title="Redo"
      >
        <GrRedo className="h-3.5 w-3.5" aria-hidden />
        Redo
      </button>
      <div className="flex-1" />

      {isTemplatesView ? (
        <button
          type="button"
          onClick={() => setCanvasView('editor')}
          className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
        >
          Back to editor
        </button>
      ) : (
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
      )}

      <button
        type="button"
        onClick={() => setCanvasView('templates')}
        className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
      >
        Templates
      </button>

      <button
        type="button"
        disabled={!canUseCrud || !activeTemplateId || isTemplatesView}
        onClick={() => void updateCurrentTemplate()}
        className="inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-800 hover:bg-indigo-100 disabled:opacity-50"
      >
        <FiEdit2 className="h-4 w-4" aria-hidden />
        Update template
      </button>
    </header>
  )
}
