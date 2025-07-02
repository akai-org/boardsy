import prisma from "@/server/db";
import { User, Board } from "@prisma/client"; 
import { cache } from 'react'


export const getUser = cache( async (id:string): Promise<User | null> => {
    
    const user = await prisma.user.findUnique({
        where: { id : id}
    })
    
    return user
})


export const getBoard = cache( async (id: string): Promise<Board | null> => {

    const board = await prisma.board.findUnique({
        where: {
            id: id
        }
    })

    return board 
})
