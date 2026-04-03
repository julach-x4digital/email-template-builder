import type { BlockType, EmailComponent } from '@/types'
import { newId } from '@/utils/id'

/** Default block when dragging from palette or inserting. */
export function createBlock(type: BlockType): EmailComponent {
  const id = newId()
  switch (type) {
    case 'text':
      return {
        id,
        type,
        content: { text: 'Double-click or use the right panel to edit this text.' },
        styles: {
          fontSize: '16px',
          lineHeight: '1.5',
          color: '#333333',
          fontFamily: 'Arial, Helvetica, sans-serif',
          margin: '0',
        },
      }
    case 'image':
      return {
        id,
        type,
        content: {
          src: '',
          alt: '',
        },
        styles: {
          maxWidth: '100%',
          height: 'auto',
          display: 'block',
          border: '0',
        },
      }
    case 'button':
      return {
        id,
        type,
        content: {
          label: 'Call to action',
          href: 'https://example.com',
          icon: { src: '', alt: '' },
        },
        styles: {
          backgroundColor: '#2563eb',
          color: '#ffffff',
          padding: '12px 24px',
          borderRadius: '4px',
          textDecoration: 'none',
          fontSize: '16px',
          fontFamily: 'Arial, Helvetica, sans-serif',
          display: 'inline-block',
        },
      }
    case 'divider':
      return {
        id,
        type,
        content: {},
        styles: {
          borderTop: '1px solid #e5e7eb',
          margin: '16px 0',
          width: '100%',
        },
      }
    case 'spacer':
      return {
        id,
        type,
        content: { height: '24px' },
        styles: { height: '24px', lineHeight: '24px', fontSize: '1px' },
      }
    default:
      throw new Error(`Unknown block type: ${String(type)}`)
  }
}
