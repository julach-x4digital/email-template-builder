import type { EmailTemplate } from '@/types'
import { newId } from '@/utils/id'

/** Starter layout inspired by welcome-confirmation email. */
export function createExampleTemplate(): EmailTemplate {
  const sectionId = newId()
  const colId = newId()
  const spacerTop = newId()
  const title = newId()
  const body = newId()
  const btn = newId()
  const footer = newId()

  return {
    id: newId(),
    documentName: 'Welcome',
    meta: {
      subject: 'Welcome! Confirm your account',
      preheader: 'Press the button below to verify your account.',
    },
    width: '600px',
    bodyStyles: {
      backgroundColor: '#4ea4f1',
      margin: '0',
      padding: '0',
    },
    sections: [
      {
        id: sectionId,
        styles: {
          backgroundColor: '#ffffff',
          padding: '36px 40px',
          margin: '40px auto',
        },
        columns: [
          {
            id: colId,
            components: [
              {
                id: spacerTop,
                type: 'spacer',
                content: { height: '8px' },
                styles: {
                  height: '8px',
                  lineHeight: '8px',
                },
              },
              {
                id: title,
                type: 'text',
                content: {
                  text: 'Welcome!',
                  variant: 'h1',
                },
                styles: {
                  fontSize: '48px',
                  fontWeight: '600',
                  lineHeight: '1.1',
                  color: '#111827',
                  fontFamily: '"Segoe UI", Arial, Helvetica, sans-serif',
                  margin: '0 0 18px 0',
                  textAlign: 'center',
                },
              },
              {
                id: body,
                type: 'text',
                content: {
                  text: "We're excited to have you get started. First, you need to confirm your account. Just press the button below.",
                },
                styles: {
                  fontSize: '18px',
                  lineHeight: '1.6',
                  color: '#334155',
                  fontFamily: '"Segoe UI", Arial, Helvetica, sans-serif',
                  margin: '0 0 28px 0',
                  textAlign: 'center',
                },
              },
              {
                id: btn,
                type: 'button',
                content: { label: 'Confirm Account', href: 'https://example.com/confirm' },
                styles: {
                  backgroundColor: '#4ea4f1',
                  color: '#ffffff',
                  padding: '14px 30px',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  fontSize: '22px',
                  fontWeight: '600',
                  fontFamily: '"Segoe UI", Arial, Helvetica, sans-serif',
                  display: 'inline-block',
                  textAlign: 'center',
                  margin: '0 auto 34px auto',
                },
              },
              {
                id: footer,
                type: 'text',
                content: {
                  text: "If you have any questions, just reply to this email - we're always happy to help. \n\nBest regards,\nJulach Earzan",
                },
                styles: {
                  fontSize: '17px',
                  lineHeight: '1.6',
                  color: '#475569',
                  fontFamily: '"Segoe UI", Arial, Helvetica, sans-serif',
                  margin: '0',
                  textAlign: 'left',
                },
              },
            ],
          },
        ],
      },
    ],
  }
}
