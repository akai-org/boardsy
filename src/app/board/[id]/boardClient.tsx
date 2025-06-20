'use client'

import React, { useRef, useState, useEffect, useReducer } from 'react'
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

export default function BoardClient({ data }: { data: Board }) {

    const canvasRef = useRef<HTMLCanvasElement | null>(null)

    const [activeTool, setActiveTool] = useState<'selector' | 'pencil' | 'text' | 'shapes'>('selector')
    const [zoom, setZoom] = useState<number>(1)

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



    //pencil drawing logic 
    const [strokes, setStrokes] = useState<Stroke[]>([])
    const currentStroke = useRef<Stroke | null>(null)
    const nextId = useRef(1)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas || activeTool !== 'pencil') return

        const rect = canvas.getBoundingClientRect()
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Helpers to convert window coords → canvas coords
        const toCanvas = (e: PointerEvent) => ({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        })

        function onPointerDown(e: PointerEvent) {
            if (!canvas) return
            // start a new stroke
            const { x, y } = toCanvas(e)
            currentStroke.current = {
                id: nextId.current++,
                points: [{ x, y }],
                color: 'black',   // pull from state when multiple line weights and colors will be available
                width: 2
            }
            canvas.setPointerCapture(e.pointerId)
        }

        function onPointerMove(e: PointerEvent) {
            if (!ctx || !currentStroke.current) return
            const { x, y } = toCanvas(e)
            // append the point
            currentStroke.current.points.push({ x, y })
            // draw the latest segment live
            const pts = currentStroke.current.points
            const prev = pts[pts.length - 2]
            ctx.strokeStyle = currentStroke.current.color
            ctx.lineWidth = currentStroke.current.width
            ctx.beginPath()
            ctx.moveTo(prev.x, prev.y)
            ctx.lineTo(x, y)
            ctx.stroke()
        }

        function onPointerUp(e: PointerEvent) {
            if (!canvas || !currentStroke.current) return
            // finalize: add to strokes array
            setStrokes(s => [...s, currentStroke.current!])
            currentStroke.current = null
            canvas.releasePointerCapture(e.pointerId)
        }

        // Attach listeners
        canvas.addEventListener('pointerdown', onPointerDown)
        canvas.addEventListener('pointermove', onPointerMove)
        canvas.addEventListener('pointerup', onPointerUp)

        // Cleanup
        return () => {
            canvas.removeEventListener('pointerdown', onPointerDown)
            canvas.removeEventListener('pointermove', onPointerMove)
            canvas.removeEventListener('pointerup', onPointerUp)
        }
    }, [activeTool, size.width, size.height])  // re-run if tool changes or canvas resizes



    

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
                <button>
                    <Image src="/tools/minus.svg" alt="zoom out" width={50} height={50} />
                </button>
                <div>{(zoom * 100).toFixed(0)} %</div>
                <button>
                    <Image src="/tools/plus.svg" alt="zoom in" width={50} height={50} />
                </button>
            </div>

            <canvas
                ref={canvasRef}
                width={size.width}
                height={size.height}
                className={
                    `${styles.canvas} ` +
                    (activeTool === 'pencil' ? styles.pencilCursor : styles.defaultCursor)
                }
            />
        </>
    )
}
