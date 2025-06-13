'use client'

import React, { useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

import type { Board } from '@prisma/client'
import styles from './board.module.css'


export default function BoardClient({ data }: { data: Board }) {

    const canvasRef = useRef<HTMLCanvasElement>(null)

    // track which tool is active
    const [activeTool, setActiveTool] = useState<'selector' | 'pencil' | 'text' | 'shapes'>('selector')

    // refs to track drawing state & last coordinates
    const isDrawingRef = useRef(false)
    const lastPosRef = useRef({ x: 0, y: 0 })

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

    // get a 2d context once
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
    useEffect(() => {
        const canvas = canvasRef.current
        if (canvas) {
            const ctx = canvas.getContext('2d')
            if (ctx) {
                ctx.lineCap = 'round'
                ctx.lineWidth = 2
                ctxRef.current = ctx
            }
        }
    }, [])

    // handlers
    function handleDown(e: React.MouseEvent) {
        if (activeTool !== 'pencil') return
        const rect = canvasRef.current!.getBoundingClientRect()
        lastPosRef.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        }
        isDrawingRef.current = true
    }

    function handleMove(e: React.MouseEvent) {
        if (!isDrawingRef.current || activeTool !== 'pencil') return
        const rect = canvasRef.current!.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        const ctx = ctxRef.current!
        ctx.beginPath()
        ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y)
        ctx.lineTo(x, y)
        ctx.stroke()

        lastPosRef.current = { x, y }
    }

    function handleUp() {
        isDrawingRef.current = false
    }

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
                <div>x %</div>
                <button>
                    <Image src="/tools/plus.svg" alt="zoom in" width={50} height={50} />
                </button>
            </div>

            <canvas
                ref={canvasRef}
                width={size.width}
                height={size.height}
                onMouseDown={handleDown}
                onMouseMove={handleMove}
                onMouseUp={handleUp}
                onMouseLeave={handleUp}
                className={
                    `${styles.canvas} ` +
                    (activeTool === 'pencil' ? styles.pencilCursor : styles.defaultCursor)
                }
            />
        </>
    )
}
