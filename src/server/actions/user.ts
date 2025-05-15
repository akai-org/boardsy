'use server'

import { cache } from "react";
import { getSession, hashPassword } from "../auth"
import prisma from "../db";
import { ActionResponse } from "@/types/global";
import { getUser } from "../dal";


export const getUserData = cache(async (): Promise<{
    name: string,
    surname: string,
    profilePictureUrl: string | null,
    email: string
} | null> => {

    const session = await getSession();
    if (!session) //add sth here to go back to login if there is no session
        return null

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: {
            name: true,
            surname: true,
            profilePictureUrl: true,
            email: true
        }
    })

    return user
})


export async function changeName(formData: FormData): Promise<ActionResponse> {

    const session = await getSession();
    if (!session)
        return {
            success: false,
            message: 'Wrong data',
            error: 'Wrong data'
        }

    const data = {
        name: formData.get("name") as string,
        surname: formData.get("surname") as string,
    }

    try {

        await prisma.user.update({
            where: { id: session.userId },
            data: data
        })

        return {
            success: true,
            message: 'Name changed successfuly',
        }

    } catch (e) {
        console.log(e)
        return {
            success: false,
            message: 'Internal server error',
            error: 'Internal server error'
        }
    }
}


export async function changePassword(formData: FormData): Promise<ActionResponse> {

    const session = await getSession();
    if (!session)
        return {
            success: false,
            message: 'Wrong data',
            error: 'Wrong data'
        }

    const current_password = formData.get("current_password") as string;
    const new_password = formData.get("new_password") as string;

    try {

        const user = await getUser(session.userId)

        if (user!.password === await hashPassword(current_password)) {

            await prisma.user.update({
                where: { id: session.userId },
                data: { password: await hashPassword(new_password) }
            })

            return {
                success: true,
                message: 'Password changed successfuly',
            }
            
        } else {
            return {
                success: false,
                message: 'Password does not match',
                error: 'Password does not match'
            }
        }
    }
    catch (e) {
        console.log(e);
        return {
            success: false,
            message: 'Internal server error',
            error: 'Internal server error',
        }
    }
}
