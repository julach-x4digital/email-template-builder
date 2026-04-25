import { GrUndo, GrRedo } from 'react-icons/gr'
import { BsEyeSlash, BsEyeSlashFill } from 'react-icons/bs'
import { FiEdit2 } from 'react-icons/fi'
import { createExampleTemplate } from '@/core/exampleTemplate'
import { useEmailBuilderApi } from '@/context/useEmailBuilderApi'
import { useEmailStore } from '@/store/emailStore'
import { createTemplateRecord, updateTemplateRecord } from '@/utils/emailBuilderApi'
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
  const setActiveTemplateId = useEmailStore((s) => s.setActiveTemplateId)
  const updateDocument = useEmailStore((s) => s.updateDocument)

  const isTemplatesView = canvasView === 'templates'
  const canUseCrud = apiCfg.api && !!apiCfg.templatesBaseUrl

  const saveOrUpdateTemplate = async () => {
    if (!canUseCrud || isTemplatesView) return
    const html = generateEmailHTML(template)
    const payload = {
      name: template.documentName || 'Untitled template',
      description: template.description ?? '',
      html,
      template,
      isActive: true,
    }
    try {
      if (activeTemplateId) {
        await updateTemplateRecord(
          apiCfg.templatesBaseUrl,
          activeTemplateId,
          payload,
          { credentials: apiCfg.credentials, headers: apiCfg.exportUrl?.headers },
        )
        apiCfg.onExportSuccess?.(new Response(null, { status: 200, statusText: 'Updated' }))
      } else {
        const { id } = await createTemplateRecord(apiCfg.templatesBaseUrl, payload, {
          credentials: apiCfg.credentials,
          headers: apiCfg.exportUrl?.headers,
        })
        setActiveTemplateId(id)
        apiCfg.onExportSuccess?.(new Response(null, { status: 201, statusText: 'Created' }))
      }
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e))
      apiCfg.onExportError?.(err)
    }
  }

  return (
    <header className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-4 py-2">
      {isTemplatesView ? (
        <h1 className="mr-2 text-sm font-semibold text-slate-800">Email builder</h1>
      ) : (
        <div className="mr-2 flex min-w-0 max-w-[min(100%,20rem)] flex-col gap-0.5">
          <label htmlFor="email-builder-template-name" className="sr-only">
            Template name
          </label>
          <input
            id="email-builder-template-name"
            type="text"
            value={template.documentName ?? ''}
            onChange={(e) =>
              updateDocument({
                documentName: e.target.value === '' ? undefined : e.target.value,
              })
            }
            placeholder="Template name"
            className="min-w-0 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
        </div>
      )}
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
          onClick={() => {
            setActiveTemplateId(null)
            setTemplate(createExampleTemplate())
            setCanvasView('editor')
          }}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Create template
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
        disabled={!canUseCrud || isTemplatesView}
        onClick={() => void saveOrUpdateTemplate()}
        className="inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-800 hover:bg-indigo-100 disabled:opacity-50"
      >
        <FiEdit2 className="h-4 w-4" aria-hidden />
        {activeTemplateId ? 'Update template' : 'Save template'}
      </button>
    </header>
  )
}
