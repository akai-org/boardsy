import { getBoard } from "@/server/dal";
import { BoardItem, Stroke, ImageObject } from "@/types/board";
import { JsonValue } from "@prisma/client/runtime/library";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/server/db";


export async function POST(req: NextRequest) {
    const formData = await req.formData()

    if (!formData)
        return NextResponse.json(
            {
                success: false,
                error: " Nie ma pliku "
            },
            { status: 400 },
        )

    const boardId = formData.get("boardid") as string || null
    const newItem = JSON.parse(formData.get('boarditem') as string) as BoardItem || null

    if (!newItem || !boardId)
        return NextResponse.json(
            {
                success: false,
                error: " Nie ma pliku "
            },
            { status: 400 },
        )


    const board = await getBoard(boardId)

    if (!board)
        return NextResponse.json(
            {
                success: false,
                error: " Nie ma tablicy "
            },
            { status: 400 }
        )

    const oldState = board.state as BoardItem[]
    const newState = oldState.length > 0 ? [...oldState, newItem] : [newItem]
    console.log(newState)

    await prisma.board.update({
        where: { id: board.id },
        data: {
            state: newState
        }
    }
    )
    return NextResponse.json({
        success: true
    })

}