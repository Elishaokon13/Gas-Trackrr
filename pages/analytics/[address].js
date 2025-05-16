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
        
        console.log(`Fetching data for address: ${address}`);
        const data = await getWalletData(address);
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
          <p className="text-gray-400 mb-6">Fetching data from Base blockchain...</p>
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
              <li>The wallet address may not exist on Base</li>
              <li>There may be network issues</li>
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
  const displayAddress = `${walletData.address.slice(0, 6)}...${walletData.address.slice(-4)}`;
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

          {/* Volume Card (ETH & USDC, incoming/outgoing) */}
          <motion.div variants={itemVariants} className="glass-card p-6 md:p-8">
            <div className="text-center">
              <h2 className="font-pixel text-2xl md:text-3xl mb-4 text-gradient">Volume</h2>
              <div className="grid grid-cols-2 gap-4 mb-2">
                <div>
                  <div className="font-pixel text-xs text-gray-400 mb-1">INCOMING</div>
                  <div className="mb-1">
                    <span className="value-display text-yellow-400">{parseFloat(walletData.ethVolumeIn).toFixed(4)}</span>
                    <span className="font-pixel text-yellow-400 ml-1">ETH</span>
                  </div>
                  <div className="text-xs text-gray-400 mb-2">${walletData.ethVolumeInUsd}</div>
                  <div className="mb-1">
                    <span className="value-display text-blue-400">{parseFloat(walletData.usdcVolumeIn).toFixed(2)}</span>
                    <span className="font-pixel text-blue-400 ml-1">USDC</span>
                  </div>
                  <div className="text-xs text-gray-400">${walletData.usdcVolumeInUsd}</div>
                </div>
                <div>
                  <div className="font-pixel text-xs text-gray-400 mb-1">OUTGOING</div>
                  <div className="mb-1">
                    <span className="value-display text-yellow-400">{parseFloat(walletData.ethVolumeOut).toFixed(4)}</span>
                    <span className="font-pixel text-yellow-400 ml-1">ETH</span>
                  </div>
                  <div className="text-xs text-gray-400 mb-2">${walletData.ethVolumeOutUsd}</div>
                  <div className="mb-1">
                    <span className="value-display text-blue-400">{parseFloat(walletData.usdcVolumeOut).toFixed(2)}</span>
                    <span className="font-pixel text-blue-400 ml-1">USDC</span>
                  </div>
                  <div className="text-xs text-gray-400">${walletData.usdcVolumeOutUsd}</div>
                </div>
              </div>
            </div>
          </motion.div>

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