import { BoardItem } from '@/types/board'
import { Point, SelectionRect, getStrokeBoundingBox, isPointInRect, doRectsIntersect } from './coordinateUtils'

export function findHitItem(
    point: Point,
    items: BoardItem[],
    selectedIds: number[]
): number | null {
    // Check if we hit any selected item first (for moving)
    for (const id of selectedIds) {
        const item = items.find(item => item.id === id)
        if (!item || item.type !== 'stroke') continue
        
        const bbox = getStrokeBoundingBox(item)
        if (isPointInRect(point, bbox)) {
            return id
        }
    }
    
    // If no selected item was hit, check all items (for initial selection)
    for (const item of items) {
        if (item.type !== 'stroke') continue
        
        const bbox = getStrokeBoundingBox(item)
        if (isPointInRect(point, bbox)) {
            return item.id
        }
    }
    
    return null
}

export function findItemsInSelectionRect(
    selectionRect: SelectionRect,
    items: BoardItem[]
): number[] {
    return items
        .filter(item => item.type === 'stroke')
        .filter(stroke => {
            const bbox = getStrokeBoundingBox(stroke)
            return doRectsIntersect(selectionRect, bbox)
        })
        .map(stroke => stroke.id)
}

export function translateStroke(
    stroke: BoardItem,
    dx: number,
    dy: number
): BoardItem {
    if (stroke.type !== 'stroke') return stroke
    
    return {
        ...stroke,
        points: stroke.points.map(point => ({
            x: point.x + dx,
            y: point.y + dy
        }))
    }
}

export function translateSelectedItems(
    items: BoardItem[],
    selectedIds: number[],
    originalPositions: Map<number, { x: number, y: number }[]>,
    dx: number,
    dy: number
): BoardItem[] {
    return items.map(item => {
        if (!selectedIds.includes(item.id) || item.type !== 'stroke') return item
        
        const originalPoints = originalPositions.get(item.id)
        if (!originalPoints) return item
        
        return {
            ...item,
            points: originalPoints.map(point => ({
                x: point.x + dx,
                y: point.y + dy
            }))
        }
    })
}

export function removeSelectedItems(
    items: BoardItem[],
    selectedIds: number[]
): BoardItem[] {
    return items.filter(item => !selectedIds.includes(item.id))
}

export function undoLastItem(items: BoardItem[]): BoardItem[] {
    if (items.length === 0) return items
    return items.slice(0, -1)
}
