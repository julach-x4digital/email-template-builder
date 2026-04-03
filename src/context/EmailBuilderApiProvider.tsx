import type { ReactNode } from 'react'
import {
  EmailBuilderApiContext,
  type EmailBuilderApiContextValue,
} from '@/context/emailBuilderApiContext'

export type { EmailBuilderApiContextValue }

export function EmailBuilderApiProvider({
  value,
  children,
}: {
  value: EmailBuilderApiContextValue
  children: ReactNode
}) {
  return (
    <EmailBuilderApiContext.Provider value={value}>{children}</EmailBuilderApiContext.Provider>
  )
}
