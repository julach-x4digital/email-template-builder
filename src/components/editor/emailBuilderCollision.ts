import type { CollisionDetection } from '@dnd-kit/core'
import { closestCenter, pointerWithin } from '@dnd-kit/core'

/**
 * Prefer pointer-based hits for nested section/column/block droppables, then fall back to
 * closest-center so sortable lists still feel good when the pointer leaves rects briefly.
 */
export const emailBuilderCollision: CollisionDetection = (args) => {
  const byPointer = pointerWithin(args)
  if (byPointer.length > 0) return byPointer
  return closestCenter(args)
}
