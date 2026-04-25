import type { EmailTemplate } from '@/types'
import { normalizeEmailTemplate } from '@/utils/normalizeEmailTemplate'

/** HTTP verb; lower or upper case accepted. */
export type ApiEndpoint = {
  method: string
  url: string
  headers?: Record<string, string>
}

export type TemplateListItem = {
  id: string
  name?: string
  description?: string
  thumbnail?: string
  isActive?: boolean
  templateJson?: unknown
  htmlOutput?: string
  updatedAt?: string
  createdAt?: string
}

export type TemplateCrudPayload = {
  name: string
  description?: string
  html: string
  template: EmailTemplate
  thumbnail?: string
  isActive?: boolean
}

export function normalizeHttpMethod(method: string): string {
  return method.toUpperCase()
}

export function parseImageUrlFromResponse(
  data: unknown,
  custom?: (json: unknown) => string | undefined,
): string | undefined {
  if (custom) {
    const u = custom(data)
    if (u) return u
  }
  if (typeof data === 'string') {
    const t = data.trim()
    if (t.startsWith('http') || t.startsWith('/')) return t
    return undefined
  }
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>
    for (const k of ['url', 'src', 'path', 'location', 'fileUrl', 'imageUrl']) {
      const v = o[k]
      if (typeof v === 'string' && v) return v
    }
    const inner = o.data
    if (inner && typeof inner === 'object') {
      const d = inner as Record<string, unknown>
      for (const k of ['url', 'path', 'src']) {
        const v = d[k]
        if (typeof v === 'string' && v) return v
      }
    }
  }
  return undefined
}

export function resolveUrlMaybeRelative(href: string, baseUrl: string): string {
  try {
    return new URL(href, baseUrl).href
  } catch {
    return href
  }
}

export async function uploadFileToEndpoint(
  endpoint: ApiEndpoint,
  file: File,
  options: {
    fieldName: string
    credentials?: RequestCredentials
    parseUploadResponse?: (json: unknown) => string | undefined
  },
): Promise<string> {
  const fd = new FormData()
  fd.append(options.fieldName, file)
  const res = await fetch(endpoint.url, {
    method: normalizeHttpMethod(endpoint.method),
    headers: { ...endpoint.headers },
    body: fd,
    credentials: options.credentials ?? 'same-origin',
  })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`Upload failed (${res.status}): ${t || res.statusText}`)
  }
  const ct = (res.headers.get('content-type') ?? '').toLowerCase()
  let data: unknown
  if (ct.includes('application/json')) {
    data = await res.json()
  } else {
    const text = (await res.text()).trim()
    data = text || {}
  }

  let url: string | undefined
  if (typeof data === 'string') {
    const t = data.trim()
    if (t.startsWith('http') || t.startsWith('/')) {
      url = t
    } else {
      try {
        url = parseImageUrlFromResponse(JSON.parse(t), options.parseUploadResponse)
      } catch {
        url = undefined
      }
    }
  } else {
    url = parseImageUrlFromResponse(data, options.parseUploadResponse)
  }

  if (!url) {
    throw new Error('Upload succeeded but the response did not include an image URL')
  }
  return resolveUrlMaybeRelative(url, endpoint.url)
}

export async function postEmailExport(
  endpoint: ApiEndpoint,
  payload: { html: string; template: EmailTemplate },
  options: {
    credentials?: RequestCredentials
    buildExportBody?: (p: { html: string; template: EmailTemplate }) => BodyInit
    buildExportHeaders?: (p: {
      html: string
      template: EmailTemplate
    }) => Record<string, string>
  },
): Promise<Response> {
  const body = options.buildExportBody
    ? options.buildExportBody(payload)
    : JSON.stringify({ html: payload.html, template: payload.template })
  const extra = options.buildExportHeaders?.(payload) ?? {}
  const headers: Record<string, string> = {
    ...endpoint.headers,
    ...extra,
  }
  if (!options.buildExportBody && typeof body === 'string') {
    if (!headers['Content-Type'] && !headers['content-type']) {
      headers['Content-Type'] = 'application/json'
    }
  }
  const res = await fetch(endpoint.url, {
    method: normalizeHttpMethod(endpoint.method),
    headers,
    body,
    credentials: options.credentials ?? 'same-origin',
  })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`Export failed (${res.status}): ${t || res.statusText}`)
  }
  return res
}

