import type { ReactNode } from 'react'
import { EmailBuilderApiProvider } from '@/context/EmailBuilderApiProvider'
import type { EmailBuilderApiContextValue } from '@/context/emailBuilderApiContext'

const defaultApiConfig: EmailBuilderApiContextValue = {
  api: false,
  templatesBaseUrl: 'http://localhost:3001',
  uploadFieldName: 'file',
  credentials: 'same-origin',
}

interface AppWrapperProps {
  children: ReactNode
}

export function AppWrapper({ children }: AppWrapperProps) {
  return (
    <EmailBuilderApiProvider value={defaultApiConfig}>
      {children}
    </EmailBuilderApiProvider>
  )
}