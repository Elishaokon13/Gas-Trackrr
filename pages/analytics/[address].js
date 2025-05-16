import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { getWalletData } from '../../lib/blockchain';
import { BackgroundLines } from '../../components/BackgroundLines';

export default function AnalyticsPage() {
  const router = useRouter();
  const { address } = router.query;
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().toLocaleString('default', { month: 'short' }).toUpperCase();

  // Fetch data when address is available
  useEffect(() => {
    if (!address) return;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        // Decode the address/name from the URL
        const decodedAddress = decodeURIComponent(address);
        console.log(`Fetching data for: ${decodedAddress}`);
        
        const data = await getWalletData(decodedAddress);
        console.log('Received wallet data:', data);
        
        if (!data.success) {
          setError(data.error || 'Failed to fetch wallet data');
        } else {
          setWalletData(data);
        }
      } catch (err) {
        console.error('Error in data fetching:', err);
        setError(err.message || 'Failed to load wallet data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [address]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-2xl font-pixel text-white mb-4 text-gradient">Loading Wallet Data</h1>
          {/* <p className="text-gray-400 mb-6">Fetching data from Base blockchain...</p> */}
          <div className="w-12 h-12 border-t-2 border-b-2 border-base-blue border-solid rounded-full animate-spin mx-auto"></div>
        </motion.div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full glass-card p-8"
        >
          <h1 className="text-2xl font-pixel text-white mb-4 text-gradient">Error</h1>
          <p className="text-red-400 mb-6">{error}</p>
          <div className="text-gray-400 mb-6 text-sm">
            <p>Possible issues:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>The Basescan API may be rate limited</li>
              <li>The wallet address or BaseName may not exist on Base</li>
              <li>There may be network issues</li>
              <li>Invalid BaseName format (should be name.base or name.base.eth)</li>
            </ul>
          </div>
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 px-6 bg-base-blue font-pixel text-white text-sm rounded-lg transition-all duration-300"
          >
            Go Back
          </button>
        </motion.div>
      </div>
    );
  }

  // No data available
  if (!walletData) {
    return null;
  }

  // Format the wallet address for display
  const displayAddress = walletData.baseName || `${walletData.address.slice(0, 6)}...${walletData.address.slice(-4)}`;
  const rank = walletData.transactionCount > 100 ? "Based Baby" : walletData.transactionCount > 50 ? "Base Beginner" : "Base Newbie";

  // Animation variants for staggered animations
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { duration: 0.5 } }
  };

  return (
    <BackgroundLines
      className="min-h-screen text-white relative"
      svgOptions={{ duration: 15 }}
    >
      <Head>
        <title>Based Baby | {displayAddress}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      
      <div className="container mx-auto max-w-4xl px-4 py-8 md:py-12 relative z-10 content-container">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center mb-8 md:mb-12"
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-pixel mb-6 tracking-wider text-gradient animate-float">
            {rank}
          </h1>
          <div className="relative group">
            <h2 className="text-xl sm:text-2xl font-pixel text-gray-300">
              {displayAddress}
            </h2>
            {!walletData.baseName && (
              <div className="absolute inset-x-0 -bottom-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="bg-black/80 text-xs p-2 rounded-lg">
                  {walletData.address}
                </div>
              </div>
            )}
          </div>
        </motion.div>
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-8 mb-12 md:mb-16 max-w-3xl mx-auto"
        >
          {/* Transactions Card */}
          <motion.div variants={itemVariants} className="glass-card p-6 md:p-8">
            <div className="text-center">
              <h2 className="value-display">
                {walletData.transactionCount}
              </h2>
              <p className="font-pixel text-2xl md:text-3xl mb-4 text-gradient">
                Txns
              </p>
              <p className="text-sm text-gray-400">
                {walletData.outgoingTransactions} outgoing transactions<br />on Base blockchain
              </p>
            </div>
          </motion.div>

          {/* Volume Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            {/* Incoming ETH Card */}
            <motion.div variants={itemVariants} className="glass-card p-6 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-pixel text-lg text-yellow-400">Incoming ETH</h3>
                  <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-yellow-400">
                      {parseFloat(walletData.ethVolumeIn).toFixed(4)}
                    </span>
                    <span className="text-sm text-yellow-400/70">ETH</span>
                  </div>
                  <div className="text-sm text-gray-400">
                    ${walletData.ethVolumeInUsd}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Outgoing ETH Card */}
            <motion.div variants={itemVariants} className="glass-card p-6 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-pixel text-lg text-red-400">Outgoing ETH</h3>
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-red-400">
                      {parseFloat(walletData.ethVolumeOut).toFixed(4)}
                    </span>
                    <span className="text-sm text-red-400/70">ETH</span>
                  </div>
                  <div className="text-sm text-gray-400">
                    ${walletData.ethVolumeOutUsd}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Incoming USDC Card */}
            <motion.div variants={itemVariants} className="glass-card p-6 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-pixel text-lg text-blue-400">Incoming USDC</h3>
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-blue-400">
                      {parseFloat(walletData.usdcVolumeIn).toFixed(2)}
                    </span>
                    <span className="text-sm text-blue-400/70">USDC</span>
                  </div>
                  <div className="text-sm text-gray-400">
                    ${walletData.usdcVolumeInUsd}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Outgoing USDC Card */}
            <motion.div variants={itemVariants} className="glass-card p-6 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-pixel text-lg text-purple-400">Outgoing USDC</h3>
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-purple-400">
                      {parseFloat(walletData.usdcVolumeOut).toFixed(2)}
                    </span>
                    <span className="text-sm text-purple-400/70">USDC</span>
                  </div>
                  <div className="text-sm text-gray-400">
                    ${walletData.usdcVolumeOutUsd}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Gas Card */}
          <motion.div variants={itemVariants} className="glass-card p-6 md:p-8">
            <div className="text-center">
              <h2 className="value-display">
                {parseFloat(walletData.gasSpent.ethAmount).toFixed(4)} <span className="text-yellow-400">ETH</span>
              </h2>
              <p className="usd-value mb-2">
                ${walletData.gasSpent.usdAmount}
              </p>
              <p className="font-pixel text-xl md:text-2xl mb-4 text-gradient">
                Gas Spent
              </p>
              <p className="text-sm text-gray-400">
                Current ETH price: ${walletData.ethPrice?.toFixed(2) || "N/A"}
              </p>
            </div>
          </motion.div>
        </motion.div>
        
        {/* Bottom Action Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="text-center"
        >
          <motion.button
            onClick={() => router.push('/')}
            className="px-8 py-4 bg-base-blue font-pixel text-white rounded-lg transition-all duration-300 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-900/20"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            CHECK ANOTHER WALLET
          </motion.button>
        </motion.div>
      </div>
    </BackgroundLines>
  );
} 