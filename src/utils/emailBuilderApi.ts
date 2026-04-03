import type { EmailTemplate } from '@/types'
import { normalizeEmailTemplate } from '@/utils/normalizeEmailTemplate'

/** HTTP verb; lower or upper case accepted. */
export type ApiEndpoint = {
  method: string
  url: string
  headers?: Record<string, string>
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
