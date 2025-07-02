import { useEffect } from 'react'
import { MIN_ZOOM, MAX_ZOOM, STEP } from '../_components/ZoomControls'

interface UseZoomPanProps {
    canvasRef: React.RefObject<HTMLCanvasElement | null>
    selectionRectRef: React.MutableRefObject<DOMRect | null>
    zoomRef: React.MutableRefObject<number>
    offsetRef: React.MutableRefObject<{ x: number; y: number }>
    setZoom: React.Dispatch<React.SetStateAction<number>>
    setOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>
    dpr: number
}

export function useZoomPan({
    canvasRef,
    selectionRectRef,
    zoomRef,
    offsetRef,
    setZoom,
    setOffset,
    dpr
}: UseZoomPanProps) {
    // scroll zoom
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        function onWheel(e: WheelEvent) {
            e.preventDefault()
            if (!canvas) return
            const rect = selectionRectRef.current
            if (!rect) return
            const mouseX = e.clientX - rect.left
            const mouseY = e.clientY - rect.top

            const oldZoom = zoomRef.current
            // adjust zoom by one STEP
            const newZoom =
                e.deltaY < 0
                    ? Math.min(MAX_ZOOM, +(oldZoom + STEP).toFixed(2))
                    : Math.max(MIN_ZOOM, +(oldZoom - STEP).toFixed(2))

            // compute new pan so the point under cursor stays fixed
            const { x: ox, y: oy } = offsetRef.current
            const dx = mouseX * (1 / newZoom - 1 / oldZoom)
            const dy = mouseY * (1 / newZoom - 1 / oldZoom)

            setZoom(newZoom)
            setOffset({ x: ox + dx, y: oy + dy })
        }

        canvas.addEventListener('wheel', onWheel, { passive: false })
        return () => {
            canvas.removeEventListener('wheel', onWheel)
        }
    }, [canvasRef, selectionRectRef, zoomRef, offsetRef, setZoom, setOffset])

    // right mouse button pan
    useEffect(() => {
        const canvas = canvasRef.current!
        let isPanning = false
        let startX = 0, startY = 0
        let startOffset = { x: 0, y: 0 }

        // prevent the OS menu
        const onContextMenu = (e: MouseEvent) => e.preventDefault()
        canvas.addEventListener('contextmenu', onContextMenu)

        const onPointerDown = (e: PointerEvent) => {
            if (e.button !== 2) return // only right-button
            e.preventDefault()
            canvas.setPointerCapture(e.pointerId)
            isPanning = true
            startX = e.clientX
            startY = e.clientY
            startOffset = { ...offsetRef.current }
        }

        const onPointerMove = (e: PointerEvent) => {
            if (!isPanning) return
            e.preventDefault()
            // how far we've moved in physical pixels
            const dxPx = e.clientX - startX
            const dyPx = e.clientY - startY
            // convert back into logical units
            const z = zoomRef.current
            const dx = dxPx / (z * dpr)
            const dy = dyPx / (z * dpr)
            setOffset({ x: startOffset.x + dx, y: startOffset.y + dy })
        }

        const onPointerUp = (e: PointerEvent) => {
            if (e.button !== 2) return
            isPanning = false
            canvas.releasePointerCapture(e.pointerId)
        }

        canvas.addEventListener('pointerdown', onPointerDown)
        canvas.addEventListener('pointermove', onPointerMove)
        canvas.addEventListener('pointerup', onPointerUp)
        canvas.addEventListener('pointercancel', onPointerUp)

        return () => {
            canvas.removeEventListener('contextmenu', onContextMenu)
            canvas.removeEventListener('pointerdown', onPointerDown)
            canvas.removeEventListener('pointermove', onPointerMove)
            canvas.removeEventListener('pointerup', onPointerUp)
            canvas.removeEventListener('pointercancel', onPointerUp)
        }
    }, [canvasRef, offsetRef, zoomRef, setOffset, dpr])

    // functions for zoom buttons
    const zoomIn = () => {
        const canvas = canvasRef.current
        // fallback to plain zoom if canvas isn't mounted yet
        if (!canvas) {
            setZoom(z => Math.min(MAX_ZOOM, +(z + STEP).toFixed(2)))
            return
        }

        const rect = selectionRectRef.current
        if (!rect) return
        // center of the canvas in CSS pixels:
        const centerX = rect.width / 2
        const centerY = rect.height / 2

        const oldZoom = zoomRef.current
        const newZoom =
            Math.min(MAX_ZOOM, +(oldZoom + STEP).toFixed(2))

        // compute how much to shift the logical offset so that
        // (centerX, centerY) stays fixed on screen
        const dx = centerX * (1 / newZoom - 1 / oldZoom)
        const dy = centerY * (1 / newZoom - 1 / oldZoom)

        setOffset(({ x: ox, y: oy }) => ({
            x: ox + dx,
            y: oy + dy,
        }))
        setZoom(newZoom)
    }

    const zoomOut = () => {
        const canvas = canvasRef.current
        if (!canvas) {
            setZoom(z => Math.max(MIN_ZOOM, +(z - STEP).toFixed(2)))
            return
        }

        const rect = selectionRectRef.current
        if (!rect) return
        const centerX = rect.width / 2
        const centerY = rect.height / 2

        const oldZoom = zoomRef.current
        const newZoom =
            Math.max(MIN_ZOOM, +(oldZoom - STEP).toFixed(2))

        const dx = centerX * (1 / newZoom - 1 / oldZoom)
        const dy = centerY * (1 / newZoom - 1 / oldZoom)

        setOffset(({ x: ox, y: oy }) => ({
            x: ox + dx,
            y: oy + dy,
        }))
        setZoom(newZoom)
    }

    return {
        zoomIn,
        zoomOut,
    }
}
