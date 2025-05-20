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

function Board({ data }: { data: Board }) {
    const [menuVisible, setMenuVisible] = useState(false);

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
                        <li className={styles.contextMenuItem}>Rename</li>
                        <li className={styles.contextMenuItem}>Delete</li>
                    </ul>
                )}
            </div>

            <p className={styles.title}>{data.name}</p>
        </li>
    );
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
                    {boards.map((content) => (
                        <Board data={content} key={content.id}/>
                    ))}
                </ul>
            )}
        </section>
    );
}