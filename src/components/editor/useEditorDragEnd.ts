import type { DragEndEvent } from '@dnd-kit/core'
import { useCallback } from 'react'
import { SECTIONS_ROOT_ID } from '@/core/constants'
import { useEmailStore } from '@/store/emailStore'
import type { BlockType } from '@/types'
import { findBlockLocation, getColumnById, resolveColumnInsertIndex } from '@/utils/templateQueries'

/**
 * Central dnd-kit `onDragEnd`: palette inserts, section reorder, block reorder / cross-column moves.
 */
export function useEditorDragEnd(): (event: DragEndEvent) => void {
  return useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const template = useEmailStore.getState().template
    const activeData = active.data.current
    const overIdStr = String(over.id)

    if (activeData?.source === 'palette' && activeData.blockType) {
      const target = resolveColumnInsertIndex(template, overIdStr)
      if (target) {
        useEmailStore
          .getState()
          .insertBlockAtColumn(target.columnId, target.index, activeData.blockType as BlockType)
      }
      return
    }

    if (activeData?.sortable?.containerId === SECTIONS_ROOT_ID) {
      const sections = template.sections
      const oldIdx = sections.findIndex((s) => s.id === active.id)
      const newIdx = sections.findIndex((s) => s.id === over.id)
      if (oldIdx >= 0 && newIdx >= 0 && oldIdx !== newIdx) {
        useEmailStore.getState().reorderSections(oldIdx, newIdx)
      }
      return
    }

    const activeLoc = findBlockLocation(template, String(active.id))
    if (!activeLoc) return

    const overCol = getColumnById(template, overIdStr)
    const overAsBlock = findBlockLocation(template, overIdStr)

    if (overAsBlock) {
      if (overAsBlock.columnId === activeLoc.columnId) {
        if (activeLoc.index !== overAsBlock.index) {
          useEmailStore.getState().reorderInColumn(activeLoc.columnId, activeLoc.index, overAsBlock.index)
        }
      } else {
        useEmailStore.getState().moveBlock(String(active.id), overAsBlock.columnId, overAsBlock.index)
      }
      return
    }

    if (overCol) {
      if (overCol.id === activeLoc.columnId) {
        const last = overCol.components.length - 1
        if (last >= 0 && activeLoc.index !== last) {
          useEmailStore.getState().reorderInColumn(activeLoc.columnId, activeLoc.index, last)
        }
      } else {
        useEmailStore.getState().moveBlock(String(active.id), overCol.id, overCol.components.length)
      }
    }
  }, [])
}
