import { create } from 'zustand'
import { createBlock } from '@/core/blockFactory'
import { createExampleTemplate } from '@/core/exampleTemplate'
import type {
  BlockType,
  EditorSelection,
  EmailComponent,
  EmailSection,
  EmailStyles,
  EmailTemplate,
} from '@/types'
import { newId } from '@/utils/id'
import { findBlockLocation, findComponentById } from '@/utils/templateQueries'

const HISTORY_LIMIT = 10

function cloneTemplate(t: EmailTemplate): EmailTemplate {
  return structuredClone(t)
}

function ensureColumnCount(section: EmailSection, count: number): EmailSection {
  const n = Math.min(3, Math.max(1, count))
  const cols = [...section.columns]
  while (cols.length < n) cols.push({ id: newId(), components: [] })
  while (cols.length > n) {
    const removed = cols.pop()
    if (removed?.components.length && cols.length > 0) {
      cols[cols.length - 1]!.components.push(...removed.components)
    }
  }
  return { ...section, columns: cols }
}

export type EmailStore = {
  template: EmailTemplate
  selected: EditorSelection | null
  past: EmailTemplate[]
  future: EmailTemplate[]

  setTemplate: (t: EmailTemplate) => void
  updateDocument: (
    patch: Partial<
      Pick<EmailTemplate, 'width' | 'bodyStyles' | 'meta' | 'documentName'>
    >,
  ) => void
  previewDevice: 'desktop' | 'mobile'
  setPreviewDevice: (d: 'desktop' | 'mobile') => void
  canvasView: 'editor' | 'preview'
  setCanvasView: (v: 'editor' | 'preview') => void
  select: (sel: EditorSelection | null) => void

  addSection: (atIndex?: number) => void
  removeSection: (sectionId: string) => void
  reorderSections: (activeIndex: number, overIndex: number) => void
  setSectionColumnCount: (sectionId: string, count: number) => void
  updateSectionStyles: (sectionId: string, styles: Partial<EmailStyles>) => void

  updateColumnStyles: (
    sectionId: string,
    columnId: string,
    styles: Partial<EmailStyles>,
  ) => void

  insertBlockAtColumn: (columnId: string, index: number, type: BlockType) => void
  moveBlock: (
    blockId: string,
    toColumnId: string,
    toIndex: number,
  ) => void
  reorderInColumn: (columnId: string, fromIndex: number, toIndex: number) => void
  duplicateComponent: (componentId: string) => void
  removeComponent: (componentId: string) => void
  updateComponent: (
    componentId: string,
    patch: Partial<{
      content: EmailComponent['content']
      styles: Partial<EmailStyles>
      settings: EmailComponent['settings']
    }>,
  ) => void

  // Higher-level, UI-oriented helpers (requested API surface)
  deleteComponent: (componentId: string) => void
  updateComponentStyles: (componentId: string, styles: Partial<EmailStyles>) => void
  updateComponentContent: (componentId: string, content: EmailComponent['content']) => void
  selectComponent: (componentId: string) => void

  undo: () => void
  redo: () => void
  /** Replace history tip (e.g. after load) */
  resetHistory: () => void
}

function pushPast(
  past: EmailTemplate[],
  snapshot: EmailTemplate,
): EmailTemplate[] {
  const next = [...past, cloneTemplate(snapshot)]
  return next.length > HISTORY_LIMIT ? next.slice(-HISTORY_LIMIT) : next
}

