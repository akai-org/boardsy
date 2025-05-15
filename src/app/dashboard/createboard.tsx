'use client'

import { useState, useActionState } from "react";
import { ActionResponse } from "@/types/global";
import { createBoard } from "@/server/actions/board"
import { useRouter } from "next/navigation";


const initialState: ActionResponse = {
    success: false,
    message: '',
    errors: undefined,
}


export default function CreateBoard() {

    const router = useRouter()
    const [state, formAction, isPending] = useActionState<
        ActionResponse,
        FormData
    >(async (prevState: ActionResponse, formData: FormData) => {
        try {
            const result = await createBoard(formData)

            if (result.success) {
                alert('Board created succesfully')
                setShowBoardPopup(false)
                router.refresh()
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


    const [showBoardPopup, setShowBoardPopup] = useState(false);

    if (!showBoardPopup)
        return <button onClick={() => setShowBoardPopup(true)} className="px-3 py-1 bg-white text-black rounded hover:bg-blue-100">Create new board</button>

    return (
        <>
            <button onClick={() => setShowBoardPopup(true)} disabled={true} className="px-3 py-1 bg-white text-black rounded hover:bg-blue-100">Create new board</button>
            <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 border-black">

                <div className="w-[300px] bg-white p-10 transform -translate-y-1/2 absolute top-1/2 left-1/2 -ml-[150px] shadow-lg rounded-lg border-black">

                    <form action={formAction}>

                        {state?.message && !state.success && (
                            state.message
                        )}

                        <h2 className="text-md font-semibold mb-4 text-black">New Board</h2>
                        <p className="mb-4 text-black">Enter name for your board</p>
                        <input type="text" name="boardName" id="boardName" placeholder="Board name" required className="text-black"></input>

                        <button type="submit" disabled={isPending} className="m-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                            Confirm
                        </button>
                        <button type="button" onClick={() => setShowBoardPopup(false)} className="m-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                            Cancel
                        </button>
                    </form>

                </div>
            </div>
        </>
    )
}