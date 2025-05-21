import '../styles/globals.css';
import { AnimatePresence } from 'framer-motion';
import Head from 'next/head';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

function MyApp({ Component, pageProps, router }) {
  // Create a client only once
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <Head>
        <title>Gas Trackrr | Track your gas onchain</title>
        <meta name="description" content="Check your transaction count and gas spent on Base blockchain" />
        <link rel="icon" href="/logo/logo.svg" />
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Roboto+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
      </Head>
      <AnimatePresence mode="wait">
        <Component {...pageProps} key={router.route} />
      </AnimatePresence>
    </QueryClientProvider>
  );
}

export default MyApp; 