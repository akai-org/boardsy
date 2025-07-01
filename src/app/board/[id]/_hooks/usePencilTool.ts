import { useEffect } from 'react'
import { Stroke } from '@/types/board'
import { Tools } from '../_components/ToolBar'
import { createStroke, saveStrokeToServer, drawStrokeSegment } from '../_ustils/drawingUtils'

interface UsePencilToolProps {
    activeTool: Tools
    canvasRef: React.RefObject<HTMLCanvasElement | null>
    toLogicalCoords: (e: PointerEvent) => { x: number; y: number }
    zoomRef: React.MutableRefObject<number>
    offsetRef: React.MutableRefObject<{ x: number; y: number }>
    dpr: number
    size: { width: number; height: number }
    nextId: React.MutableRefObject<number>
    currentStroke: React.MutableRefObject<Stroke | null>
    setItems: React.Dispatch<React.SetStateAction<import('@/types/board').BoardItem[]>>
    boardId: string
}

export function usePencilTool({
    activeTool,
    canvasRef,
    toLogicalCoords,
    zoomRef,
    offsetRef,
    dpr,
    size,
    nextId,
    currentStroke,
    setItems,
    boardId
}: UsePencilToolProps) {
    // pencil handlers
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas || activeTool !== Tools.PENCIL) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        function onPointerDown(e: PointerEvent) {
            if (e.button !== 0 || !canvas) return
            const { x, y } = toLogicalCoords(e)
            currentStroke.current = createStroke(nextId.current++, { x, y })
            canvas.setPointerCapture(e.pointerId)
        }

        function onPointerMove(e: PointerEvent) {
            // only draw while the left button is down
            if (!(e.buttons & 1)) return
            const stroke = currentStroke.current
            if (!stroke || !ctx) return

            // get new logical point
            const { x: lx, y: ly } = toLogicalCoords(e)
            stroke.points.push({ x: lx, y: ly })

            // compute previous point + pan/zoom/DPR
            const prev = stroke.points[stroke.points.length - 2]!
            const z = zoomRef.current
            const { x: ox, y: oy } = offsetRef.current

            // draw segment in _physical_ space without the current transform
            drawStrokeSegment(ctx, prev, { x: lx, y: ly }, stroke, z, { x: ox, y: oy }, dpr)
        }

        function onPointerUp(e: PointerEvent) {
            if (!canvas) return
            const stroke = currentStroke.current
            if (stroke) {
                setItems((s) => [...s, stroke])
                currentStroke.current = null
                saveStrokeToServer(stroke, boardId)
            }
            canvas.releasePointerCapture(e.pointerId)
        }

        // attach events
        canvas.addEventListener('pointerdown', onPointerDown)
        canvas.addEventListener('pointermove', onPointerMove)
        canvas.addEventListener('pointerup', onPointerUp)
        canvas.addEventListener('pointercancel', onPointerUp)
        window.addEventListener('pointerup', onPointerUp)

        return () => {
            canvas.removeEventListener('pointerdown', onPointerDown)
            canvas.removeEventListener('pointermove', onPointerMove)
            canvas.removeEventListener('pointerup', onPointerUp)
            canvas.removeEventListener('pointercancel', onPointerUp)
            window.removeEventListener('pointerup', onPointerUp)
        }
    }, [activeTool, size.width, size.height, dpr, toLogicalCoords, boardId, canvasRef, currentStroke, nextId, setItems, zoomRef, offsetRef])
}
