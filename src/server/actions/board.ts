'use server'

import type { Board } from '@prisma/client'
import { ActionResponse } from "@/types/global";
import { getSession } from "../auth";
import prisma from "../db";
import { JsonValue } from '@prisma/client/runtime/library';


export async function createBoard(formData: FormData): Promise<ActionResponse> {

    const session = await getSession()

    if (!session)
        return {
            success: false,
            message: 'Wrong data',
            error: 'Wrong data'
        }

    const name = formData.get("boardName") as string

    try {

        await prisma.board.create({
            data: {
                ownerId: session.userId,
                name: name
            }
        })

        return {
            success: true,
            message: 'Board created successfully'
        }

    } catch (e) {

        console.log(e)
        return {
            success: false,
            message: 'Wrong data',
            error: 'Wrong data'
        }
    }
}


interface BoardResponse extends ActionResponse {
    board?: Board
}

export async function getBoard(boardid: string): Promise<BoardResponse> {

    const session = await getSession()
    if (!session)
        return {
            success: false,
            message: 'Please log in',
            error: 'Please log in'
        }

    try {

        const board = await prisma.board.findUnique({
            where: {
                id: boardid
            }
        })
        // console.log(board?.state)
        if (!board)
            return {
                success: false,
                message: 'Board does not exist',
                error: 'Board does not exist'
            }

        return {
            success: true,
            message: 'Board fetched successfully',
            board: board
        }

    } catch (e) {

        console.log(e)
        return {
            success: false,
            message: 'Server error',
            error: 'Server error'
        }
    }
}

type SortOption = 'Last edited' | 'Created at' | 'Alphabetically'
export async function getBoards(displayOption: SortOption) {

    const session = await getSession()

    if (!session)
        return {
            success: false,
            message: 'Invalid session',
            error: 'Invalid session',
            boards: []
        }

    try {

        switch (displayOption) {

            case 'Last edited': {
                const boards = await prisma.board.findMany({
                    where: { ownerId: session.userId },
                    orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
                    take: 10,
                    select: {
                        id: true,
                        name: true,
                        ownerId: true,
                        createdAt: true,
                        updatedAt: true
                    }
                });
                return { success: true, message: '', boards }
            }


            case 'Created at': {
                const boards = await prisma.board.findMany({
                    where: { ownerId: session.userId },
                    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
                    take: 10,
                    select: {
                        id: true,
                        name: true,
                        ownerId: true,
                        createdAt: true,
                        updatedAt: true
                    }
                });
                return { success: true, message: '', boards }
            }


            case 'Alphabetically': {
                const boards = await prisma.board.findMany({
                    where: { ownerId: session.userId },
                    orderBy: [{ name: 'asc' }, { id: 'asc' }],
                    take: 10,
                    select: {
                        id: true,
                        name: true,
                        ownerId: true,
                        createdAt: true,
                        updatedAt: true
                    }
                });
                return { success: true, message: '', boards }
            }
        }

    } catch (e) {

        console.log(e)
        return {
            success: false,
            message: 'Internal server error',
            error: 'Internal server error',
            boards: []
        }
    }
}



export async function deleteBoard(board_id: string): Promise<ActionResponse> {

    const session = await getSession()

    if (!session)
        return {
            success: false,
            message: 'Invalid session',
            error: 'Invalid session',
        }

    try {
        const board = await prisma.board.findUnique({
            where: { id: board_id }
        })

        if (!board)
            return {
                success: false,
                message: 'Board does not exist',
                error: 'Board does not exist',
            }

        if (board.ownerId !== session.userId)
            return {
                success: false,
                message: 'You do not own this board',
                error: 'You do not own this board',
            }

        await prisma.board.delete({
            where: { id: board_id }
        })

        return { success: true, message: 'Board deleted successfuly' }

    } catch (e) {

        console.log(e)
        return {
            success: false,
            message: 'Internal server error',
            error: 'Internal server error',
        }
    }
}



export async function renameBoard(board_id: string, formData: FormData): Promise<ActionResponse> {

    const session = await getSession()

    if (!session)
        return {
            success: false,
            message: 'Invalid session',
            error: 'Invalid session',
        }

    const newname = formData.get("newname") as string

    if (!newname)
        return {
            success: false,
            message: 'No name provided',
            error: 'No name provided',
        }

    try {
        const board = await prisma.board.findUnique({
            where: { id: board_id }
        })

        if (!board)
            return {
                success: false,
                message: 'Board does not exist',
                error: 'Board does not exist',
            }

        if (board.ownerId !== session.userId)
            return {
                success: false,
                message: 'You do not own this board',
                error: 'You do not own this board',
            }

        if (newname !== board.name)
            await prisma.board.update({
                where: { id: board_id },
                data: { name: newname }
            })

        return { success: true, message: 'Board renamed successfuly' }

    } catch (e) {

        console.log(e)
        return {
            success: false,
            message: 'Internal server error',
            error: 'Internal server error',
        }
    }
}
interface BoardStateResponse extends ActionResponse {
    state: JsonValue
}

export async function getBoardState(boardId: string): Promise<BoardStateResponse> {
    const board = await prisma.board.findUnique({
        where: { id: boardId },
        select: { state: true },
    });

    if (!board){
            return{
                success: false,
                message: 'State doesnt exist',
                error: 'State doesnt exist',
                state: {}
            }
    }

    else {
        return {
            success: true,
            message: 'Board fetched successfully',
            state: board.state,
        }
    }
}