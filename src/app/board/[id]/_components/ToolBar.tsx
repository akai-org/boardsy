import React from 'react'
import Image from 'next/image'
import styles from '../board.module.sass'

export enum Tools {
    SELECTOR = "selector",
    PENCIL = "pencil",
    TEXT = "text",
    SHAPES = "shapes"
}

interface ToolBarProps {
    activeTool: Tools
    setActiveTool: React.Dispatch<React.SetStateAction<Tools>>
}

export function ToolBar({ activeTool, setActiveTool }: ToolBarProps) {
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