export async function fetchTemplateFromEndpoint(
  endpoint: ApiEndpoint,
  credentials?: RequestCredentials,
): Promise<EmailTemplate> {
  const res = await fetch(endpoint.url, {
    method: normalizeHttpMethod(endpoint.method),
    headers: { ...endpoint.headers },
    credentials: credentials ?? 'same-origin',
  })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`Failed to load template (${res.status}): ${t || res.statusText}`)
  }
  const data: unknown = await res.json()
  return normalizeEmailTemplate(data)
}

function ensureJsonHeaders(headers: Record<string, string>): Record<string, string> {
  if (!headers['Content-Type'] && !headers['content-type']) {
    headers['Content-Type'] = 'application/json'
  }
  return headers
}

function normalizeCrudBase(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '')
}

function unwrapTemplateId(data: unknown): string {
  if (!data || typeof data !== 'object') return ''
  const o = data as Record<string, unknown>
  if (typeof o.id === 'string') return o.id
  if (typeof o._id === 'string') return o._id
  const nested = o.data
  if (nested && typeof nested === 'object') {
    const d = nested as Record<string, unknown>
    if (typeof d.id === 'string') return d.id
    if (typeof d._id === 'string') return d._id
  }
  return ''
}

function mapTemplateRecord(x: unknown): TemplateListItem {
  const o = x as Record<string, unknown>
  return {
    id: String(o.id ?? o._id ?? ''),
    name: typeof o.name === 'string' ? o.name : undefined,
    description: typeof o.description === 'string' ? o.description : undefined,
    thumbnail:
      typeof o.thumbnail === 'string'
        ? o.thumbnail
        : typeof o.preview_image === 'string'
          ? o.preview_image
          : undefined,
    isActive:
      typeof o.is_active === 'boolean'
        ? o.is_active
        : typeof o.isActive === 'boolean'
          ? o.isActive
          : undefined,
    templateJson: o.template_json ?? o.templateJson ?? o.template,
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
  }
}

function unwrapListRows(data: unknown): unknown[] {
  if (Array.isArray(data)) return data
  if (!data || typeof data !== 'object') return []
  const o = data as Record<string, unknown>
  const candidates = [
    o.items,
    o.results,
    o.rows,
    o.templates,
    o.data,
    (o.data as Record<string, unknown> | undefined)?.items,
    (o.data as Record<string, unknown> | undefined)?.results,
    (o.data as Record<string, unknown> | undefined)?.rows,
    (o.data as Record<string, unknown> | undefined)?.templates,
    (o.payload as Record<string, unknown> | undefined)?.items,
  ]
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate
  }
  return []
}

function unwrapTemplatePayload(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data
  const o = data as Record<string, unknown>
  if (o.template !== undefined) return o.template
  if (o.data && typeof o.data === 'object') {
    const d = o.data as Record<string, unknown>
    if (d.template !== undefined) return d.template
  }
  return data
}

/** Read API record name/description from common response shapes. */
function readRecordNameDescription(data: unknown): { name?: string; description?: string } {
  if (!data || typeof data !== 'object') return {}
  const o = data as Record<string, unknown>
  const name = typeof o.name === 'string' ? o.name : undefined
  const description = typeof o.description === 'string' ? o.description : undefined
  if (name !== undefined || description !== undefined) return { name, description }
  if (o.data && typeof o.data === 'object') return readRecordNameDescription(o.data)
  return {}
}

