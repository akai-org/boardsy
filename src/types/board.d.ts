// types for items on the board

export type Stroke = {
    id: number
    type: 'stroke',
    points: { x: number; y: number }[]
    color: string
    width: number
}
export type ImageObject = {
    id: number,
    type: 'image',
    url: string
    coords: { x: number; y: number }
}

type BoardItem = Stroke | ImageObject