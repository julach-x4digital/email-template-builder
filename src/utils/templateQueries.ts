import type { EmailColumn, EmailComponent, EmailSection, EmailTemplate } from '@/types'

export type BlockLocation = { sectionId: string; columnId: string; index: number }

export function getSectionById(
  template: EmailTemplate,
  sectionId: string,
): EmailSection | null {
  return template.sections.find((s) => s.id === sectionId) ?? null
}

export function findBlockLocation(
  template: EmailTemplate,
  blockId: string,
): BlockLocation | null {
  for (const sec of template.sections) {
    for (const col of sec.columns) {
      const index = col.components.findIndex((c) => c.id === blockId)
      if (index >= 0) return { sectionId: sec.id, columnId: col.id, index }
    }
  }
  return null
}

export function getColumnById(
  template: EmailTemplate,
  columnId: string,
): EmailColumn | null {
  for (const sec of template.sections) {
    const col = sec.columns.find((c) => c.id === columnId)
    if (col) return col
  }
  return null
}

export function findComponentById(
  template: EmailTemplate,
  componentId: string,
): { component: EmailComponent; sectionId: string; columnId: string } | null {
  for (const sec of template.sections) {
    for (const col of sec.columns) {
      const component = col.components.find((c) => c.id === componentId)
      if (component) return { component, sectionId: sec.id, columnId: col.id }
    }
  }
  return null
}

/** Palette drop: insert before a block, or append when `over` is the column droppable. */
export function resolveColumnInsertIndex(
  template: EmailTemplate,
  overId: string,
): { columnId: string; index: number } | null {
  const asBlock = findBlockLocation(template, overId)
  if (asBlock) return { columnId: asBlock.columnId, index: asBlock.index }
  const col = getColumnById(template, overId)
  if (col) return { columnId: col.id, index: col.components.length }
  return null
}
