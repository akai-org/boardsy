import { useRef, useState, useEffect, useCallback } from 'react'
import { BoardItem } from '@/types/board'
import { Tools } from '../_components/ToolBar'
import { findHitItem, findItemsInSelectionRect, translateSelectedItems } from '../_ustils/selectionUtils'

interface SelectionRect {
    x: number
    y: number
    width: number
    height: number
}

interface UseSelectionProps {
    items: BoardItem[]
    activeTool: Tools
    canvasRef: React.RefObject<HTMLCanvasElement | null>
    toLogicalCoords: (e: PointerEvent) => { x: number; y: number }
    setItems: React.Dispatch<React.SetStateAction<BoardItem[]>>
}

export function useSelection({ items, activeTool, canvasRef, toLogicalCoords, setItems }: UseSelectionProps) {
    // selected rectangle
    const [dragSelectionRect, setDragSelectionRect] = useState<SelectionRect | null>(null)
    const dragRectRef = useRef<SelectionRect | null>(null)
    const updateDragSelectionRect = useCallback((r: SelectionRect | null) => {
        dragRectRef.current = r
        setDragSelectionRect(r)
    }, [])

    // selected items
    const [selectedIds, setSelectedIds] = useState<number[]>([])

    // moving selected items around
    const actionRef = useRef<'move' | 'select' | null>(null)
    const dragStartRef = useRef<{ x: number, y: number } | null>(null)
    const originalRef = useRef<Map<number, { x: number, y: number }[]>>(new Map())

    // selection functionality with select items and move selected items mode
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        
        function onPointerDown(e: PointerEvent) {
            if (activeTool !== Tools.SELECTOR || e.button !== 0) return
            const p = toLogicalCoords(e)

            // do we hit any selected item?
            const hitId = findHitItem(p, items, selectedIds)

            if (hitId != null) {
                // If we hit a selected item, enter MOVE MODE
                if (selectedIds.includes(hitId)) {
                    actionRef.current = 'move'
                    dragStartRef.current = p
                    // snapshot all selected items
                    const snapshot = new Map<number, { x: number, y: number }[]>()
                    for (const id of selectedIds) {
                        const s = items.filter(item => item.type === 'stroke').find(s => s.id === id)!
                        snapshot.set(id, s.points.map(pt => ({ ...pt })))
                    }
                    originalRef.current = snapshot
                } else {
                    // If we hit an unselected item, select it and enter MOVE MODE
                    setSelectedIds([hitId])
                    actionRef.current = 'move'
                    dragStartRef.current = p
                    const item = items.filter(item => item.type === 'stroke').find(s => s.id === hitId)!
                    const snapshot = new Map<number, { x: number, y: number }[]>()
                    snapshot.set(hitId, item.points.map(pt => ({ ...pt })))
                    originalRef.current = snapshot
                }
            } else {
                // SELECT MODE
                actionRef.current = 'select'
                dragStartRef.current = p
                updateDragSelectionRect({ x: p.x, y: p.y, width: 0, height: 0 })
            }
            if (canvas) {
                canvas.setPointerCapture(e.pointerId)
            }
        }

        function onPointerMove(e: PointerEvent) {
            const mode = actionRef.current
            if (!mode) return
            const p = toLogicalCoords(e)
            const start = dragStartRef.current!
            if (mode === 'select') {
                updateDragSelectionRect({
                    x: Math.min(start.x, p.x),
                    y: Math.min(start.y, p.y),
                    width: Math.abs(p.x - start.x),
                    height: Math.abs(p.y - start.y),
                })
            } else {
                // MOVE MODE: translate selected items
                const dx = p.x - start.x
                const dy = p.y - start.y
                setItems(prev => translateSelectedItems(prev, selectedIds, originalRef.current, dx, dy))
            }
        }

        function onPointerUp(e: PointerEvent) {
            const mode = actionRef.current
            if (mode === 'select') {
                // finalize selection
                const r = dragRectRef.current
                if (r) {
                    const hits = findItemsInSelectionRect(r, items)
                    setSelectedIds(hits)
                }
                updateDragSelectionRect(null)
            }
            actionRef.current = null
            dragStartRef.current = null
            if (canvas) {
                canvas.releasePointerCapture(e.pointerId)
            }
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
    }, [activeTool, items, selectedIds, toLogicalCoords, updateDragSelectionRect, setItems, setSelectedIds, canvasRef])

    // if a tool other than selector is activated, clear the selection
    useEffect(() => {
        if (activeTool !== Tools.SELECTOR) {
            // clear any live marquee
            updateDragSelectionRect(null)
            // clear selection
            setSelectedIds([])
        }
    }, [activeTool, updateDragSelectionRect])

    return {
        dragSelectionRect,
        selectedIds,
        setSelectedIds,
        updateDragSelectionRect,
    }
}
