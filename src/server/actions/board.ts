'use server'

import { ActionResponse } from "@/types/global";
import { getSession } from "../auth";
import prisma from "../db";


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