import Link from "next/link";
import styles from "./layout.module.css";
import Options from "./options";
// import { Image } from "@mantine/core";
import Image from "next/image";
import { logos } from "@/types/logos";

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
                            src={logos.black.full}
                            alt='Boardsy icon'
                            height={120}
                            width={120}
                        />
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
