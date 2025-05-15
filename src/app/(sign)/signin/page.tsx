'use client'

import { useRouter } from "next/navigation"
import { signIn } from "@/server/actions/sign"
import { useActionState } from "react"
import { ActionResponse } from "@/types/global"

import styles from '../sign.module.css'



const initialState: ActionResponse = {
    success: false,
    message: '',
    errors: undefined,
}


export default function SignInPage() {

    const router = useRouter()

    const [state, formAction, isPending] = useActionState<
        ActionResponse,
        FormData
    >(async (prevState: ActionResponse, formData: FormData) => {
        try {
            const result = await signIn(formData)

            if (result.success) {
                alert('Signed in successfully')
                router.replace('/dashboard')
            }
            return result
            
        } catch (e) {
            return {
                success: false,
                message: (e as Error).message || 'An error occurred',
                errors: undefined,
            }
        }
    }, initialState)


    return (
        <div className={styles.background}>
            <form action={formAction} className={`${styles.form} ${styles.signin}`}>

                {state?.message && !state.success && (
                    state.message
                )}

                <h1>LOGIN</h1>

                <div className={styles.inputs}>
                    <label htmlFor="email">EMAIL</label>
                    <input type="email" id="email" name="email" placeholder="email@example.com" disabled={isPending}/>

                    <label htmlFor="password">PASSWORD</label>
                    <input type="password" id="password" name="password" placeholder="••••••••" disabled={isPending}/>
                </div>

                <div className={styles.options}>
                    <button type="submit" disabled={isPending} className={styles.submit}>SIGN IN</button>
                    <a href="/signup">Don&apos;t have an account?</a>
                </div>
            </form>
        </div>
    )
}