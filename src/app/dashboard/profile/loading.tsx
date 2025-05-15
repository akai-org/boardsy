import Image from 'next/image';
import styles from './profile.module.css';


export default function LoadingProfilePage() {
    return (
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
                            src="/cat.jpg"
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

                {/* Name */}
                <section id="name" className={styles.gridSection}>
                    <div className={styles.infoBlock}>
                        <h2 className={styles.sectionTitle}>First Name</h2>
                        <p className={styles.value}>name</p>
                    </div>
                    <div className={styles.infoBlock}>
                        <h2 className={styles.sectionTitle}>Last Name</h2>
                        <p className={styles.value}>surname</p>
                    </div>
                    <button id="edit_name" className={styles.editButton}>
                        Edit Name
                    </button>
                </section>

                {/* Email */}
                <section id="email" className={styles.infoBlock}>
                    <h2 className={styles.sectionTitle}>Email</h2>
                    <p className={styles.value}>email</p>
                    <button id="edit_email" className={styles.editButton}>
                        Change Email
                    </button>
                </section>

                {/* Password */}
                <section id="password" className={styles.infoBlock}>
                    <button id="edit_password" className={styles.redButton}>
                        Edit Password
                    </button>
                </section>
            </div>
        </div>
    );
}
