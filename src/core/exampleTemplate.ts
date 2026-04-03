import type { EmailTemplate } from '@/types'
import { newId } from '@/utils/id'

/** Starter layout: hero text, image placeholder, CTA — demonstrates JSON shape. */
export function createExampleTemplate(): EmailTemplate {
  const sectionId = newId()
  const colId = newId()
  const t1 = newId()
  const t2 = newId()
  const img = newId()
  const btn = newId()

  return {
    id: newId(),
    documentName: 'New Message',
    meta: {
      subject: 'Your April newsletter',
      preheader: 'Updates inside — open to read more.',
    },
    width: '600px',
    bodyStyles: {
      backgroundColor: '#f4f4f5',
      margin: '0',
      padding: '24px 0',
    },
    sections: [
      {
        id: sectionId,
        styles: {
          backgroundColor: '#ffffff',
          padding: '32px 24px',
        },
        columns: [
          {
            id: colId,
            components: [
              {
                id: t1,
                type: 'text',
                content: { text: 'Hello there,' },
                styles: {
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#111827',
                  fontFamily: 'Georgia, serif',
                  margin: '0 0 12px 0',
                },
              },
              {
                id: t2,
                type: 'text',
                content: {
                  text: 'This is a sample email built with the template editor. Drag blocks from the left, arrange them in the canvas, and export email-safe HTML when you are ready.',
                },
                styles: {
                  fontSize: '16px',
                  lineHeight: '1.6',
                  color: '#4b5563',
                  fontFamily: 'Arial, Helvetica, sans-serif',
                  margin: '0 0 20px 0',
                },
              },
              {
                id: img,
                type: 'image',
                content: {
                  src: 'https://via.placeholder.com/552x180/e0e7ff/4338ca?text=Banner',
                  alt: 'Banner',
                },
                styles: {
                  maxWidth: '100%',
                  height: 'auto',
                  display: 'block',
                  border: '0',
                  margin: '0 0 20px 0',
                },
              },
              {
                id: btn,
                type: 'button',
                content: { label: 'View in browser', href: 'https://example.com' },
                styles: {
                  backgroundColor: '#4f46e5',
                  color: '#ffffff',
                  padding: '14px 28px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontSize: '16px',
                  fontFamily: 'Arial, Helvetica, sans-serif',
                  display: 'inline-block',
                },
              },
            ],
          },
        ],
      },
    ],
  }
}
