'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'

import type { Board } from '@prisma/client'
import styles from './board.module.sass'

interface Stroke {
    id: number
    type: 'stroke',
    points: { x: number; y: number }[]
    color: string
    width: number
}
interface ImageObject {
    id: number,
    type: 'image',
    url: string
}


type BoardItem = Stroke | ImageObject

interface ImagePasteResponse {
    success: boolean,
    imageObject?: ImageObject,
    error?: string
}

interface Rect {
    x: number
    y: number
    width: number
    height: number
}

const MIN_ZOOM = 0.01
const MAX_ZOOM = 4
const STEP = 0.1

enum Tools {
    SELECTOR = "selector",
    PENCIL = "pencil",
    TEXT = "text",
    SHAPES = "shapes"
}

function ToolBar({ activeTool, setActiveTool }: {
    activeTool: Tools,
    setActiveTool: React.Dispatch<React.SetStateAction<Tools>>
}) {

    return (
        <div className={styles.tools}>
            {Object.values(Tools).map((tool) => {
                return (
                    <button key={tool} className={tool === activeTool ? styles.selectedTool : ''} onClick={() => setActiveTool(tool)}>
                        <Image src={`/tools/${tool}.svg`} alt={`${tool}`} width={50} height={50} />
                    </button>
                )
            })}
        </div>
    )
}

