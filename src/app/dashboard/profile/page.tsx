import Image from 'next/image';
import { getUserData } from '@/server/actions/user';
import { redirect } from 'next/navigation';
import styles from './profile.module.css';
import NameSection from './namesection';
import ChangePasswordPopup from './changepassword';


export default async function ProfilePage() {
    
    const userData = await getUserData()
    
    if (!userData)
        redirect('/signin')
    

    return (
        <div className={styles.center}>
            <div className={styles.container}>
                <h1 className={styles.title}>Profile Panel</h1>

                <div className={styles.sectionList}>
                    {/* Profile Picture */}
                    <section
                        id="profilePicture"
                        className={styles.profilePictureSection}
                    >
                        <h2 className={styles.sectionTitle}>Profile Picture</h2>
                        <div className={styles.avatarWrapper}>
                            <Image
                                src={userData.profilePictureUrl || '/cat.jpg'}
                                alt="User's profile picture"
                                sizes='max-width: 200px, max-height: 200px'
                                fill
                                className={styles.objectCover}
                            />
                        </div>
                        <button
                            id="edit_profilePicture"
                            className={styles.editButton}
                        >
                            Edit
                        </button>
                    </section>

                    <NameSection userData={userData}/>

                    {/* Email */}
                    <section id="email" className={styles.infoBlock}>
                        <h2 className={styles.sectionTitle}>Email</h2>
                        <p className={styles.value}>{userData.email}</p>
                        <button id="edit_email" className={styles.editButton}>
                            Change Email
                        </button>
                    </section>
                    <ChangePasswordPopup/>
                </div>
            </div>
        </div>
    );
}