export async function createTemplateRecord(
  baseUrl: string,
  payload: TemplateCrudPayload,
  options?: { credentials?: RequestCredentials; headers?: Record<string, string> },
): Promise<{ id: string }> {
  const url = `${normalizeCrudBase(baseUrl)}/api/gift-cards/email-templates`
  const res = await fetch(url, {
    method: 'POST',
    headers: ensureJsonHeaders({ ...(options?.headers ?? {}) }),
    credentials: options?.credentials ?? 'same-origin',
    body: JSON.stringify({
      name: payload.name,
      description: payload.description ?? '',
      template_json: payload.template,
      html_output: payload.html,
      thumbnail: payload.thumbnail ?? '',
      is_active: payload.isActive ?? true,
    }),
  })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`Create template failed (${res.status}): ${t || res.statusText}`)
  }
  const data = (await res.json().catch(() => ({}))) as unknown
  return { id: unwrapTemplateId(data) }
}

export async function listTemplateRecords(
  baseUrl: string,
  params: { page?: number; limit?: number; search?: string },
  options?: { credentials?: RequestCredentials; headers?: Record<string, string> },
): Promise<TemplateListItem[]> {
  const url = new URL(`${normalizeCrudBase(baseUrl)}/api/gift-cards/email-templates`)
  if (params.page) url.searchParams.set('page', String(params.page))
  if (params.limit) url.searchParams.set('limit', String(params.limit))
  if (params.search) url.searchParams.set('search', params.search)
  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { ...(options?.headers ?? {}) },
    credentials: options?.credentials ?? 'same-origin',
  })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`List templates failed (${res.status}): ${t || res.statusText}`)
  }
  const data = (await res.json()) as unknown
  const arr = unwrapListRows(data)
  return arr.map(mapTemplateRecord).filter((x) => x.id)
}

export async function getTemplateRecord(
  baseUrl: string,
  id: string,
  options?: { credentials?: RequestCredentials; headers?: Record<string, string> },
): Promise<EmailTemplate> {
  const url = `${normalizeCrudBase(baseUrl)}/api/gift-cards/email-templates/${encodeURIComponent(id)}`
  const res = await fetch(url, {
    method: 'GET',
    headers: { ...(options?.headers ?? {}) },
    credentials: options?.credentials ?? 'same-origin',
  })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`Get template failed (${res.status}): ${t || res.statusText}`)
  }
  const data = (await res.json()) as unknown
  const payload = unwrapTemplatePayload(data)
  const obj = payload as Record<string, unknown>
  const normalizedPayload = obj?.template_json ?? obj?.templateJson ?? payload
  const base = normalizeEmailTemplate(normalizedPayload)
  const { name: nameFromApi, description: descFromApi } = readRecordNameDescription(data)
  return {
    ...base,
    documentName: base.documentName ?? nameFromApi,
    description: base.description ?? descFromApi,
  }
}

export async function updateTemplateRecord(
  baseUrl: string,
  id: string,
  payload: Partial<TemplateCrudPayload>,
  options?: { credentials?: RequestCredentials; headers?: Record<string, string> },
): Promise<void> {
  const url = `${normalizeCrudBase(baseUrl)}/api/gift-cards/email-templates/${encodeURIComponent(id)}`
  const res = await fetch(url, {
    method: 'PUT',
    headers: ensureJsonHeaders({ ...(options?.headers ?? {}) }),
    credentials: options?.credentials ?? 'same-origin',
    body: JSON.stringify({
      name: payload.name,
      description: payload.description,
      template_json: payload.template,
      html_output: payload.html,
      thumbnail: payload.thumbnail,
      is_active: payload.isActive,
    }),
  })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`Update template failed (${res.status}): ${t || res.statusText}`)
  }
}

export async function deleteTemplateRecord(
  baseUrl: string,
  id: string,
  options?: { credentials?: RequestCredentials; headers?: Record<string, string> },
): Promise<void> {
  const url = `${normalizeCrudBase(baseUrl)}/api/gift-cards/email-templates/${encodeURIComponent(id)}`
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { ...(options?.headers ?? {}) },
    credentials: options?.credentials ?? 'same-origin',
  })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`Delete template failed (${res.status}): ${t || res.statusText}`)
  }
}
