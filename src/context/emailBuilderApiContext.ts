import { createContext } from 'react'
import type { EmailTemplate } from '@/types'
import type { ApiEndpoint } from '@/utils/emailBuilderApi'

export type EmailBuilderApiContextValue = {
  api: boolean
  imgUrl?: ApiEndpoint
  exportUrl?: ApiEndpoint
  loadUrl?: ApiEndpoint
  uploadFieldName: string
  credentials: RequestCredentials
  parseUploadResponse?: (json: unknown) => string | undefined
  buildExportBody?: (p: { html: string; template: EmailTemplate }) => BodyInit
  buildExportHeaders?: (p: {
    html: string
    template: EmailTemplate
  }) => Record<string, string>
  onExportSuccess?: (response: Response) => void
  onExportError?: (error: Error) => void
  onLoadError?: (error: Error) => void
}

const defaultValue: EmailBuilderApiContextValue = {
  api: false,
  uploadFieldName: 'file',
  credentials: 'same-origin',
}

export const EmailBuilderApiContext = createContext<EmailBuilderApiContextValue>(defaultValue)
