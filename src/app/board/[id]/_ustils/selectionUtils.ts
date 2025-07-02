import { BoardItem } from '@/types/board'
import { Point, SelectionRect, getStrokeBoundingBox, isPointInRect, doRectsIntersect } from './coordinateUtils'

export function findHitItem(
    point: Point,
    items: BoardItem[],
    selectedIds: number[]
): number | null {
    // Check if we hit any selected item first
    for (const id of selectedIds) {
        const item = items.find(item => item.id === id)
        if (!item || item.type !== 'stroke') continue
        
        const bbox = getStrokeBoundingBox(item)
        if (isPointInRect(point, bbox)) {
            return id
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
    dx: number,
    dy: number
): BoardItem[] {
    return items.map(item => {
        if (!selectedIds.includes(item.id)) return item
        return translateStroke(item, dx, dy)
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
