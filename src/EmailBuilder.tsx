import { useEffect, useLayoutEffect } from 'react'
import { useParams } from 'react-router-dom'
import type { CSSProperties } from 'react'
import './index.css'
import { EditorShellWithoutToolbar } from '@/components/editor/EditorShellWithoutToolbar'
import { EmailBuilderApiProvider } from '@/context/EmailBuilderApiProvider'
import type { EmailBuilderApiContextValue } from '@/context/emailBuilderApiContext'
import { useEmailStore } from '@/store/emailStore'
import type { EmailTemplate } from '@/types'
import type { ApiEndpoint } from '@/utils/emailBuilderApi'
import { fetchTemplateFromEndpoint, getTemplateRecord } from '@/utils/emailBuilderApi'
import { normalizeEmailTemplate } from '@/utils/normalizeEmailTemplate'
import { getTemplateFromStorage } from '@/utils/localStorage'
import { TopNavbar } from '@/components/navigation/TopNavbar'
import { createExampleTemplate } from '@/core/exampleTemplate'

export type { ApiEndpoint }
const EDITOR_DRAFT_STORAGE_KEY = 'email-template-builder:editor-draft'

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
  const { templateId } = useParams<{ templateId?: string }>()
  const setTemplate = useEmailStore((s) => s.setTemplate)
  const setActiveTemplateId = useEmailStore((s) => s.setActiveTemplateId)
  const setCanvasView = useEmailStore((s) => s.setCanvasView)
  const serialized =
    templateProp !== undefined ? JSON.stringify(templateProp) : undefined

  const loadUrlKey = loadUrl
    ? `${loadUrl.method}:${loadUrl.url}:${JSON.stringify(loadUrl.headers ?? {})}`
    : ''

  // Load template from URL parameter
  useEffect(() => {
    if (templateProp !== undefined) return
    if (!templateId) {
      // New template route: keep in-memory state and restore local draft if available.
      // This prevents losing unsaved edits when navigating Preview -> Editor.
      try {
        const rawDraft = localStorage.getItem(EDITOR_DRAFT_STORAGE_KEY)
        if (rawDraft) {
          const parsed = JSON.parse(rawDraft)
          const normalized = normalizeEmailTemplate(parsed)
          setTemplate(normalized)
        }
      } catch {
        localStorage.removeItem(EDITOR_DRAFT_STORAGE_KEY)
      }
      setActiveTemplateId(null)
      setCanvasView('editor')
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        let loadedTemplate: EmailTemplate | null = null

        if (api) {
          // Try to load from API first
          try {
            const apiTemplate = await getTemplateRecord(`http://localhost:3001`, templateId, {
              credentials: credentials ?? 'same-origin'
            })
            loadedTemplate = apiTemplate.template
          } catch (apiError) {
            console.warn('Failed to load from API, trying localStorage:', apiError)
          }
        }

        // Fallback to localStorage
        if (!loadedTemplate) {
          const stored = getTemplateFromStorage(templateId)
          if (stored) {
            loadedTemplate = stored.template
          }
        }

        // Final fallback to mock data
        if (!loadedTemplate) {
          try {
            const response = await fetch('/mock/email-templates.json')
            const data = await response.json()
            const mockTemplate = data.items.find((item: any) => item.id === templateId)
            if (mockTemplate) {
              loadedTemplate = mockTemplate.template
            }
          } catch (mockError) {
            console.warn('Failed to load mock template:', mockError)
          }
        }

        if (cancelled) return

        if (loadedTemplate) {
          setTemplate(normalizeEmailTemplate(loadedTemplate))
          setActiveTemplateId(templateId)
          setCanvasView('editor')
        } else {
          onLoadError?.(new Error(`Template with ID ${templateId} not found`))
          setTemplate(createExampleTemplate())
          setActiveTemplateId(null)
          setCanvasView('editor')
        }
      } catch (e) {
        if (cancelled) return
        const err = e instanceof Error ? e : new Error(String(e))
        onLoadError?.(err)
        setTemplate(createExampleTemplate())
        setActiveTemplateId(null)
        setCanvasView('editor')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [templateId, api, credentials, templateProp, setTemplate, setActiveTemplateId, setCanvasView, onLoadError])

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
    if (templateId) return // Don't use loadUrl if we have templateId
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
  }, [api, loadUrlKey, credentials, templateProp, setTemplate, onLoadError, loadUrl, templateId])

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

  useEffect(() => {
    let prev = ''
    return useEmailStore.subscribe((state) => {
      // Persist unsaved draft for no-id editor sessions.
      if (state.activeTemplateId) return
      const serialized = JSON.stringify(state.template)
      if (serialized === prev) return
      prev = serialized
      localStorage.setItem(EDITOR_DRAFT_STORAGE_KEY, serialized)
    })
  }, [])

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
        <TopNavbar />
        <EditorShellWithoutToolbar />
      </div>
    </EmailBuilderApiProvider>
  )
}
