import type { GetServerSideProps, NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { useSelector } from 'react-redux'
import { Post } from '../features/posts/post'
import { PostModel } from '../features/posts/postModel'
import { selectPosts, setPosts } from '../features/posts/posts.slice'
import { createStore } from '../store/store'
import styles from '../styles/Home.module.css'

const Home: NextPage = () => {
  const posts = useSelector(selectPosts);

  return (
    <div className={styles.container}>
      <Head>
        <title>Server Side Rendering</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to <a href="https://nextjs.org">Next.js!</a>
        </h1>

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
  const store = createStore();

  const posts = await fetch('https://jsonplaceholder.typicode.com/posts')
    .then(response => response.json()) as PostModel[];
  
  store.dispatch(setPosts(posts))

  return {
    props: {
      initialReduxStoreState: store.getState()
    }
  }
}

export default Home;
