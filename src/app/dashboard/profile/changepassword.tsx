'use client'
import { ActionResponse } from "@/types/global";
import { changePassword } from "@/server/actions/user";
import { useState, useActionState } from "react";
import styles from './profile.module.css';

const initialState: ActionResponse = {
    success: false,
    message: '',
    errors: undefined,
}


export default function ChangePasswordPopup() {

    const [showPopup, setshowPopup] = useState(false);
    const [currentPassword, setcurrentPassword] = useState('')
    const [newPassword, setnewPassword] = useState('')
    const [state, formAction, isPending] = useActionState<
        ActionResponse,
        FormData
    >(async (prevState: ActionResponse, formData: FormData) => {
        try {
            const result = await changePassword(formData)

            if (result.success) {
                alert('Password changed successfully')
                setshowPopup(false);
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

    if (!showPopup) {
        return (<section id="password" className={`${styles.infoBlock} ${styles.bottom_margin}`}>
            <button onClick={() => setshowPopup(true)} id="edit_password" className={styles.redButton}>
                Change Password
            </button>
        </section>)
    }

    return (
        <form action={formAction} className={styles.gridSection}>

            <div className={styles.infoBlock}>
                <label className={styles.sectionTitle} htmlFor='current_password'>Current password</label>
                <input value={currentPassword} name="current_password" id="current_password" onChange={(e) => setcurrentPassword(e.target.value)} type="password" className={styles.valueToChange} disabled={isPending} />
            </div>
            <div className={styles.infoBlock}>
                <label className={styles.sectionTitle} htmlFor='new_password'>New password</label>
                <input value={newPassword} name="new_password" id="new_password" onChange={(e) => setnewPassword(e.target.value)} type="password" className={styles.valueToChange} disabled={isPending} />
            </div>

            {state?.message && !state.success && (
                <p className={styles.errormsg}>{state.message}</p>
            )}

            <button type="submit" className={styles.editButton}>Confirm</button>
            <button onClick={(e) => {
                e.preventDefault()
                setshowPopup(false)
                setcurrentPassword('')
                setnewPassword('')
            }} className={styles.editButton}>
                Cancel
            </button>
        </form>
    )
}