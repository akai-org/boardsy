import Link from 'next/link'
import styles from './layout.module.css'
import Options from './options'
// import { Image } from "@mantine/core";
import Image from 'next/image'
import { logos } from '@/types/logos'
import { Flex } from '@mantine/core'

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div>
      <header className={styles.dashboardHeader}>
        <section>
          <Flex justify='center' align='center'>
            <Link href={'/dashboard'} className={styles.logo}>
              <Image src={logos.black.horizontal} alt='Boardsy icon' width={120} height={75} />
            </Link>
          </Flex>
        </section>
        <section></section>
        <section>
          <Options />
        </section>
      </header>
      <section className={styles.appContent}>{children}</section>
    </div>
  )
}
