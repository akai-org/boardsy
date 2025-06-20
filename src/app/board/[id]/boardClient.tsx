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
    const currentStroke = useRef<Stroke | null>(null)
    const nextId = useRef(1)

    const [zoom, setZoom] = useState(1)
    const zoomRef = useRef(zoom)
    useEffect(() => {
        zoomRef.current = zoom
    }, [zoom])

    // grow to fill viewport
    const [size, setSize] = useState({ width: 0, height: 0 })
    useEffect(() => {
        function updateSize() {
            setSize({ width: window.innerWidth, height: window.innerHeight })
        }
        updateSize()
        window.addEventListener('resize', updateSize)
        return () => window.removeEventListener('resize', updateSize)
    }, [])

    const [strokes, setStrokes] = useState<Stroke[]>([])

    function zoomIn() {
        setZoom((z) => Math.min(MAX_ZOOM, +(z + STEP).toFixed(2)))
    }
    function zoomOut() {
        setZoom((z) => Math.max(MIN_ZOOM, +(z - STEP).toFixed(2)))
    }

    // pencil handlers
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas || activeTool !== 'pencil') return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // a helper that always re-reads the bounding rect & current zoom
        const toCanvas = (e: PointerEvent) => {
            const rect = canvas.getBoundingClientRect()
            const z = zoomRef.current
            return {
                x: (e.clientX - rect.left) / z,
                y: (e.clientY - rect.top) / z,
            }
        }

        function onPointerDown(e: PointerEvent) {
            if (!canvas) return
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
            const stroke = currentStroke.current
            if (!ctx || !stroke) return

            // logical coords
            const { x: lx, y: ly } = toCanvas(e)
            stroke.points.push({ x: lx, y: ly })

            // immediate draw in physical pixels
            const prev = stroke.points[stroke.points.length - 2]!
            const z = zoomRef.current
            const dpr = window.devicePixelRatio || 1

            ctx.strokeStyle = stroke.color
            ctx.lineWidth = stroke.width

            ctx.beginPath()
            ctx.moveTo(prev.x * z * dpr, prev.y * z * dpr)
            ctx.lineTo(lx * z * dpr, ly * z * dpr)
            ctx.stroke()
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

        // attach both canvas‐ and window‐based up/cancel listeners
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
    }, [activeTool, size.width, size.height])

    // redrawing strokes (on zoom or size change)
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const dpr = window.devicePixelRatio || 1

        // resize the drawing buffer to match CSS size × DPR
        canvas.width = size.width * dpr
        canvas.height = size.height * dpr

        // clear everything in raw pixels
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // apply DPR and zoom in one go
        ctx.save()
        ctx.scale(dpr, dpr)
        ctx.scale(zoom, zoom)

        // replay all strokes in logical coords
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
        ctx.restore()
    }, [size.width, size.height, zoom, strokes])

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
