import { useRef, useState, useEffect, useCallback } from 'react'
import { BoardItem, Stroke } from '@/types/board'
import { drawStroke, drawSelectionBox, drawSelectionMarquee } from '../_ustils/drawingUtils'

// interface CanvasState {
//     size: { width: number; height: number }
//     dpr: number
//     zoom: number
//     offset: { x: number; y: number }
// }

interface UseCanvasProps {
    items: BoardItem[]
    currentStroke: React.MutableRefObject<Stroke | null>
    dragSelectionRect: { x: number; y: number; width: number; height: number } | null
    selectedIds: number[]
}

export function useCanvas({ items, currentStroke, dragSelectionRect, selectedIds }: UseCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const selectionRectRef = useRef<DOMRect | null>(null)

    // Canvas state
    const [size, setSize] = useState({ width: 0, height: 0 })
    const [dpr, setDpr] = useState(1)
    const [zoom, setZoom] = useState(1)
    const [offset, setOffset] = useState({ x: 0, y: 0 })

    // Refs for optimization
    const zoomRef = useRef(zoom)
    const offsetRef = useRef(offset)

    // Update refs when state changes
    useEffect(() => {
        zoomRef.current = zoom
    }, [zoom])

    useEffect(() => {
        offsetRef.current = offset
    }, [offset])

    // Fill viewport
    useEffect(() => {
        function updateSize() {
            setSize({ width: window.innerWidth, height: window.innerHeight })
        }
        updateSize()
        window.addEventListener('resize', updateSize)
        return () => window.removeEventListener('resize', updateSize)
    }, [])

    // DPR optimization
    useEffect(() => {
        const updateDpr = () => { setDpr(window.devicePixelRatio || 1) }

        // run once on mount to pick up the real DPR
        updateDpr()

        // fallback on window resize
        window.addEventListener('resize', updateDpr)

        // matchMedia for DPR changes
        const mql = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
        mql.addEventListener('change', updateDpr)

        return () => {
            window.removeEventListener('resize', updateDpr)
            mql.removeEventListener('change', updateDpr)
        }
    }, [])

    // canvas.getBoundingClientRect() optimisation
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        function updateSelectionRect() {
            if (!canvas) return
            selectionRectRef.current = canvas.getBoundingClientRect()
        }

        updateSelectionRect()

        window.addEventListener('resize', updateSelectionRect)
        window.addEventListener('scroll', updateSelectionRect, true)

        return () => {
            window.removeEventListener('resize', updateSelectionRect)
            window.removeEventListener('scroll', updateSelectionRect, true)
        }
    }, [size.width, size.height])

    // Custom hook for coordinate transformation
    const toLogicalCoords = useCallback((e: PointerEvent) => {
        const rect = selectionRectRef.current!
        const z = zoomRef.current
        const { x: ox, y: oy } = offsetRef.current
        return {
            x: (e.clientX - rect.left) / z - ox,
            y: (e.clientY - rect.top) / z - oy,
        }
    }, [])

    // Redrawing items (on zoom or size change)
    useEffect(() => {
        const c = canvasRef.current
        if (!c) return
        const ctx = c.getContext('2d')
        if (!ctx) return

        // resize buffer for HiDPI
        c.width = size.width * dpr
        c.height = size.height * dpr

        // clear
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.clearRect(0, 0, c.width, c.height)

        // apply zoom/pan (with DPR)
        const scale = zoom * dpr
        ctx.setTransform(scale, 0, 0, scale, offset.x * scale, offset.y * scale)

        // draw saved strokes
        for (const stroke of items.filter(item => item.type === 'stroke')) {
            drawStroke(ctx, stroke, zoom, offset, dpr)
        }

        // draw in-flight stroke
        if (currentStroke.current) {
            drawStroke(ctx, currentStroke.current, zoom, offset, dpr)
        }

        // draw marquee or selection boxes
        if (dragSelectionRect) {
            drawSelectionMarquee(ctx, dragSelectionRect, zoom)
        } else {
            for (const id of selectedIds) {
                const s = items.filter(item => item.type === 'stroke').find(s => s.id === id)!
                const xs = s.points.map(p => p.x), ys = s.points.map(p => p.y)
                const bx = Math.min(...xs), by = Math.min(...ys)
                const bw = Math.max(...xs) - bx, bh = Math.max(...ys) - by
                drawSelectionBox(ctx, { x: bx, y: by, width: bw, height: bh }, zoom)
            }
        }
    }, [size.width, size.height, zoom, offset, items, dragSelectionRect, selectedIds, dpr, currentStroke])

    return {
        canvasRef,
        selectionRectRef,
        size,
        dpr,
        zoom,
        offset,
        zoomRef,
        offsetRef,
        setZoom,
        setOffset,
        toLogicalCoords,
    }
}
