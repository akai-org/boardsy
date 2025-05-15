
import { Suspense } from "react"
import Boards from "./boards"
import CreateBoard from "./createboard"
import styles from './dashboard.module.css'

export default function Dashboard() {

    return (
        <div className="p-4">
            <div className={styles.header}>
                <h1 className="text-2xl font-bold mb-1">Your boards</h1>
                <CreateBoard/>
            </div>
            <Suspense fallback={<h1>Loading boards...</h1>}>
                <Boards/>
            </Suspense>
        </div>
    )
}
