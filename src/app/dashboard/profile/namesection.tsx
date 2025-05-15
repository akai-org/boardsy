'use client'

import { useState, useActionState } from 'react';
import { ActionResponse } from '@/types/global';
import { changeName } from '@/server/actions/user';
import { useRouter } from 'next/navigation';
import styles from './profile.module.css';

const initialState: ActionResponse = {
    success: false,
    message: '',
    errors: undefined,
}

export default function NameSection({
    userData,
}: {
    userData: {
        name: string;
        surname: string;
        profilePictureUrl: string | null;
        email: string;
    };
}) {

    const router = useRouter();

    const [editableName, setEditableName] = useState(false)
    const [name, setName] = useState(userData.name)
    const [surname, setSurname] = useState(userData.surname)

    const [state, formAction, isPending] = useActionState<
        ActionResponse,
        FormData
    >(async (prevState: ActionResponse, formData: FormData) => {
        try {
            if (formData.get("name") === userData.name && formData.get("surname") === userData.surname) 
                return {
                    success: false,
                    message: "Names are the same. No update made.",
                    errors: undefined,
                }

            else {
                const result = await changeName(formData)
                setEditableName(false);


                if (result.success) {
                    alert('Names changed successfully');
                    router.refresh();
                }
                return result
            }

        } catch (e) {
            return {
                success: false,
                message: (e as Error).message || 'An error occurred',
                errors: undefined,
            }
        }
    }, initialState)


    if (!editableName)
        return (
            <section id="name" className={styles.gridSection}>
                <div className={styles.infoBlock}>
                    <h2 className={styles.sectionTitle}>First Name</h2>
                    <p className={styles.value}>{userData.name}</p>
                </div>
                <div className={styles.infoBlock}>
                    <h2 className={styles.sectionTitle}>Last Name</h2>
                    <p className={styles.value}>{userData.surname}</p>
                </div>
                <button onClick={() => setEditableName(true)} id="edit_name" className={styles.editNameButton}>
                    Edit Name
                </button>
            </section>
        )

    return (
        <form action={formAction} id="name" className={styles.gridSection}>


            <div className={styles.infoBlock}>
                <label className={styles.sectionTitle} htmlFor='name'>First Name</label>
                <input value={name} name="name" id="name" onChange={(e) => setName(e.target.value)} type="text" className={styles.valueToChange} disabled={isPending} />
            </div>
            <div className={styles.infoBlock}>
                <label className={styles.sectionTitle} htmlFor='surname'>Last Name</label>
                <input value={surname} name="surname" id="surname" onChange={(e) => setSurname(e.target.value)} type="text" className={styles.valueToChange} disabled={isPending} />
            </div>
            
            {state?.message && !state.success && (
                <p className={styles.errormsg}>{state.message}</p>
            )}
            
            <button type="submit" id="edit_name" className={styles.editButton}>
                Confirm
            </button>
            <button onClick={(e) => {
                e.preventDefault()
                setName(userData.name)
                setSurname(userData.surname)
                setEditableName(false)
            }
            } id="edit_name" className={styles.editButton}>
                Cancel
            </button>
        </form>
    )
}