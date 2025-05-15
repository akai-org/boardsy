'use client';

import { useState, useTransition } from 'react';
import { getBoards } from '@/server/actions/board';
import styles from './dashboard.module.css';
import Image from 'next/image';

type SortOption = 'Last edited' | 'Created at' | 'Alphabetically';

interface Board {
    id: string;
    name: string;
    ownerId: string;
    createdAt: Date;
    updatedAt: Date;
}

interface DisplayBoardsProps {
    initialBoards: Board[];
}

function board(boards: Board) {
    return (
        <li className={styles.board} key={boards.id}>
            <div className={styles.gradient}>
                <button className={styles.hoverButton}>
                    <Image
                        src={'/trash.svg'}
                        alt="Delete board button"
                        height={30}
                        width={30}
                        className="cursor-pointer"
                    />
                </button>
            </div>
            <p className={styles.title}>{boards.name}</p>
        </li>)
}


export default function DynamicBoards({ initialBoards }: DisplayBoardsProps) {
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
                    {boards.map((content) =>
                        (board(content)
                    ))}
                </ul>
            )}
        </section>
    );
}