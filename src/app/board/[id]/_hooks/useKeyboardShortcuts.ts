import { useEffect } from 'react'
import { BoardItem } from '@/types/board'
import { undoLastItem, removeSelectedItems } from '../_ustils/selectionUtils'

interface UseKeyboardShortcutsProps {
    items: BoardItem[]
    selectedIds: number[]
    setItems: React.Dispatch<React.SetStateAction<BoardItem[]>>
    setSelectedIds: React.Dispatch<React.SetStateAction<number[]>>
}

export function useKeyboardShortcuts({
    items,
    selectedIds,
    setItems,
    setSelectedIds
}: UseKeyboardShortcutsProps) {
    // keyboard shortcuts functionality
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            // Ctrl+Z: Undo last stroke
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault()
                setItems(prev => undoLastItem(prev))
            }

            // Delete: Remove selected strokes
            if (e.key === 'Delete' && selectedIds.length > 0) {
                e.preventDefault()
                setItems(prev => removeSelectedItems(prev, selectedIds))
                setSelectedIds([])
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [selectedIds, setItems, setSelectedIds])
}
