import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import { useState } from 'react'
import type { BlockType } from '@/types'
import { ComponentPalette } from '@/components/editor/ComponentPalette'
import { EditorCanvas } from '@/components/editor/EditorCanvas'
import { EditorDragOverlay } from '@/components/editor/EditorDragOverlay'
import { EditorToolbar } from '@/components/editor/EditorToolbar'
import { emailBuilderCollision } from '@/components/editor/emailBuilderCollision'
import { PropertiesPanel } from '@/components/editor/PropertiesPanel'
import { useEditorDragEnd } from '@/components/editor/useEditorDragEnd'

type ActiveDragData = {
  source?: string
  blockType?: BlockType
  type?: string
}

/**
 * App shell: single DndContext wraps palette + canvas so all drags share sensors/collision.
 * DragOverlay follows the pointer for clearer nested drops (sections / columns / blocks).
 */
export function EditorShell() {
  const applyDragEnd = useEditorDragEnd()
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)
  const [activeData, setActiveData] = useState<ActiveDragData | undefined>(undefined)
  const [paletteOpen, setPaletteOpen] = useState(true)
  const [propertiesOpen, setPropertiesOpen] = useState(true)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id)
    setActiveData(active.data.current as ActiveDragData | undefined)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    applyDragEnd(event)
    setActiveId(null)
    setActiveData(undefined)
  }

  const handleDragCancel = () => {
    setActiveId(null)
    setActiveData(undefined)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={emailBuilderCollision}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex h-[100dvh] w-full flex-col bg-slate-50">
        <EditorToolbar />
        <div className="flex min-h-0 min-w-0 flex-1">
          <aside
            className={`shrink-0 overflow-y-auto overflow-x-hidden border-r border-slate-200 bg-white transition-[width] duration-200 ease-out ${
              paletteOpen ? 'w-56' : 'w-12'
            }`}
          >
            <ComponentPalette
              collapsed={!paletteOpen}
              onToggleCollapse={() => setPaletteOpen((o) => !o)}
            />
          </aside>
          <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto p-3">
            <EditorCanvas />
          </main>
          <div
            className={`flex h-full min-w-0 shrink-0 overflow-hidden transition-[width] duration-200 ease-out ${
              propertiesOpen ? 'w-[30rem]' : 'w-12'
            }`}
          >
            <PropertiesPanel
              collapsed={!propertiesOpen}
              onToggleCollapse={() => setPropertiesOpen((o) => !o)}
            />
          </div>
        </div>
      </div>
      <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
        <EditorDragOverlay activeId={activeId} data={activeData} />
      </DragOverlay>
    </DndContext>
  )
}
