'use server'

import { getBoard } from "@/server/actions/board";
import BoardClient from "./boardClient";

interface PageProps {
    params: { 
        id: string 
    }
}

export default async function Board({ params }: PageProps) {

    const { id: boardid } = await params
    const data = await getBoard(boardid)

    if (data.success && data.board)
        return <BoardClient data={data.board}/>
    else
        return <h1>{data.error}</h1>

}