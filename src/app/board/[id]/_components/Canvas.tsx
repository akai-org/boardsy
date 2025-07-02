import React from 'react'
import { Tools } from './ToolBar'
import styles from '../board.module.sass'

interface CanvasProps {
    canvasRef: React.RefObject<HTMLCanvasElement | null>
    size: { width: number; height: number }
    activeTool: Tools
}

export function Canvas({ canvasRef, size, activeTool }: CanvasProps) {
    return (
        <canvas
            ref={canvasRef}
            style={{ width: size.width, height: size.height }}
            className={
                `${styles.canvas} ` +
                (activeTool === Tools.PENCIL ? styles.pencilCursor : styles.defaultCursor)
            }
        />
    )
}
