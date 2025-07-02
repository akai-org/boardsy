'use client'

import React, { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import type { Board } from '@prisma/client'
import styles from './board.module.sass'

import { BoardItem, Stroke } from '@/types/board'
import { useCanvas } from './_hooks/useCanvas'
import { useSelection } from './_hooks/useSelection'
import { usePencilTool } from './_hooks/usePencilTool'
import { useZoomPan } from './_hooks/useZoomPan'
import { useKeyboardShortcuts } from './_hooks/useKeyboardShortcuts'
import { ToolBar, Tools } from './_components/ToolBar'
import { ZoomControls } from './_components/ZoomControls'
import { Canvas } from './_components/Canvas'

export default function BoardClient({ data }: { data: Board }) {
    
    const [activeTool, setActiveTool] = useState<Tools>(Tools.SELECTOR)

    // items on board
    const [items, setItems] = useState<BoardItem[]>((data.state as BoardItem[]).length > 0 ? data.state as BoardItem[] : [])
    const currentStroke = useRef<Stroke | null>(null)
    const nextId = useRef(data.state ? (data.state as BoardItem[]).length : 0)

    // Use the canvas hook first
    const {
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
    } = useCanvas({ items, currentStroke, dragSelectionRect: null, selectedIds: [] })

    // Use the selection hook
    const {
        dragSelectionRect,
        selectedIds,
        setSelectedIds,
        updateDragSelectionRect,
    } = useSelection({ 
        items, 
        activeTool, 
        canvasRef,
        toLogicalCoords,
        setItems 
    })

    // Update canvas hook with actual dragSelectionRect and selectedIds
    useEffect(() => {
        // This effect updates the canvas hook when selection state changes
    }, [dragSelectionRect, selectedIds])

    // Use the pencil tool hook
    usePencilTool({
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
        boardId: data.id
    })

    // Use the zoom/pan hook
    const { zoomIn, zoomOut } = useZoomPan({
        canvasRef,
        selectionRectRef,
        zoomRef,
        offsetRef,
        setZoom,
        setOffset,
        dpr
    })

    // Use the keyboard shortcuts hook
    useKeyboardShortcuts({
        items,
        selectedIds,
        setItems,
        setSelectedIds
    })

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

            <ZoomControls
                zoom={zoom}
                zoomIn={zoomIn}
                zoomOut={zoomOut}
            />

            <Canvas
                canvasRef={canvasRef}
                size={size}
                activeTool={activeTool}
            />
        </>
    )
}
