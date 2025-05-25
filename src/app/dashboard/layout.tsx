import Link from "next/link";
import styles from "./layout.module.css";
import Options from "./options";
import Image from 'next/image';

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div>
            <header className={styles.dashboardHeader}>
                <section>
                    <Link href={'/dashboard'} className={styles.logo}>
                        <Image
                            src={'/icon.svg'}
                            alt="Boardsy icon"
                            width={40}
                            height={40}
                            className={styles.objectCover}
                        />
                        <h1>Board alpha</h1>
                    </Link>
                </section>
                <section>

                </section>
                <section>
                    <Options />
                </section>

            </header>
            <section className={styles.appContent}>
                {children}
            </section>
        </div>
    );
}
