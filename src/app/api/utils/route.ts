'use server'

import type { Prisma } from '@prisma/client'
import prisma from '@/server/db';
import { NextRequest, NextResponse } from "next/server";
import { getBoard, getBoardState } from '@/server/actions/board';

interface Stroke {
    id: number
    type: 'stroke',
    points: { x: number; y: number }[]
    color: string
    width: number
}

async function appendStroke(boardId: string, stroke: Stroke): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
        const boardidcheck = await getBoard(boardId)

        if (!boardidcheck.success) {
            console.error('Board does not exist', boardidcheck.message);
            return { 
                success: false, 
                message: boardidcheck.message, 
                error: boardidcheck.error 
            };
        }
        else {
            const board = await getBoardState(boardId)

            const prevState = (board.state as Record<string, any>) || {};
            const prevStrokes: Stroke[] = Array.isArray(prevState.strokes)
                ? prevState.strokes
                : [];
            const newState = {
                ...prevState,
                strokes: [...prevStrokes, stroke],
            };

            const safeState = JSON.parse(JSON.stringify(newState)) as Prisma.InputJsonObject;
            console.log(safeState)

            await prisma.board.update({
                where: { id: boardId },
                data: {
                    state: safeState,
                },
            })
            return { 
                success: true 
            };
        }


    }
    catch (e) {
        console.log(e)
        return {
            success: false,
            message: 'Internal server error',
            error: 'Internal server error',
        }
    }
}

export async function POST(req: NextRequest) {

    try {
        const form = await req.formData()
        const strokeObject = form.get("stroke")
        const rawBoardId = form.get("boardid")

        if (!strokeObject || typeof strokeObject !== 'string')

            return NextResponse.json(
                { error: " Nie ma stroku " },
                { status: 400 }
            )

        if (!rawBoardId || typeof rawBoardId !== 'string')

            return NextResponse.json(
                { error: " Nie ma id tablicy " },
                { status: 400 }
            )
        const boardId = rawBoardId;
        const stroke: Stroke = JSON.parse(strokeObject)

        appendStroke(boardId, stroke)

        return NextResponse.json(
            {
                success: true
            }
        )
    }
    catch (e) {
        console.log(e)
        return {
            success: false,
            message: 'Internal server error',
            error: 'Internal server error',
        }

    }





}