export const useEmailStore = create<EmailStore>((set, get) => ({
  template: createExampleTemplate(),
  selected: null,
  past: [],
  future: [],
  previewDevice: 'desktop',
  canvasView: 'editor',

  setPreviewDevice: (d) => set({ previewDevice: d }),
  setCanvasView: (v) => set({ canvasView: v }),

  resetHistory: () => set({ past: [], future: [] }),

  setTemplate: (t) =>
    set({
      template: cloneTemplate(t),
      selected: null,
      past: [],
      future: [],
    }),

  updateDocument: (patch) => {
    const prev = get().template
    set((s) => ({
      past: pushPast(s.past, prev),
      future: [],
      template: {
        ...prev,
        ...patch,
        meta: patch.meta !== undefined ? { ...prev.meta, ...patch.meta } : prev.meta,
        bodyStyles:
          patch.bodyStyles !== undefined
            ? { ...prev.bodyStyles, ...patch.bodyStyles }
            : prev.bodyStyles,
      },
    }))
  },

  select: (sel) => set({ selected: sel }),

  addSection: (atIndex) => {
    const prev = get().template
    set((s) => ({
      past: pushPast(s.past, prev),
      future: [],
      template: (() => {
        const col = { id: newId(), components: [] as EmailComponent[] }
        const section: EmailSection = {
          id: newId(),
          styles: { backgroundColor: '#ffffff', padding: '24px' },
          columns: [col],
        }
        const sections = [...prev.sections]
        const i =
          atIndex === undefined ? sections.length : Math.max(0, Math.min(atIndex, sections.length))
        sections.splice(i, 0, section)
        return { ...prev, sections }
      })(),
    }))
  },

  removeSection: (sectionId) => {
    const prev = get().template
    set((s) => ({
      past: pushPast(s.past, prev),
      future: [],
      template: {
        ...prev,
        sections: prev.sections.filter((sec) => sec.id !== sectionId),
      },
      selected:
        s.selected?.id === sectionId ||
        s.selected?.sectionId === sectionId
          ? null
          : s.selected,
    }))
  },

  reorderSections: (activeIndex, overIndex) => {
    const prev = get().template
    if (activeIndex === overIndex) return
    set((s) => ({
      past: pushPast(s.past, prev),
      future: [],
      template: (() => {
        const sections = [...prev.sections]
        const [moved] = sections.splice(activeIndex, 1)
        if (!moved) return prev
        sections.splice(overIndex, 0, moved)
        return { ...prev, sections }
      })(),
    }))
  },

  setSectionColumnCount: (sectionId, count) => {
    const prev = get().template
    set((s) => ({
      past: pushPast(s.past, prev),
      future: [],
      template: {
        ...prev,
        sections: prev.sections.map((sec) =>
          sec.id === sectionId ? ensureColumnCount(sec, count) : sec,
        ),
      },
    }))
  },

  updateSectionStyles: (sectionId, partial) => {
    const prev = get().template
    set((s) => ({
      past: pushPast(s.past, prev),
      future: [],
      template: {
        ...prev,
        sections: prev.sections.map((sec) =>
          sec.id === sectionId
            ? { ...sec, styles: { ...sec.styles, ...partial } as EmailStyles }
            : sec,
        ),
      },
    }))
  },

  updateColumnStyles: (sectionId, columnId, partial) => {
    const prev = get().template
    set((s) => ({
      past: pushPast(s.past, prev),
      future: [],
      template: {
        ...prev,
        sections: prev.sections.map((sec) =>
          sec.id !== sectionId
            ? sec
            : {
                ...sec,
                columns: sec.columns.map((col) =>
                  col.id === columnId
                    ? {
                        ...col,
                        styles: { ...(col.styles ?? {}), ...partial } as EmailStyles,
                      }
                    : col
                ),
              },
        ),
      },
    }))
  },

  insertBlockAtColumn: (columnId, index, type) => {
    const prev = get().template
    let sectionId: string | undefined
    for (const sec of prev.sections) {
      if (sec.columns.some((c) => c.id === columnId)) {
        sectionId = sec.id
        break
      }
    }
    const block = createBlock(type)
    set((s) => ({
      past: pushPast(s.past, prev),
      future: [],
      template: {
        ...prev,
        sections: prev.sections.map((sec) => ({
          ...sec,
          columns: sec.columns.map((col) => {
            if (col.id !== columnId) return col
            const components = [...col.components]
            const i = Math.max(0, Math.min(index, components.length))
            components.splice(i, 0, block)
            return { ...col, components }
          }),
        })),
      },
      selected:
        sectionId !== undefined
          ? {
              kind: 'component',
              id: block.id,
              sectionId,
              columnId,
            }
          : s.selected,
    }))
  },

  /** Move a block to another column (or append). Same-column moves use `reorderInColumn`. */
  moveBlock: (blockId, toColumnId, toIndex) => {
    const prev = get().template
    const from = findBlockLocation(prev, blockId)
    if (!from || from.columnId === toColumnId) return
    set((s) => ({
      past: pushPast(s.past, prev),
      future: [],
      template: (() => {
        let moving: EmailComponent | undefined
        const sections = prev.sections.map((sec) => ({
          ...sec,
          columns: sec.columns.map((col) => {
            if (col.id !== from.columnId) return col
            const components = [...col.components]
            ;[moving] = components.splice(from.index, 1)
            return { ...col, components }
          }),
        }))
        if (!moving) return prev
        return {
          ...prev,
          sections: sections.map((sec) => ({
            ...sec,
            columns: sec.columns.map((col) => {
              if (col.id !== toColumnId) return col
              const components = [...col.components]
              const insertAt = Math.max(0, Math.min(toIndex, components.length))
              components.splice(insertAt, 0, moving!)
              return { ...col, components }
            }),
          })),
        }
      })(),
    }))
  },

  reorderInColumn: (columnId, fromIndex, toIndex) => {
    const prev = get().template
    set((s) => ({
      past: pushPast(s.past, prev),
      future: [],
      template: {
        ...prev,
        sections: prev.sections.map((sec) => ({
          ...sec,
          columns: sec.columns.map((col) => {
            if (col.id !== columnId) return col
            const components = [...col.components]
            const [item] = components.splice(fromIndex, 1)
            if (!item) return col
            components.splice(toIndex, 0, item)
            return { ...col, components }
          }),
        })),
      },
    }))
  },

  duplicateComponent: (componentId) => {
    const prev = get().template
    const loc = findBlockLocation(prev, componentId)
    if (!loc) return
    const found = findComponentById(prev, componentId)
    if (!found) return

    const { component } = found
    const copy: EmailComponent = structuredClone(component)
    copy.id = newId()

    set((s) => ({
      past: pushPast(s.past, prev),
      future: [],
      template: {
        ...prev,
        sections: prev.sections.map((sec) => {
          if (sec.id !== loc.sectionId) return sec
          return {
            ...sec,
            columns: sec.columns.map((col) => {
              if (col.id !== loc.columnId) return col
              const components = [...col.components]
              components.splice(loc.index + 1, 0, copy)
              return { ...col, components }
            }),
          }
        }),
      },
      selected: {
        kind: 'component',
        id: copy.id,
        sectionId: loc.sectionId,
        columnId: loc.columnId,
      },
    }))
  },

  removeComponent: (componentId) => {
    const prev = get().template
    set((s) => ({
      past: pushPast(s.past, prev),
      future: [],
      template: {
        ...prev,
        sections: prev.sections.map((sec) => ({
          ...sec,
          columns: sec.columns.map((col) => ({
            ...col,
            components: col.components.filter((c) => c.id !== componentId),
          })),
        })),
      },
      selected: s.selected?.id === componentId ? null : s.selected,
    }))
  },

  updateComponent: (componentId, patch) => {
    const prev = get().template
    set((s) => ({
      past: pushPast(s.past, prev),
      future: [],
      template: {
        ...prev,
        sections: prev.sections.map((sec) => ({
          ...sec,
          columns: sec.columns.map((col) => ({
            ...col,
            components: col.components.map((c) => {
              if (c.id !== componentId) return c
              return {
                ...c,
                // Replace `content` in full so optional flags (e.g. text bold) can be cleared.
                content:
                  patch.content !== undefined
                    ? (patch.content as typeof c.content)
                    : c.content,
                styles:
                  patch.styles !== undefined
                    ? (() => {
                        // Sanitize optional style patches:
                        // - `''` clears the style key (so toggles can turn styles off).
                        // - otherwise only non-empty strings are applied.
                        const next: Record<string, string> = { ...c.styles }
                        for (const [k, v] of Object.entries(patch.styles ?? {})) {
                          if (typeof v !== 'string') continue
                          if (v === '') {
                            delete next[k]
                            continue
                          }
                          next[k] = v
                        }
                        return next
                      })()
                    : c.styles,
                settings:
                  patch.settings !== undefined ? (patch.settings as typeof c.settings) : c.settings,
              }
            }),
          })),
        })),
      },
    }))
  },

  deleteComponent: (componentId) => {
    get().removeComponent(componentId)
  },

  updateComponentStyles: (componentId, styles) => {
    get().updateComponent(componentId, { styles })
  },

  updateComponentContent: (componentId, content) => {
    get().updateComponent(componentId, { content })
  },

  selectComponent: (componentId) => {
    const template = get().template
    const loc = findBlockLocation(template, componentId)
    if (!loc) return
    get().select({
      kind: 'component',
      id: componentId,
      sectionId: loc.sectionId,
      columnId: loc.columnId,
    })
  },

  undo: () => {
    const { past, template, future } = get()
    if (!past.length) return
    const previous = past[past.length - 1]!
    set({
      template: cloneTemplate(previous),
      past: past.slice(0, -1),
      future: [cloneTemplate(template), ...future].slice(0, HISTORY_LIMIT),
      selected: null,
    })
  },

  redo: () => {
    const { future, template, past } = get()
    if (!future.length) return
    const next = future[0]!
    set({
      template: cloneTemplate(next),
      future: future.slice(1),
      past: pushPast(past, template),
      selected: null,
    })
  },
}))
