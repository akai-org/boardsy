import prisma from "@/server/db";
import { User } from "@prisma/client"; 
import { cache } from 'react'


export const getUser = cache( async (id:string): Promise<User | null> => {
    
    const user = await prisma.user.findUnique({
        where: { id : id}
    })
    
    return user ? user : null
})