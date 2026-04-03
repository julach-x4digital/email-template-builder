import { useContext } from 'react'
import { EmailBuilderApiContext } from '@/context/emailBuilderApiContext'

export function useEmailBuilderApi() {
  return useContext(EmailBuilderApiContext)
}
