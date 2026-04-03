import type { ReactNode } from 'react'
import { useState } from 'react'
import { useEmailStore } from '@/store/emailStore'
import type { ButtonContent, EmailComponent, TextContent } from '@/types'
import { stylesToReact } from '@/utils/styles'

type Props = {
  component: EmailComponent
  selected: boolean
  onSelect: () => void
}

/** Live preview of a single block inside the editor canvas (DOM, not export HTML). */
export function BlockPreview({ component, selected, onSelect }: Props) {
  const updateComponent = useEmailStore((s) => s.updateComponent)
  const [isEditing, setIsEditing] = useState(false)
  const [draftText, setDraftText] = useState('')

  const ring = selected
    ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-white'
    : 'ring-1 ring-transparent hover:ring-slate-300'

  const shell = (children: ReactNode) => (
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
      className={`cursor-pointer rounded-md transition-shadow ${ring}`}
    >
      {children}
    </div>
  )

  switch (component.type) {
    case 'text': {
      const tc = component.content as TextContent
      const { textAlign: textAlignRaw, ...textStyleRest } = component.styles
      const formatInline = (s: string): ReactNode => {
        let x: ReactNode = s
        if (tc.subscript)
          x = (
            <sub className="align-baseline text-[0.85em] leading-none">{x}</sub>
          )
        else if (tc.superscript)
          x = (
            <sup className="align-baseline text-[0.85em] leading-none">{x}</sup>
          )
        if (tc.underline) x = <u>{x}</u>
        if (tc.strikethrough) x = <s>{x}</s>
        if (tc.italic) x = <em>{x}</em>
        if (tc.bold) x = <strong>{x}</strong>
        return x
      }
      const ta = (textAlignRaw === 'center' || textAlignRaw === 'right' ? textAlignRaw : 'left') as
        | 'left'
        | 'center'
        | 'right'
      const listType = tc.listType ?? 'none'
      const listLines =
        listType === 'ul' || listType === 'ol' ? tc.text.split(/\r?\n/) : []
      if (isEditing && selected) {
        const st = {
          ...stylesToReact(textStyleRest),
          textAlign: ta,
          width: '100%',
          resize: 'none' as const,
          background: 'transparent',
        }
        return shell(
          <textarea
            value={draftText}
            style={st}
            className="m-0 min-h-[70px] break-words outline-none"
            onChange={(e) => setDraftText(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onBlur={() => {
              setIsEditing(false)
              const next: TextContent = { ...tc, text: draftText }
              updateComponent(component.id, { content: next })
            }}
            onKeyDown={(e) => {
              // Prevent the parent “select on Enter/Space” handler from eating newlines.
              e.stopPropagation()
              if (e.key === 'Escape') {
                e.preventDefault()
                setIsEditing(false)
                setDraftText(tc.text)
              }
            }}
            autoFocus
          />,
        )
      }

      const variant = tc.variant ?? 'p'
      const TagEl = (variant === 'p' ? 'p' : variant) as
        | 'p'
        | 'h1'
        | 'h2'
        | 'h3'
        | 'h4'
        | 'h5'
        | 'h6'

      if (listType === 'ul' || listType === 'ol') {
        const ListTag = listType === 'ul' ? 'ul' : 'ol'
        const rows =
          listLines.length > 0 ? listLines : [tc.text]
        return shell(
          <div
            className="box-border min-w-0 pl-3 sm:pl-4"
            style={{ ...stylesToReact(textStyleRest), textAlign: ta }}
            onClick={(e) => {
              e.stopPropagation()
              onSelect()
              if (selected) {
                setIsEditing(true)
                setDraftText(tc.text)
              }
            }}
          >
            <ListTag
              className="[list-style-position:inside]"
              style={{
                margin: 0,
                paddingLeft: 0,
                listStyleType: listType === 'ul' ? 'disc' : 'decimal',
              }}
            >
              {rows.map((line, i) => {
                const t = line.trimEnd()
                return (
                  <li key={i} className="pl-0.5">
                    {t.length > 0 ? formatInline(t) : '\u00a0'}
                  </li>
                )
              })}
            </ListTag>
          </div>,
        )
      }

      return shell(
        <TagEl
          className="m-0 break-words"
          style={{ ...stylesToReact(textStyleRest), textAlign: ta }}
          onClick={(e) => {
            e.stopPropagation()
            onSelect()
            if (selected) {
              setIsEditing(true)
              setDraftText(tc.text)
            }
          }}
        >
          {formatInline(tc.text)}
        </TagEl>,
      )
    }
    case 'image': {
      const src = 'src' in component.content ? component.content.src : ''
      const alt = 'alt' in component.content ? component.content.alt : ''
      const { textAlign: imgAlign, ...imgSt } = component.styles
      const ta = imgAlign === 'center' || imgAlign === 'right' ? imgAlign : 'left'
      if (!src) {
        return shell(
          <div
            className="w-full rounded-md border-2 border-dashed border-slate-200 bg-white/70 p-4 text-center"
            style={{ textAlign: ta }}
          >
            <div className="mb-2 text-2xl leading-none" aria-hidden>
              🖼️
            </div>
            <div className="text-xs font-semibold text-slate-700">Drop or add image</div>
            <div className="mt-1 text-[11px] text-slate-500">
              Use the Image tab in Properties.
            </div>
          </div>,
        )
      }

      return shell(
        <div className="w-full" style={{ textAlign: ta }}>
          <img src={src} alt={alt} style={stylesToReact(imgSt)} className="max-w-full" />
        </div>,
      )
    }
    case 'button': {
      const label = 'label' in component.content ? component.content.label : ''
      const href = 'href' in component.content ? component.content.href : '#'
      const { textAlign: btnAlign, ...linkSt } = component.styles
      const ta = btnAlign === 'center' || btnAlign === 'right' ? btnAlign : 'left'
      const btnContent = component.content as ButtonContent
      const icon = btnContent.icon
      return shell(
        <div className="w-full" style={{ textAlign: ta }}>
          <a
            href={href}
            style={stylesToReact(linkSt)}
            className="inline-block"
            onClick={(e) => e.preventDefault()}
          >
            <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
              {icon?.src ? (
                <img
                  src={icon.src}
                  alt={icon.alt || 'Icon'}
                  style={{
                    display: 'inline-block',
                    verticalAlign: 'middle',
                    width: '18px',
                    height: '18px',
                    objectFit: 'contain',
                  }}
                />
              ) : null}
              {label}
            </span>
          </a>
        </div>,
      )
    }
    case 'divider': {
      const { textAlign: divAlign, ...divSt } = component.styles
      const ta = divAlign === 'center' || divAlign === 'right' ? divAlign : 'left'
      return shell(
        <div className="w-full" style={{ textAlign: ta }}>
          <div
            style={{ minHeight: '1px', ...stylesToReact(divSt) }}
            className="w-full"
          />
        </div>,
      )
    }
    case 'spacer': {
      const h = 'height' in component.content ? component.content.height : '16px'
      return shell(
        <div
          style={{ ...stylesToReact(component.styles), height: h, minHeight: h }}
          className="w-full bg-slate-100/50"
          aria-hidden
        />,
      )
    }
    default:
      return null
  }
}
