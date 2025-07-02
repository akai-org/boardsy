import React from 'react'
import Image from 'next/image'
import styles from '../board.module.sass'

const MIN_ZOOM = 0.01
const MAX_ZOOM = 4
const STEP = 0.1

interface ZoomControlsProps {
    zoom: number
    zoomIn: () => void
    zoomOut: () => void
}

export function ZoomControls({ zoom, zoomIn, zoomOut }: ZoomControlsProps) {
    return (
        <div className={styles.zoom}>
            <button onClick={zoomOut}>
                <Image src="/tools/minus.svg" alt="zoom out" width={50} height={50} />
            </button>
            <div>{(zoom * 100).toFixed(0)} %</div>
            <button onClick={zoomIn}>
                <Image src="/tools/plus.svg" alt="zoom in" width={50} height={50} />
            </button>
        </div>
    )
}

export { MIN_ZOOM, MAX_ZOOM, STEP }
