import { useState } from 'react'
import { GrUndo, GrRedo } from 'react-icons/gr'
import { PiExport } from 'react-icons/pi'
import { BsEyeSlash, BsEyeSlashFill } from 'react-icons/bs'
import { createExampleTemplate } from '@/core/exampleTemplate'
import { useEmailBuilderApi } from '@/context/useEmailBuilderApi'
import { useEmailStore } from '@/store/emailStore'
import {
  createTemplateRecord,
  deleteTemplateRecord,
  getTemplateRecord,
  listTemplateRecords,
  postEmailExport,
  updateTemplateRecord,
  type TemplateListItem,
} from '@/utils/emailBuilderApi'
import { generateEmailHTML } from '@/utils/generateEmailHTML'

/** Top actions: sections, undo/redo, reset demo, export HTML modal. */
export function EditorToolbar() {
  const [exportOpen, setExportOpen] = useState(false)
  const [exportHtml, setExportHtml] = useState('')
  const [exportPosting, setExportPosting] = useState(false)
  const [exportPostOk, setExportPostOk] = useState<string | null>(null)
  const [exportPostError, setExportPostError] = useState<string | null>(null)

  const [managerOpen, setManagerOpen] = useState(false)
  const [templates, setTemplates] = useState<TemplateListItem[]>([])
  const [listLoading, setListLoading] = useState(false)
  const [crudLoading, setCrudLoading] = useState(false)
  const [crudMessage, setCrudMessage] = useState<string | null>(null)
  const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(null)
  const [templateName, setTemplateName] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)

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

  const canUseCrud = apiCfg.api && !!apiCfg.templatesBaseUrl
  const baseCrudOptions = {
    credentials: apiCfg.credentials,
    headers: apiCfg.exportUrl?.headers,
  }

  const postExportIfConfigured = async (html: string) => {
    if (!apiCfg.api || !apiCfg.exportUrl) return
    setExportPosting(true)
    setExportPostOk(null)
    setExportPostError(null)
    try {
      const res = await postEmailExport(apiCfg.exportUrl, { html, template }, {
        credentials: apiCfg.credentials,
        buildExportBody: apiCfg.buildExportBody,
        buildExportHeaders: apiCfg.buildExportHeaders,
      })
      apiCfg.onExportSuccess?.(res)
      setExportPostOk('Template was sent to your server.')
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e))
      setExportPostError(err.message)
      apiCfg.onExportError?.(err)
    } finally {
      setExportPosting(false)
    }
  }

  const openExport = () => {
    const html = generateEmailHTML(template)
    setExportHtml(html)
    setExportPostOk(null)
    setExportPostError(null)
    setExportOpen(true)
    void postExportIfConfigured(html)
  }

  const retryServerExport = () => {
    const html = exportHtml || generateEmailHTML(template)
    void postExportIfConfigured(html)
  }

  const refreshTemplates = async (nextPage = page, nextLimit = limit, nextSearch = search) => {
    if (!canUseCrud) return
    setListLoading(true)
    setCrudMessage(null)
    try {
      const rows = await listTemplateRecords(
        apiCfg.templatesBaseUrl,
        {
          page: nextPage,
          limit: nextLimit,
          search: nextSearch.trim() || undefined,
        },
        baseCrudOptions,
      )
      setTemplates(rows.filter((r) => r.id))
      setCrudMessage(`Loaded ${rows.length} templates.`)
    } catch (e) {
      setCrudMessage(e instanceof Error ? e.message : 'List failed')
    } finally {
      setListLoading(false)
    }
  }

  const openManager = () => {
    if (!canUseCrud) return
    setManagerOpen(true)
    setTemplateName(template.documentName || '')
    void refreshTemplates(1, limit, search)
  }

  const createTemplate = async () => {
    if (!canUseCrud) return
    const name = templateName.trim() || template.documentName || 'Untitled template'
    setCrudLoading(true)
    setCrudMessage(null)
    try {
      const html = generateEmailHTML(template)
      const res = await createTemplateRecord(
        apiCfg.templatesBaseUrl,
        { name, html, template },
        baseCrudOptions,
      )
      if (res.id) setCurrentTemplateId(res.id)
      setCrudMessage(`Created template${res.id ? ` (${res.id})` : ''}.`)
      void refreshTemplates()
    } catch (e) {
      setCrudMessage(e instanceof Error ? e.message : 'Create failed')
    } finally {
      setCrudLoading(false)
    }
  }

  const loadTemplateById = async (id: string) => {
    if (!canUseCrud) return
    setCrudLoading(true)
    setCrudMessage(null)
    try {
      const next = await getTemplateRecord(apiCfg.templatesBaseUrl, id, baseCrudOptions)
      setTemplate(next)
      setCurrentTemplateId(id)
      setCrudMessage(`Loaded template ${id}.`)
    } catch (e) {
      setCrudMessage(e instanceof Error ? e.message : 'Load failed')
    } finally {
      setCrudLoading(false)
    }
  }

  const updateTemplateById = async (id: string) => {
    if (!canUseCrud) return
    const name = templateName.trim() || template.documentName || 'Untitled template'
    setCrudLoading(true)
    setCrudMessage(null)
    try {
      const html = generateEmailHTML(template)
      await updateTemplateRecord(
        apiCfg.templatesBaseUrl,
        id,
        { name, html, template },
        baseCrudOptions,
      )
      setCurrentTemplateId(id)
      setCrudMessage(`Updated template ${id}.`)
      void refreshTemplates()
    } catch (e) {
      setCrudMessage(e instanceof Error ? e.message : 'Update failed')
    } finally {
      setCrudLoading(false)
    }
  }

  const deleteTemplateById = async (id: string) => {
    if (!canUseCrud) return
    const ok = window.confirm(`Delete template ${id}?`)
    if (!ok) return
    setCrudLoading(true)
    setCrudMessage(null)
    try {
      await deleteTemplateRecord(apiCfg.templatesBaseUrl, id, baseCrudOptions)
      setCurrentTemplateId((cur) => (cur === id ? null : cur))
      setTemplates((rows) => rows.filter((row) => row.id !== id))
      setCrudMessage(`Deleted template ${id}.`)
    } catch (e) {
      setCrudMessage(e instanceof Error ? e.message : 'Delete failed')
    } finally {
      setCrudLoading(false)
    }
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
        {canUseCrud ? (
          <button
            type="button"
            onClick={openManager}
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Templates
          </button>
        ) : null}
        <button
          type="button"
          onClick={openExport}
          className="inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-800 hover:bg-indigo-100"
        >
          <PiExport className="h-4 w-4" aria-hidden />
          Export HTML
        </button>
      </header>
      {canUseCrud ? (
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-1.5 text-xs text-slate-600">
          Template CRUD API: <code>{apiCfg.templatesBaseUrl}</code>
          {currentTemplateId ? (
            <span className="ml-2">
              Current ID: <code>{currentTemplateId}</code>
            </span>
          ) : null}
          {crudMessage ? <span className="ml-2 font-semibold">{crudMessage}</span> : null}
        </div>
      ) : null}

      {managerOpen ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4">
          <div className="flex max-h-[88vh] w-full max-w-5xl flex-col rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h2 className="text-lg font-semibold text-slate-900">Templates manager</h2>
              <button
                type="button"
                onClick={() => setManagerOpen(false)}
                className="rounded p-1 text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-3 border-b border-slate-200 px-4 py-3 md:grid-cols-6">
              <input
                className="md:col-span-2 rounded-md border border-slate-200 px-2 py-2 text-sm"
                placeholder="Name for create/update"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
              <input
                className="md:col-span-2 rounded-md border border-slate-200 px-2 py-2 text-sm"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <input
                type="number"
                min={1}
                className="rounded-md border border-slate-200 px-2 py-2 text-sm"
                value={page}
                onChange={(e) => setPage(Math.max(1, Number(e.target.value) || 1))}
              />
              <input
                type="number"
                min={1}
                className="rounded-md border border-slate-200 px-2 py-2 text-sm"
                value={limit}
                onChange={(e) => setLimit(Math.max(1, Number(e.target.value) || 20))}
              />
              <div className="md:col-span-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={crudLoading || listLoading}
                  onClick={() => void createTemplate()}
                  className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  Create from current
                </button>
                <button
                  type="button"
                  disabled={crudLoading || listLoading}
                  onClick={() => void refreshTemplates()}
                  className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  {listLoading ? 'Loading...' : 'Refresh list'}
                </button>
                {currentTemplateId ? (
                  <button
                    type="button"
                    disabled={crudLoading}
                    onClick={() => void updateTemplateById(currentTemplateId)}
                    className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Update current
                  </button>
                ) : null}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto p-4">
              {templates.length === 0 ? (
                <div className="rounded-md border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                  No templates found for this query.
                </div>
              ) : (
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-600">
                      <th className="px-2 py-2">ID</th>
                      <th className="px-2 py-2">Name</th>
                      <th className="px-2 py-2">Updated</th>
                      <th className="px-2 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templates.map((row) => (
                      <tr key={row.id} className="border-b border-slate-100">
                        <td className="px-2 py-2 font-mono text-xs text-slate-700">{row.id}</td>
                        <td className="px-2 py-2 text-slate-800">{row.name || '-'}</td>
                        <td className="px-2 py-2 text-slate-600">{row.updatedAt || '-'}</td>
                        <td className="px-2 py-2">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={crudLoading}
                              onClick={() => void loadTemplateById(row.id)}
                              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            >
                              Load
                            </button>
                            <button
                              type="button"
                              disabled={crudLoading}
                              onClick={() => void updateTemplateById(row.id)}
                              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            >
                              Update
                            </button>
                            <button
                              type="button"
                              disabled={crudLoading}
                              onClick={() => void deleteTemplateById(row.id)}
                              className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700 hover:bg-red-100 disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      ) : null}

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
              Table-based layout with inline styles from{' '}
              <code className="rounded bg-slate-100 px-1">generateEmailHTML</code>.
              {apiCfg.api && apiCfg.exportUrl ? (
                <span className="mt-1 block text-indigo-700">
                  With API mode, opening this dialog also POSTs HTML and template JSON to your{' '}
                  <code className="rounded bg-slate-100 px-1">exportUrl</code>.
                </span>
              ) : null}
            </p>
            {exportPosting ? (
              <p className="px-4 pt-2 text-xs font-semibold text-slate-600">Saving to server...</p>
            ) : null}
            {exportPostOk ? (
              <p className="px-4 pt-2 text-xs font-semibold text-emerald-700">{exportPostOk}</p>
            ) : null}
            {exportPostError ? (
              <div className="px-4 pt-2">
                <p className="text-xs font-semibold text-red-700">{exportPostError}</p>
                {apiCfg.api && apiCfg.exportUrl ? (
                  <button
                    type="button"
                    className="mt-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    onClick={retryServerExport}
                  >
                    Retry server save
                  </button>
                ) : null}
              </div>
            ) : null}
            <textarea
              readOnly
              className="m-4 min-h-[240px] flex-1 resize-y rounded-md border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-800"
              value={exportHtml}
            />
            <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3">
              {apiCfg.api && apiCfg.exportUrl ? (
                <button
                  type="button"
                  disabled={exportPosting}
                  onClick={retryServerExport}
                  className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-800 hover:bg-indigo-100 disabled:opacity-50"
                >
                  {exportPosting ? 'Saving...' : 'Save to server again'}
                </button>
              ) : null}
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
