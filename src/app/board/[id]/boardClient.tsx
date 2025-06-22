'use client'

import React, { useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

import type { Board } from '@prisma/client'
import styles from './board.module.sass'

interface Stroke {
    id: number
    points: { x: number; y: number }[]
    color: string
    width: number
}

const MIN_ZOOM = 0.01
const MAX_ZOOM = 4
const STEP = 0.1

export default function BoardClient({ data }: { data: Board }) {

    const canvasRef = useRef<HTMLCanvasElement | null>(null)

    const [activeTool, setActiveTool] = useState<'selector' | 'pencil' | 'text' | 'shapes'>('selector')


    // pencil strokes
    const [strokes, setStrokes] = useState<Stroke[]>([])
    const currentStroke = useRef<Stroke | null>(null)
    const nextId = useRef(1)


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
    const [dpr, setDpr] = useState(1);
    useEffect(() => {

        const updateDpr = () => { setDpr(window.devicePixelRatio || 1) };

        // run once on mount to pick up the real DPR
        updateDpr();

        // fallback on window resize
        window.addEventListener('resize', updateDpr);

        // matchMedia for DPR changes
        const mql = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
        mql.addEventListener('change', updateDpr);

        return () => {
            window.removeEventListener('resize', updateDpr);
            mql.removeEventListener('change', updateDpr);
        };
    }, []);


    // canvas.getBoundingClientRect() optimisation
    const rectRef = useRef<DOMRect | null>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // helper to update the ref
        function updateRect() {
            if (!canvas) return;
            rectRef.current = canvas.getBoundingClientRect();
        }

        updateRect();

        window.addEventListener('resize', updateRect);

        return () => {
            window.removeEventListener('scroll', updateRect, true);
            window.removeEventListener('resize', updateRect);
        };
    }, [size.width, size.height]);


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
        if (!canvas || activeTool !== 'pencil') return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const toCanvas = (e: PointerEvent) => {
            const rect = rectRef.current!
            const z = zoomRef.current
            const { x: ox, y: oy } = offsetRef.current
            // convert to logical coords
            return {
                x: (e.clientX - rect.left) / z - ox,
                y: (e.clientY - rect.top) / z - oy,
            }
        }

        function onPointerDown(e: PointerEvent) {
            if (e.button !== 0 || !canvas) return
            const { x, y } = toCanvas(e)
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
            const { x: lx, y: ly } = toCanvas(e)
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
                setStrokes((s) => [...s, stroke])
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
    }, [activeTool, size.width, size.height, dpr])


    // redrawing strokes (on zoom or size change)
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // resize buffer
        canvas.width = size.width * dpr
        canvas.height = size.height * dpr

        // clear
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // set zoom & pan transform
        const a = zoom * dpr
        const e = offset.x * a
        const f = offset.y * a
        ctx.setTransform(a, 0, 0, a, e, f)

        // replay all strokes
        for (const stroke of strokes) {
            ctx.strokeStyle = stroke.color
            ctx.lineWidth = stroke.width
            ctx.beginPath()
            stroke.points.forEach((p, i) => {
                if (i === 0) ctx.moveTo(p.x, p.y)
                else ctx.lineTo(p.x, p.y)
            })
            ctx.stroke()
        }

        if (currentStroke.current) {
            const s = currentStroke.current
            ctx.beginPath()
            s.points.forEach((p, i) => {
                if (i === 0) {
                    ctx.moveTo(p.x, p.y)
                } else {
                    ctx.lineTo(p.x, p.y)
                }
            })
            ctx.strokeStyle = s.color
            ctx.lineWidth = s.width
            ctx.stroke()
        }

    }, [size.width, size.height, zoom, offset, strokes, dpr])


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
            if (e.button !== 2) return        // only right-button
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
        // no need for window listener – capture on canvas is enough

        return () => {
            canvas.removeEventListener('contextmenu', onContextMenu)
            canvas.removeEventListener('pointerdown', onPointerDown)
            canvas.removeEventListener('pointermove', onPointerMove)
            canvas.removeEventListener('pointerup', onPointerUp)
            canvas.removeEventListener('pointercancel', onPointerUp)
        }
    }, [dpr])


    // ctrl + z functionality
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault()
                setStrokes(prev => {
                    if (prev.length === 0) return prev
                    return prev.slice(0, -1)
                })
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [])


    return (
        <>
            <div className={styles.title}>
                <Link href="/dashboard">
                    <h1>Boardsy</h1>
                </Link>
                <h2>{data.name}</h2>
            </div>

            <div className={styles.tools}>
                <button onClick={() => setActiveTool('selector')}>
                    <Image src="/tools/selector.svg" alt="selector" width={50} height={50} />
                </button>
                <button onClick={() => setActiveTool('pencil')}>
                    <Image src="/tools/pencil.svg" alt="pencil" width={50} height={50} />
                </button>
                <button onClick={() => setActiveTool('text')}>
                    <Image src="/tools/text.svg" alt="text" width={50} height={50} />
                </button>
                <button onClick={() => setActiveTool('shapes')}>
                    <Image src="/tools/shapes.svg" alt="shapes" width={50} height={50} />
                </button>
            </div>

            <div className={styles.zoom}>
                <button onClick={zoomOut}>
                    <Image src="/tools/minus.svg" alt="zoom out" width={50} height={50} />
                </button>
                <div>{(zoom * 100).toFixed(0)} %</div>
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
