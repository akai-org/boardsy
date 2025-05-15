'use server'

import prisma from "@/server/db";
import { hashPassword, createSession } from "@/server/auth"
import { ActionResponse } from "@/types/global";


export async function signIn(formData: FormData): Promise<ActionResponse> {

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try{
        const user = await prisma.user.findUnique({
            where: { email: email }
        })
    
        if (!user || user.password !== await hashPassword(password))
            return {
                success: false,
                message: 'Wrong email or password',
                error: 'Wrong email or password'
            }
    
        await createSession(user.id)
        return {
            success: true,
            message: 'Signed in successfully'
        }

    } catch(e) {
        console.log(e)
        return {
            success: false,
            message: 'Wrong data',
            error: 'Wrong data'
        }
    }
}


export async function signUp(formData: FormData): Promise<ActionResponse> {

    const data = {
        name: formData.get("name") as string,
        surname: formData.get("surname") as string,
        email: formData.get("email") as string,
        password: await hashPassword(formData.get("password") as string)
    }

    try {

        const user = await prisma.user.create({
            data: data
        })

        await createSession(user.id)
        return {
            success: true,
            message: 'Signed up successfuly',
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