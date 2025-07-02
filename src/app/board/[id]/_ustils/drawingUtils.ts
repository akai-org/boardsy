import { Stroke } from '@/types/board'
import { Point } from './coordinateUtils'

export function drawStroke(
    ctx: CanvasRenderingContext2D,
    stroke: Stroke,
    zoom: number,
    offset: { x: number; y: number },
    dpr: number
) {
    ctx.strokeStyle = stroke.color
    ctx.lineWidth = stroke.width
    ctx.beginPath()
    stroke.points.forEach((p, i) => 
        i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)
    )
    ctx.stroke()
}

export function drawStrokeSegment(
    ctx: CanvasRenderingContext2D,
    prev: Point,
    current: Point,
    stroke: Stroke,
    zoom: number,
    offset: { x: number; y: number },
    dpr: number
) {
    // draw segment in _physical_ space without the current transform
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)    // reset to identity
    ctx.strokeStyle = stroke.color
    ctx.lineWidth = stroke.width
    ctx.beginPath()
    ctx.moveTo((prev.x + offset.x) * zoom * dpr, (prev.y + offset.y) * zoom * dpr)
    ctx.lineTo((current.x + offset.x) * zoom * dpr, (current.y + offset.y) * zoom * dpr)
    ctx.stroke()
    ctx.restore()
}

export function drawSelectionBox(
    ctx: CanvasRenderingContext2D,
    rect: { x: number; y: number; width: number; height: number },
    zoom: number
) {
    ctx.save()
    ctx.strokeStyle = 'rgba(0,120,255,0.8)'
    ctx.lineWidth = 2 / zoom
    ctx.setLineDash([])
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height)
    ctx.restore()
}

export function drawSelectionMarquee(
    ctx: CanvasRenderingContext2D,
    rect: { x: number; y: number; width: number; height: number },
    zoom: number
) {
    ctx.save()
    ctx.strokeStyle = 'rgba(0,120,255,0.8)'
    ctx.lineWidth = 1 / zoom
    ctx.setLineDash([4 / zoom, 2 / zoom])
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height)
    ctx.restore()
}

export function createStroke(
    id: number,
    startPoint: Point,
    color: string = 'black',
    width: number = 2
): Stroke {
    return {
        id,
        type: 'stroke',
        points: [startPoint],
        color,
        width,
    }
}

export function saveStrokeToServer(stroke: Stroke, boardId: string) {
    const formData = new FormData()
    formData.append('boardid', boardId)
    formData.append('boarditem', JSON.stringify(stroke))
    
    return fetch("/api/board/additem", {
        method: 'POST',
        body: formData,
    })
}
