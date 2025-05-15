'use client'

import { useRouter } from "next/navigation"
import { signUp } from "@/server/actions/sign"
import { useActionState } from "react"
import { ActionResponse } from "@/types/global"
import styles from "../sign.module.css"


const initialState: ActionResponse = {
    success: false,
    message: '',
    errors: undefined,
}


export default function SignUpPage() {

    const router = useRouter()

    const [state, formAction, isPending] = useActionState<
        ActionResponse,
        FormData
    >(async (prevState: ActionResponse, formData: FormData) => {
        try {
            const result = await signUp(formData)

            if (result.success) {
                alert('Account created successfully')
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
            <form action={formAction} className={`${styles.form} ${styles.signup}`}>

                {state?.message && !state.success && (
                    state.message
                )}

                <h1>SIGN UP</h1>
                <div className={styles.inputs}>
                    <label htmlFor="name" className="w-10/12 text-black text-center m-px">Name</label>
                    <input type="text" id="name" name="name" placeholder="Name" disabled={isPending} className="w-10/12 text-black bg-stone-100 border border-stone-200 rounded-md m-px focus:ring focus:border" />

                    <label htmlFor="surname" className="w-10/12 text-black text-center m-px">Surname</label>
                    <input type="text" id="surname" name="surname" placeholder="Surname" disabled={isPending} className="w-10/12 text-black bg-stone-100 border border-stone-200 rounded-md m-px focus:ring focus:border" />

                    <label htmlFor="email" className="w-10/12 text-black text-center m-px">Email</label>
                    <input type="email" id="email" name="email" placeholder="email@example.com" disabled={isPending} className="w-10/12 text-black bg-stone-100 border border-stone-200 rounded-md m-px focus:ring focus:border" />

                    <label htmlFor="password" className="w-10/12 text-black text-center m-px">Password</label>
                    <input type="password" id="password" name="password" placeholder="••••••••" disabled={isPending} className="w-10/12 text-black bg-stone-100 border border-stone-200 rounded-md m-px focus:ring focus:border" />
                </div>
                <div className={styles.options}>
                    <button type="submit" disabled={isPending} className={styles.submit}>Sign up</button>
                </div>
            </form>
        </div>
    )
}