import { setAtom } from 'atomic-redux-state'
import { useAtomicState, useAtomicValue } from 'atomic-redux-state-react'
import type { GetServerSideProps, NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { useCallback } from 'react'
import { Post } from '../features/posts/post'
import { PostModel } from '../features/posts/postModel'
import { postsAtom } from '../features/posts/postsAtom'
import { totalPostsAtom } from '../features/posts/totalPostsAtom'
import { createStore } from '../store/store'
import styles from '../styles/Home.module.css'

const Home: NextPage = () => {
  const [posts, setPosts] = useAtomicState(postsAtom)
  const totalPosts = useAtomicValue(totalPostsAtom);

  const addPost = useCallback(() => {
    setPosts(posts => {
      posts.unshift({
        id: totalPosts + 1,
        title: 'My New Post',
        body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua'
      });
    })
  }, [setPosts, totalPosts])

  return (
    <div className={styles.container}>
      <Head>
        <title>SSR App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to <a href="https://nextjs.org">Next.js!</a>
        </h1>

        <p className={styles.description}>
          Showing { totalPosts } posts
        </p>

        <button onClick={addPost}>Add Post</button>

        <div className={styles.grid}>
          { posts.map(post => <Post key={post.id} title={post.title} body={post.body} />)}
        </div>
      </main>

      <footer className={styles.footer}>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '}
          <span className={styles.logo}>
            <Image src="/vercel.svg" alt="Vercel Logo" width={72} height={16} />
          </span>
        </a>
      </footer>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { store, atomMiddleware } = createStore();

  const posts = await fetch('https://jsonplaceholder.typicode.com/posts')
    .then(response => response.json()) as PostModel[];
  
  store.dispatch(setAtom(postsAtom, posts))

  return {
    props: {
      initialReduxStoreState: store.getState(),
      initialAtomState: atomMiddleware.getState()
    }
  }
}

export default Home;
