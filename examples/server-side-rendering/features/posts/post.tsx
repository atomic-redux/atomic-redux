import { FC } from 'react';
import styles from './post.module.css';


export type PostProps = {
    title: string,
    body: string
}

export const Post: FC<PostProps> = (props) => {
    return (
        <div className={styles.post}>
            <h2>
                { props.title }
            </h2>
            <p>
                { props.body }
            </p>
        </div>
    )
}