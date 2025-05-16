import '../styles/globals.css';
import { AnimatePresence } from 'framer-motion';
import Head from 'next/head';

function MyApp({ Component, pageProps, router }) {
  return (
    <>
      <Head>
        <title>Base Wrapped | Your Year on Base</title>
        <meta name="description" content="Your personalized Base blockchain year in review" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <AnimatePresence mode="wait">
        <Component {...pageProps} key={router.route} />
      </AnimatePresence>
    </>
  );
}

export default MyApp; 