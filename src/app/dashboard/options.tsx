'use client'

import Link from "next/link";
import Image from 'next/image';
import styles from "./layout.module.css";
import { useState } from "react";
// import Logout from "@/server/components/logoutclient";
import { useRouter } from 'next/navigation';
import { deleteSession } from "@/server/auth";



export default function Options() {

    const [showOptions, setShowOptions] = useState(false);
    const router = useRouter()

    function Logout() {

        deleteSession()
        router.replace("/")

    }

    return (
        <div className={styles.profileMenu}>

            {/* avatar */}
            <div className={styles.avatarButton} onClick={() => setShowOptions((v) => !v)}>
                <Image
                    src={'/cat.jpg'}
                    alt="User's profile picture"
                    height={40}
                    width={40}
                    className={styles.profilePicture}
                />
            </div>

            {/* dropdown */}
            {showOptions && (
                <ul className={styles.dropdownMenu}>
                    <li>
                        <Link href="/dashboard/profile" onClick={() => setShowOptions(false)}>Profile</Link>
                    </li>
                    <li>
                        <button onClick={() => Logout()}>Log out</button>
                        {/* <Logout/> */}

                    </li>
                </ul>
            )}
        </div>
    )
}
