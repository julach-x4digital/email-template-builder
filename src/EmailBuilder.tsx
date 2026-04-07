import { useEffect, useLayoutEffect } from 'react'
import type { CSSProperties } from 'react'
import './index.css'
import { EditorShell } from '@/components/editor/EditorShell'
import { EmailBuilderApiProvider } from '@/context/EmailBuilderApiProvider'
import type { EmailBuilderApiContextValue } from '@/context/emailBuilderApiContext'
import { useEmailStore } from '@/store/emailStore'
import type { EmailTemplate } from '@/types'
import type { ApiEndpoint } from '@/utils/emailBuilderApi'
import { fetchTemplateFromEndpoint } from '@/utils/emailBuilderApi'
import { normalizeEmailTemplate } from '@/utils/normalizeEmailTemplate'

export type { ApiEndpoint }

export type EmailBuilderProps = {
  className?: string
  style?: CSSProperties
  /** When true, `imgUrl` / `exportUrl` / `loadUrl` are used for HTTP calls. */
  api?: boolean
  /** Multipart upload target for image and icon file picks (e.g. POST /upload). */
  imgUrl?: ApiEndpoint
  /** Save generated HTML + template JSON (runs when the export dialog opens). */
  exportUrl?: ApiEndpoint
  /** Load initial template JSON (skipped if `template` is provided). */
  loadUrl?: ApiEndpoint
  /** Form field name for uploads (default `file`). */
  uploadFieldName?: string
  /** Base URL for template CRUD endpoints (default `http://localhost:3001`). */
  templatesBaseUrl?: string
  credentials?: RequestCredentials
  /** Controlled document: replaces the editor when this JSON value changes. */
  template?: unknown
  onTemplateChange?: (template: EmailTemplate) => void
  onExportSuccess?: (response: Response) => void
  onExportError?: (error: Error) => void
  onLoadError?: (error: Error) => void
  parseUploadResponse?: (json: unknown) => string | undefined
  buildExportBody?: (p: { html: string; template: EmailTemplate }) => BodyInit
  buildExportHeaders?: (p: {
    html: string
    template: EmailTemplate
  }) => Record<string, string>
}

function buildContextValue(props: EmailBuilderProps): EmailBuilderApiContextValue {
  return {
    api: props.api ?? false,
    imgUrl: props.imgUrl,
    exportUrl: props.exportUrl,
    loadUrl: props.loadUrl,
    templatesBaseUrl: props.templatesBaseUrl ?? 'http://localhost:3001',
    uploadFieldName: props.uploadFieldName ?? 'file',
    credentials: props.credentials ?? 'same-origin',
    parseUploadResponse: props.parseUploadResponse,
    buildExportBody: props.buildExportBody,
    buildExportHeaders: props.buildExportHeaders,
    onExportSuccess: props.onExportSuccess,
    onExportError: props.onExportError,
    onLoadError: props.onLoadError,
  }
}

function EmailBuilderEffects({
  template: templateProp,
  onLoadError,
  api,
  loadUrl,
  credentials,
  onTemplateChange,
}: EmailBuilderProps) {
  const setTemplate = useEmailStore((s) => s.setTemplate)
  const serialized =
    templateProp !== undefined ? JSON.stringify(templateProp) : undefined

  const loadUrlKey = loadUrl
    ? `${loadUrl.method}:${loadUrl.url}:${JSON.stringify(loadUrl.headers ?? {})}`
    : ''

  useLayoutEffect(() => {
    if (serialized === undefined) return
    let next: EmailTemplate
    try {
      next = normalizeEmailTemplate(JSON.parse(serialized))
    } catch {
      onLoadError?.(new Error('Invalid template JSON in `template` prop'))
      return
    }
    const cur = useEmailStore.getState().template
    if (JSON.stringify(cur) === JSON.stringify(next)) return
    setTemplate(next)
  }, [serialized, setTemplate, onLoadError])

  useEffect(() => {
    if (!api || !loadUrl) return
    if (templateProp !== undefined) return
    let cancelled = false
    ;(async () => {
      try {
        const t = await fetchTemplateFromEndpoint(loadUrl, credentials ?? 'same-origin')
        if (cancelled) return
        setTemplate(t)
      } catch (e) {
        if (cancelled) return
        const err = e instanceof Error ? e : new Error(String(e))
        onLoadError?.(err)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [api, loadUrlKey, credentials, templateProp, setTemplate, onLoadError, loadUrl])

  useEffect(() => {
    if (!onTemplateChange) return
    let prev = ''
    return useEmailStore.subscribe((state) => {
      const s = JSON.stringify(state.template)
      if (s === prev) return
      prev = s
      onTemplateChange(state.template)
    })
  }, [onTemplateChange])

  return null
}

export function EmailBuilder(props: EmailBuilderProps) {
  const ctx = buildContextValue(props)

  return (
    <EmailBuilderApiProvider value={ctx}>
      <EmailBuilderEffects {...props} />
      <div
        className={props.className ?? 'email-template-builder min-h-[100dvh] w-full'}
        style={props.style}
      >
        <EditorShell />
      </div>
    </EmailBuilderApiProvider>
  )
}
