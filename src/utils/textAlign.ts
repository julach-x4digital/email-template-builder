export type EmailAlign = 'left' | 'center' | 'right' | 'justify'

/** Map style `textAlign` to CSS; `td align` is only left/center/right (justify uses left + text-align). */
export function emailTextAlign(textAlign: string | undefined): EmailAlign {
  if (
    textAlign === 'center' ||
    textAlign === 'right' ||
    textAlign === 'justify'
  ) {
    return textAlign
  }
  return 'left'
}

/** HTML `align` attribute on &lt;td&gt; (no `justify` in classic email). */
export function emailTdAlign(align: EmailAlign): 'left' | 'center' | 'right' {
  if (align === 'justify') return 'left'
  return align
}
