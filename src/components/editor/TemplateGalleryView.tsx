import { useEffect, useState } from 'react'
import { FiEdit2, FiEye, FiMoreVertical, FiPlus, FiSearch, FiTrash2 } from 'react-icons/fi'
import { createExampleTemplate } from '@/core/exampleTemplate'
import { useEmailBuilderApi } from '@/context/useEmailBuilderApi'
import { useEmailStore } from '@/store/emailStore'
import {
  deleteTemplateRecord,
  getTemplateRecord,
  listTemplateRecords,
  type TemplateListItem,
} from '@/utils/emailBuilderApi'
import { normalizeEmailTemplate } from '@/utils/normalizeEmailTemplate'

type TemplateCard = TemplateListItem

function formatDateLabel(v?: string): string {
  if (!v) return '-'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return v
  return d.toLocaleDateString()
}

export function TemplateGalleryView() {
  const apiCfg = useEmailBuilderApi()
  const setTemplate = useEmailStore((s) => s.setTemplate)
  const setCanvasView = useEmailStore((s) => s.setCanvasView)
  const setActiveTemplateId = useEmailStore((s) => s.setActiveTemplateId)

  const [rows, setRows] = useState<TemplateCard[]>([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

  const canUseCrud = apiCfg.api && !!apiCfg.templatesBaseUrl

  const refreshFromApi = async () => {
    if (!canUseCrud) return
    setLoading(true)
    setMsg(null)
    try {
      const list = await listTemplateRecords(
        apiCfg.templatesBaseUrl,
        { page: 1, limit: 100, search: search.trim() || undefined },
        { credentials: apiCfg.credentials, headers: apiCfg.exportUrl?.headers },
      )
      setRows(list)
      setMsg(`Loaded ${list.length} templates.`)
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Template list failed')
    } finally {
      setLoading(false)
    }
  }

  const loadMock = async () => {
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch('/mock/email-templates.json')
      if (!res.ok) throw new Error(`Failed to load mock templates (${res.status})`)
      const data = (await res.json()) as unknown
      const arr = Array.isArray(data)
        ? data
        : ((data as Record<string, unknown>)?.items as unknown[]) ?? []
      const mapped = arr
        .map((x) => {
          const o = x as Record<string, unknown>
          return {
            id: String(o.id ?? o._id ?? ''),
            name: typeof o.name === 'string' ? o.name : 'Mock template',
            description: typeof o.description === 'string' ? o.description : undefined,
            thumbnail: typeof o.thumbnail === 'string' ? o.thumbnail : undefined,
            templateJson: o.template_json ?? o.template,
            htmlOutput:
              typeof o.html_output === 'string'
                ? o.html_output
                : typeof o.htmlOutput === 'string'
                  ? o.htmlOutput
                  : undefined,
            updatedAt:
              typeof o.updated_at === 'string'
                ? o.updated_at
                : typeof o.updatedAt === 'string'
                  ? o.updatedAt
                  : undefined,
            createdAt:
              typeof o.created_at === 'string'
                ? o.created_at
                : typeof o.createdAt === 'string'
                  ? o.createdAt
                  : undefined,
          } as TemplateCard
        })
        .filter((r) => r.id)
      setRows(mapped)
      setMsg(`Loaded ${mapped.length} mock templates.`)
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Mock load failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (canUseCrud) {
      void refreshFromApi()
    } else {
      void loadMock()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUseCrud])

  const previewTemplate = async (row: TemplateCard, closeToEditor: boolean) => {
    try {
      if (row.templateJson !== undefined) {
        const next = normalizeEmailTemplate(row.templateJson)
        setTemplate({
          ...next,
          documentName: next.documentName ?? row.name,
          description: next.description ?? row.description,
        })
      } else if (canUseCrud) {
        const next = await getTemplateRecord(
          apiCfg.templatesBaseUrl,
          row.id,
          { credentials: apiCfg.credentials, headers: apiCfg.exportUrl?.headers },
        )
        setTemplate(next)
      } else {
        setMsg('No template JSON available for this card.')
        return
      }
      setActiveTemplateId(row.id)
      if (closeToEditor) setCanvasView('editor')
      setMsg(`Loaded template ${row.id}.`)
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Could not load template')
    }
  }

  const deleteTemplate = async (row: TemplateCard) => {
    if (!canUseCrud) {
      setRows((cur) => cur.filter((x) => x.id !== row.id))
      setMsg(`Removed mock template ${row.id}.`)
      return
    }
    const ok = window.confirm(`Delete template ${row.name || row.id}?`)
    if (!ok) return
    try {
      await deleteTemplateRecord(
        apiCfg.templatesBaseUrl,
        row.id,
        { credentials: apiCfg.credentials, headers: apiCfg.exportUrl?.headers },
      )
      setRows((cur) => cur.filter((x) => x.id !== row.id))
      setMsg(`Deleted template ${row.id}.`)
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  const filteredRows = rows.filter((r) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return `${r.name ?? ''} ${r.id}`.toLowerCase().includes(q)
  })

  const startNewTemplate = () => {
    setActiveTemplateId(null)
    setTemplate(createExampleTemplate())
    setCanvasView('editor')
  }

  const isEmptyList = rows.length === 0 && !loading
  const noSearchMatches = rows.length > 0 && filteredRows.length === 0

  return (
    <div className="flex h-full min-h-0 min-w-0 w-full flex-1 flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-3">
        <h2 className="mr-2 text-sm font-semibold text-slate-900">Templates</h2>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 rounded-md border border-slate-200 px-2">
            <FiSearch className="h-4 w-4 text-slate-500" />
            <input
              className="w-full border-none py-2 text-sm outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or id"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={startNewTemplate}
          className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <FiPlus className="h-4 w-4" aria-hidden />
          Create template
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => (canUseCrud ? void refreshFromApi() : void loadMock())}
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      <div className="px-4 py-2 text-xs text-slate-600">
        {canUseCrud ? (
          <span>
            API mode: <code>{apiCfg.templatesBaseUrl}</code>
          </span>
        ) : (
          <span>API not connected — showing mock templates.</span>
        )}
        {msg ? <span className="ml-2 font-semibold">{msg}</span> : null}
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        {filteredRows.length === 0 ? (
          <div className="mx-auto max-w-md rounded-md border border-dashed border-slate-300 p-10 text-center">
            {loading && rows.length === 0 ? (
              <p className="text-sm text-slate-600">Loading templates…</p>
            ) : noSearchMatches ? (
              <p className="text-sm text-slate-600">No templates match your search.</p>
            ) : isEmptyList ? (
              <>
                <p className="text-sm font-medium text-slate-800">
                  {canUseCrud ? 'No templates yet' : 'No mock templates loaded'}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {canUseCrud
                    ? 'Create your first template to open the editor, then use Save template to store it on the API.'
                    : 'Add entries to your mock JSON or connect the API to list templates.'}
                </p>
                <button
                  type="button"
                  onClick={startNewTemplate}
                  className="mt-6 inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  <FiPlus className="h-4 w-4" aria-hidden />
                  Create template
                </button>
              </>
            ) : (
              <p className="text-sm text-slate-500">No templates found.</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredRows.map((row) => {
              const isMenuOpen = menuOpenId === row.id
              return (
                <div key={row.id} className="group relative rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                  <button
                    type="button"
                    className="absolute right-2 top-2 z-20 rounded-md border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-50"
                    onClick={() => setMenuOpenId((cur) => (cur === row.id ? null : row.id))}
                    aria-label="Template actions"
                  >
                    <FiMoreVertical className="h-4 w-4" />
                  </button>

                  {isMenuOpen ? (
                    <div className="absolute right-2 top-10 z-30 w-40 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                        onClick={() => {
                          setMenuOpenId(null)
                          void previewTemplate(row, false)
                        }}
                      >
                        <FiEye className="h-4 w-4" />
                        Preview
                      </button>
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                        onClick={() => {
                          setMenuOpenId(null)
                          void previewTemplate(row, true)
                        }}
                      >
                        <FiEdit2 className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-red-700 hover:bg-red-50"
                        onClick={() => {
                          setMenuOpenId(null)
                          void deleteTemplate(row)
                        }}
                      >
                        <FiTrash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => void previewTemplate(row, true)}
                    className="block w-full text-left"
                  >
                    <div className="mb-2 flex h-36 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                      {row.thumbnail ? (
                        <img src={row.thumbnail} alt={row.name || 'Template thumbnail'} className="h-full w-full object-cover" />
                      ) : (
                        <div className="w-full px-3 text-center text-xs text-slate-500">
                          No thumbnail
                        </div>
                      )}
                    </div>
                    <div className="px-1">
                      <div className="truncate text-sm font-semibold text-slate-900">
                        {row.name || 'Untitled template'}
                      </div>
                      {row.description ? (
                        <div className="mt-0.5 line-clamp-2 text-xs text-slate-600">{row.description}</div>
                      ) : null}
                      <div className="mt-1 text-xs text-slate-500">
                        {formatDateLabel(row.updatedAt || row.createdAt)}
                      </div>
                    </div>
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
