import Image from "next/image";

import styles from './board.module.css';

export default function Board() {

    return (
        <>
            <div className={styles.title}>
                <h1>Boardsy</h1>
                <h2>board name</h2>
            </div>
            <div className={styles.tools}>
                <button>
                    <Image
                        src={'/tools/selector.svg'}
                        alt="selector"
                        height={50}
                        width={50}
                    />
                </button>
                <button>
                    <Image
                        src={'/tools/pencil.svg'}
                        alt="pencil"
                        height={50}
                        width={50}
                    />
                </button>
                <button>
                    <Image
                        src={'/tools/text.svg'}
                        alt="text"
                        height={50}
                        width={50}
                    />
                </button>
                <button>
                    <Image
                        src={'/tools/shapes.svg'}
                        alt="shapes"
                        height={50}
                        width={50}
                    />
                </button>
                
            </div>
            <div className={styles.zoom}>
                <button>
                    <Image
                        src={'/tools/minus.svg'}
                        alt="zoom out"
                        height={50}
                        width={50}
                    />
                </button>
                <div>x %</div>
                <button>
                    <Image
                        src={'/tools/plus.svg'}
                        alt="zoom in"
                        height={50}
                        width={50}
                    />
                </button>
            </div>
            {/* Drawing area here */}
        </>
    )
}