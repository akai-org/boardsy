'use client';

import { useState, useTransition, useActionState } from 'react';
import { deleteBoard, getBoards, renameBoard } from '@/server/actions/board';
import styles from './dashboard.module.css';
import Image from 'next/image';
import { ActionResponse } from '@/types/global';


type SortOption = 'Last edited' | 'Created at' | 'Alphabetically';

interface Board {
    id: string;
    name: string;
    ownerId: string;
    createdAt: Date;
    updatedAt: Date;
}

interface BoardPopupProps {
    board: Board;
    trigger: boolean;
    setTrigger: React.Dispatch<React.SetStateAction<boolean>>;
    setBoards: React.Dispatch<React.SetStateAction<Board[]>>;
}

const initialState: ActionResponse = {
    success: false,
    message: '',
    errors: undefined,
}


const DeletePopup = ({ board, trigger, setTrigger, setBoards }: BoardPopupProps) => {

    if (!trigger)
        return ''

    return (
        <div className={styles.popupOverlay}>
            <div className={styles.popupContainer}>
                <h1 className={styles.popupHeader}>Delete {board.name}?</h1>
                <div className={styles.popupActions}>
                    <button className={`${styles.popupButton} ${styles['popupButton--primary']}`} onClick={async () => {

                        const result = await deleteBoard(board.id)
                        if (result.success) {
                            setTrigger(false)
                            setBoards((prev) => prev.filter((b) => b.id !== board.id))
                        }

                    }}>Delete</button>
                    <button
                        className={`${styles.popupButton} ${styles['popupButton--secondary']}`}
                        onClick={() => setTrigger(false)}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )
}


const RenamePopup = ({ board, trigger, setTrigger, setBoards }: BoardPopupProps) => {

    const [newName, setNewName] = useState<string>('')
    const [state, formAction, isPending] = useActionState<
        ActionResponse,
        FormData
    >(async (prevState: ActionResponse, formData: FormData) => {
        try {
            const result = await renameBoard(board.id, formData)

            if (result.success) {
                setTrigger(false)
                setBoards((prev) => prev.map((b) => b.id === board.id ? { ...b, name: newName } : b))
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


    if (!trigger)
        return ''

    return (
        <div className={styles.popupOverlay}>
            <div className={styles.popupContainer}>
                <form action={formAction} className={styles.popupForm}>

                    {state?.message && !state.success && (
                        state.message
                    )}

                    <h1 className={styles.popupHeader}>Rename {board.name}</h1>
                    <input value={newName} onChange={(e) => setNewName(e.target.value)} className={styles.popupInput} type="text" name="newname" id="newname" disabled={isPending} />
                    <div className={styles.popupActions}>
                        <button
                            className={`${styles.popupButton} ${styles['popupButton--primary']} ${styles.rename}`}
                            type="submit"
                            disabled={isPending}
                        >
                            Rename
                        </button>
                        <button
                            className={`${styles.popupButton} ${styles['popupButton--secondary']}`}
                            onClick={() => setTrigger(false)}
                            disabled={isPending}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}


function Board({ data, setBoards }: { data: Board, setBoards: React.Dispatch<React.SetStateAction<Board[]>> }) {
    const [menuVisible, setMenuVisible] = useState(false)
    const [showDeletePopup, setShowDeletePoput] = useState(false)
    const [showRenamePopup, setShowRenamePoput] = useState(false)


    const handleIconClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setMenuVisible((prev) => !prev);
    };

    return (
        <li className={styles.board} key={data.id}>
            <div className={styles.gradient} onMouseLeave={() => setMenuVisible(false)}>
                <button
                    className={styles.hoverButton}
                    onClick={handleIconClick}
                >
                    <Image
                        src="/cogwheel.svg"
                        alt="Open board options"
                        width={30}
                        height={30}
                        className="cursor-pointer"
                    />
                </button>

                {menuVisible && (
                    <ul
                        className={styles.contextMenu}
                        style={{ top: 0, right: 0 }}
                    >
                        <li onClick={() => {setMenuVisible(false); setShowRenamePoput(true)}} className={styles.contextMenuItem}>Rename</li>
                        <li onClick={() => {setMenuVisible(false); setShowDeletePoput(true)}} className={styles.contextMenuItem}>Delete</li>
                    </ul>
                )}

                <DeletePopup
                    board={data}
                    trigger={showDeletePopup}
                    setTrigger={setShowDeletePoput}
                    setBoards={setBoards}
                />

                <RenamePopup
                    board={data}
                    trigger={showRenamePopup}
                    setTrigger={setShowRenamePoput}
                    setBoards={setBoards}
                />
            </div>

            <p className={styles.title}>{data.name}</p>
        </li>
    );
}


export default function DynamicBoards({ initialBoards }: { initialBoards: Board[] }) {

    const [boards, setBoards] = useState<Board[]>(initialBoards);
    const [displayOption, setDisplayOption] = useState<SortOption>('Last edited');
    const [isPending, startTransition] = useTransition();

    async function handleSortChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const newOption = e.target.value as SortOption;
        setDisplayOption(newOption);
        startTransition(async () => {
            const response = await getBoards(newOption);
            if (response.success) {
                setBoards(response.boards);
            }
        });
    }

    return (
        <section>
            <select
                value={displayOption}
                onChange={handleSortChange}
                className="mb-4 px-2 py-1 border rounded"
            >
                <option>Last edited</option>
                <option>Created at</option>
                <option>Alphabetically</option>
            </select>

            {isPending ? (
                <p>Loading boards...</p>
            ) : (
                <ul className={styles.boardsList}>
                    {boards.map((content) => (
                        <Board data={content} key={content.id} setBoards={setBoards} />
                    ))}
                </ul>
            )}
        </section>
    );
}