export default function BoardClient({ data }: { data: Board }) {

   const canvasRef = useRef<HTMLCanvasElement | null>(null)

    const [activeTool, setActiveTool] = useState<Tools>(Tools.SELECTOR)

    // selected rectangle
    const [dragRect, setDragRect] = useState<Rect | null>(null)
    const dragRectRef = useRef<Rect | null>(null)
    const updateDragRect = useCallback((r: Rect | null) => {
        dragRectRef.current = r
        setDragRect(r)
    }, [])

    // selected items
    const [selectedIds, setSelectedIds] = useState<number[]>([])

    // items on board
    const [items, setItems] = useState<Stroke[]>([])
    const currentStroke = useRef<Stroke | null>(null)
    const nextId = useRef(1)

    // moving selected items around
    const actionRef = useRef<'move' | 'select' | null>(null)
    const dragStartRef = useRef<{ x: number, y: number } | null>(null)
    const originalRef = useRef<Map<number, { x: number, y: number }[]>>(new Map())

    // zoom + pan
    const [zoom, setZoom] = useState(1)
    const zoomRef = useRef(zoom)
    useEffect(() => {
        zoomRef.current = zoom
    }, [zoom])

    const [offset, setOffset] = useState({ x: 0, y: 0 })
    const offsetRef = useRef(offset)
    useEffect(() => {
        offsetRef.current = offset
    }, [offset])


    // fill viewport
    const [size, setSize] = useState({ width: 0, height: 0 })
    useEffect(() => {
        function updateSize() {
            setSize({ width: window.innerWidth, height: window.innerHeight })
        }
        updateSize()
        window.addEventListener('resize', updateSize)
        return () => window.removeEventListener('resize', updateSize)
    }, [])


    // dpr optimisation
    const [dpr, setDpr] = useState(1)
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
    const rectRef = useRef<DOMRect | null>(null)
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        function updateRect() {
            if (!canvas) return
            rectRef.current = canvas.getBoundingClientRect()
        }

        updateRect()

        window.addEventListener('resize', updateRect)
        window.addEventListener('scroll', updateRect, true)

        return () => {
            window.removeEventListener('resize', updateRect)
            window.removeEventListener('scroll', updateRect, true)
        }
    }, [size.width, size.height])


    // custom hook for coordinate transformation
    const toLogicalCoords = useCallback((e: PointerEvent) => {
        const rect = rectRef.current!
        const z = zoomRef.current
        const { x: ox, y: oy } = offsetRef.current
        return {
            x: (e.clientX - rect.left) / z - ox,
            y: (e.clientY - rect.top) / z - oy,
        }
    }, [])





    // selection functionality with select items and move selected items mode
    useEffect(() => {
        const canvas = canvasRef.current!
        function onPointerDown(e: PointerEvent) {
            if (activeTool !== Tools.SELECTOR || e.button !== 0) return
            const p = toLogicalCoords(e)

            // do we hit any selected item?
            const hitId = selectedIds.find(id => {
                const s = items.find(s => s.id === id)!
                const xs = s.points.map(pt => pt.x), ys = s.points.map(pt => pt.y)
                const bx = Math.min(...xs), by = Math.min(...ys)
                const bw = Math.max(...xs) - bx, bh = Math.max(...ys) - by
                return p.x >= bx && p.x <= bx + bw && p.y >= by && p.y <= by + bh
            })

            if (hitId != null) {
                // MOVE MODE
                actionRef.current = 'move'
                dragStartRef.current = p
                // snapshot all selected items
                const snapshot = new Map<number, { x: number, y: number }[]>()
                for (const id of selectedIds) {
                    const s = items.find(s => s.id === id)!
                    snapshot.set(id, s.points.map(pt => ({ ...pt })))
                }
                originalRef.current = snapshot
            } else {
                // SELECT MODE
                actionRef.current = 'select'
                dragStartRef.current = p
                updateDragRect({ x: p.x, y: p.y, width: 0, height: 0 })
            }
            canvas.setPointerCapture(e.pointerId)
        }

        function onPointerMove(e: PointerEvent) {
            const mode = actionRef.current
            if (!mode) return
            const p = toLogicalCoords(e)
            const start = dragStartRef.current!
            if (mode === 'select') {
                updateDragRect({
                    x: Math.min(start.x, p.x),
                    y: Math.min(start.y, p.y),
                    width: Math.abs(p.x - start.x),
                    height: Math.abs(p.y - start.y),
                })
            } else {
                // MOVE MODE: translate selected items
                const dx = p.x - start.x
                const dy = p.y - start.y
                setItems(prev =>
                    prev.map(s => {
                        if (!selectedIds.includes(s.id)) return s
                        const orig = originalRef.current.get(s.id)!
                        return {
                            ...s,
                            points: orig.map(pt => ({ x: pt.x + dx, y: pt.y + dy }))
                        }
                    })
                )
            }
        }

        function onPointerUp(e: PointerEvent) {
            const mode = actionRef.current
            if (mode === 'select') {
                // finalize selection
                const r = dragRectRef.current
                if (r) {
                    const hits = items
                        .filter(s => {
                            const xs = s.points.map(pt => pt.x), ys = s.points.map(pt => pt.y)
                            const bx = Math.min(...xs), by = Math.min(...ys)
                            const bw = Math.max(...xs) - bx, bh = Math.max(...ys) - by
                            return !(
                                bx + bw < r.x || bx > r.x + r.width ||
                                by + bh < r.y || by > r.y + r.height
                            )
                        })
                        .map(s => s.id)
                    setSelectedIds(hits)
                }
                updateDragRect(null)
            }
            actionRef.current = null
            dragStartRef.current = null
            canvas.releasePointerCapture(e.pointerId)
        }

        canvas.addEventListener('pointerdown', onPointerDown)
        canvas.addEventListener('pointermove', onPointerMove)
        canvas.addEventListener('pointerup', onPointerUp)
        canvas.addEventListener('pointercancel', onPointerUp)
        return () => {
            canvas.removeEventListener('pointerdown', onPointerDown)
            canvas.removeEventListener('pointermove', onPointerMove)
            canvas.removeEventListener('pointerup', onPointerUp)
            canvas.removeEventListener('pointercancel', onPointerUp)
        }
    }, [activeTool, items, selectedIds, toLogicalCoords, updateDragRect])

    useEffect(() => {
        updateDragRect(null)
        currentStroke.current = null
    }, [activeTool, updateDragRect])

    // if a tool other than selector is activated, clear the selection
    useEffect(() => {
        if (activeTool !== Tools.SELECTOR) {
            // clear any live marquee
            updateDragRect(null)
            // clear selection
            setSelectedIds([])
        }
    }, [activeTool, updateDragRect])


    // scroll zoom
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        function onWheel(e: WheelEvent) {
            e.preventDefault()
            if (!canvas) return
            const rect = rectRef.current
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
    }, [])


    // pencil handlers
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas || activeTool !== Tools.PENCIL) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        function onPointerDown(e: PointerEvent) {
            if (e.button !== 0 || !canvas) return
            const { x, y } = toLogicalCoords(e)
            currentStroke.current = {
                id: nextId.current++,
                points: [{ x, y }],
                color: 'black',
                width: 2,
            }
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
            ctx.save()
            ctx.setTransform(1, 0, 0, 1, 0, 0)    // reset to identity
            ctx.strokeStyle = stroke.color
            ctx.lineWidth = stroke.width
            ctx.beginPath()
            ctx.moveTo((prev.x + ox) * z * dpr, (prev.y + oy) * z * dpr)
            ctx.lineTo((lx + ox) * z * dpr, (ly + oy) * z * dpr)
            ctx.stroke()
            ctx.restore()
        }

        function onPointerUp(e: PointerEvent) {
            if (!canvas) return
            const stroke = currentStroke.current
            if (stroke) {
                setItems((s) => [...s, stroke])
                currentStroke.current = null
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
    }, [activeTool, size.width, size.height, dpr, toLogicalCoords])


    // redrawing items (on zoom or size change)
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

        // draw saved strokes wroc
        for (const stroke of items.filter(item => item.type === 'stroke')) {
            ctx.strokeStyle = stroke.color
            ctx.lineWidth = stroke.width
            ctx.beginPath()
            stroke.points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y))
            ctx.stroke()
        }

        // draw in-flight stroke
        if (currentStroke.current) {
            const s = currentStroke.current
            ctx.strokeStyle = s.color
            ctx.lineWidth = s.width
            ctx.beginPath()
            s.points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y))
            ctx.stroke()
        }

        // draw marquee or selection boxes
        ctx.save()
        ctx.strokeStyle = 'rgba(0,120,255,0.8)'
        ctx.lineWidth = 1 / zoom
        ctx.setLineDash([4 / zoom, 2 / zoom])

        if (dragRect) {
            ctx.strokeRect(
                dragRect.x,
                dragRect.y,
                dragRect.width,
                dragRect.height
            )
        } else {
            for (const id of selectedIds) {
                const s = items.find(s => s.id === id)!
                const xs = s.points.map(p => p.x), ys = s.points.map(p => p.y)
                const bx = Math.min(...xs), by = Math.min(...ys)
                const bw = Math.max(...xs) - bx, bh = Math.max(...ys) - by

                ctx.setLineDash([])
                ctx.lineWidth = 2 / zoom
                ctx.strokeRect(bx, by, bw, bh)
            }
        }
        ctx.restore()
    }, [size.width, size.height, zoom, offset, items, dragRect, selectedIds, dpr])


    // functions for zoom buttons
    function zoomIn() {
        const canvas = canvasRef.current
        // fallback to plain zoom if canvas isn’t mounted yet
        if (!canvas) {
            setZoom(z => Math.min(MAX_ZOOM, +(z + STEP).toFixed(2)))
            return
        }

        const rect = rectRef.current
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

    function zoomOut() {
        const canvas = canvasRef.current
        if (!canvas) {
            setZoom(z => Math.max(MIN_ZOOM, +(z - STEP).toFixed(2)))
            return
        }

        const rect = rectRef.current
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

    //right mouse button pan
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
            // how far we’ve moved in physical pixels
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
    }, [dpr])


    // keyboard shortcuts functionality
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {

            // Ctrl+Z: Undo last stroke
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault()
                setItems(prev => {
                    if (prev.length === 0) return prev
                    return prev.slice(0, -1)
                })
            }

            // Delete: Remove selected strokes
            if (e.key === 'Delete' && selectedIds.length > 0) {
                e.preventDefault()
                setItems(prev => prev.filter(stroke => !selectedIds.includes(stroke.id)))
                setSelectedIds([])
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [selectedIds])
    const handlePaste = useCallback(
        async (e: React.ClipboardEvent<HTMLDivElement>) => {
            const item = Array.from(e.clipboardData.items).find(i =>
                i.type.startsWith('image/')
            );
            if (!item) return;

            const file = item.getAsFile();               // Blob from clipboard
            if (!file) return;

            const body = new FormData();
            body.append('file', file, 'pasted-image');

            const res = await fetch('/api/upload', {     //  <-- see next section
                method: 'POST',
                body,
            });

            const response = await res.json() as ImagePasteResponse

            if (!response.success)
                alert(response.error)
            else {
                setItems((s) => [...s, response.imageObject!])

            }

        },
        []
    );


    return (
        <>
            <div className={styles.title}>
                <Link href="/dashboard">
                    <h1>Boardsy</h1>
                </Link>
                <h2>{data.name}</h2>
            </div>

            <ToolBar
                activeTool={activeTool}
                setActiveTool={setActiveTool}
            />

            <div className={styles.zoom}>
                <button onClick={zoomOut}>
                    <Image src="/tools/minus.svg" alt="zoom out" width={50} height={50} />
                </button>
                <div>{(zoom * 100).toFixed(0)} %</div>
                <button onClick={zoomIn}>
                    <Image src="/tools/plus.svg" alt="zoom in" width={50} height={50} />
                </button>
            </div>

            <canvas
                ref={canvasRef}
                style={{ width: size.width, height: size.height }}
                className={
                    `${styles.canvas} ` +
                    (activeTool === 'pencil' ? styles.pencilCursor : styles.defaultCursor)
                }
            />
        </>
    )
}
