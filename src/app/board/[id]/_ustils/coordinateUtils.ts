import { BoardItem } from '@/types/board'

export interface Point {
    x: number
    y: number
}

export interface SelectionRect {
    x: number
    y: number
    width: number
    height: number
}

export function toLogicalCoords(
    e: PointerEvent,
    rect: DOMRect,
    zoom: number,
    offset: { x: number; y: number }
): Point {
    return {
        x: (e.clientX - rect.left) / zoom - offset.x,
        y: (e.clientY - rect.top) / zoom - offset.y,
    }
}

export function getBoundingBox(points: Point[]): SelectionRect {
    if (points.length === 0) {
        return { x: 0, y: 0, width: 0, height: 0 }
    }

    const xs = points.map(p => p.x)
    const ys = points.map(p => p.y)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)

    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
    }
}

export function isPointInRect(point: Point, rect: SelectionRect): boolean {
    return (
        point.x >= rect.x &&
        point.x <= rect.x + rect.width &&
        point.y >= rect.y &&
        point.y <= rect.y + rect.height
    )
}

export function doRectsIntersect(rect1: SelectionRect, rect2: SelectionRect): boolean {
    return !(
        rect1.x + rect1.width < rect2.x ||
        rect1.x > rect2.x + rect2.width ||
        rect1.y + rect1.height < rect2.y ||
        rect1.y > rect2.y + rect2.height
    )
}

export function getStrokeBoundingBox(stroke: BoardItem): SelectionRect {
    if (stroke.type !== 'stroke') {
        return { x: 0, y: 0, width: 0, height: 0 }
    }
    return getBoundingBox(stroke.points)
}
