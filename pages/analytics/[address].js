import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { getWalletData } from '../../lib/blockchain';
import ParticleBackground from '../../components/ParticleBackground';
import BlueWave from '../../components/BlueWave';

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
        <div className="text-center">
          <h1 className="text-2xl font-pixel text-white mb-4">Loading Wallet Data</h1>
          <p className="text-gray-400 mb-4">Fetching data from Base blockchain...</p>
          <div className="w-10 h-10 border-t-2 border-blue-500 border-solid rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="max-w-md p-8 bg-gray-900 rounded-lg">
          <h1 className="text-2xl font-pixel text-white mb-4">Error</h1>
          <p className="text-red-400 mb-6">{error}</p>
          <div className="text-gray-400 mb-4 text-sm">
            <p>Possible issues:</p>
            <ul className="list-disc pl-5 mt-2">
              <li>The Basescan API may be rate limited</li>
              <li>The wallet address may not exist on Base</li>
              <li>There may be network issues</li>
            </ul>
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 text-white"
          >
            Go Back
          </button>
        </div>
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
  
  // Generate fun copywriting based on transaction count
  const generateCopywriting = () => {
    if (walletData.transactionCount > 100) {
      return `You've made ${walletData.transactionCount} transactions on Base in ${currentYear}! With a total volume of $${walletData.gasSpent.usdAmount}, you're becoming a true onchain explorer. Keep building those Based moves!`;
    } else if (walletData.transactionCount > 50) {
      return `With ${walletData.transactionCount} transactions on Base, you're starting to make some waves! Keep this momentum going and you'll be a Based whale by ${currentYear}!`;
    } else {
      return `Just ${walletData.transactionCount} transactions? You're just dipping your toes into the Based waters. Time to dive in deeper in ${currentYear}!`;
    }
  };
  
  // Calculate NFTs (simulated)
  const estimatedNfts = Math.max(1, Math.floor(walletData.transactionCount / 10));

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <Head>
        <title>Based Baby | {displayAddress}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      
      {/* Particle background */}
      <ParticleBackground />
      
      <div className="container mx-auto max-w-2xl px-4 py-8 relative z-10">
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl md:text-6xl font-pixel mb-6 tracking-widest">
            {rank}
          </h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-sm sm:text-base md:text-lg max-w-xl mx-auto leading-relaxed"
          >
            {generateCopywriting()}
          </motion.p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          {/* Transactions Card */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="bg-black/30 backdrop-blur-sm rounded-lg p-6 border border-gray-800"
          >
            <div className="text-center">
              <h2 className="font-pixel text-5xl md:text-6xl mb-2">
                {walletData.transactionCount}
              </h2>
              <p className="font-pixel text-2xl md:text-3xl mb-4">
                Txns
              </p>
              <p className="text-sm text-gray-400">
                just dipping your toes into<br />the Based waters
              </p>
            </div>
          </motion.div>
          
          {/* Volume Card */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.5 }}
            className="bg-black/30 backdrop-blur-sm rounded-lg p-6 border border-gray-800"
          >
            <div className="text-center">
              <h2 className="font-pixel text-4xl md:text-5xl mb-2">
                {parseFloat(walletData.volume.ethAmount).toFixed(2)} eth
              </h2>
              <p className="font-pixel text-xl md:text-2xl mb-2 text-green-400">
                ${walletData.volume.usdAmount}
              </p>
              <p className="font-pixel text-2xl md:text-3xl mb-4">
                Volume
              </p>
              <p className="text-sm text-gray-400">
                your trading activity is<br />making waves in the Base ocean
              </p>
            </div>
          </motion.div>
          
          {/* Month/Year Card */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="bg-black/30 backdrop-blur-sm rounded-lg p-6 border border-gray-800"
          >
            <div className="text-center">
              <h2 className="font-pixel text-4xl md:text-5xl mb-2">
                {currentMonth}
              </h2>
              <p className="font-pixel text-3xl md:text-4xl mb-4">
                {currentYear}
              </p>
              <p className="text-sm text-gray-400">
                your Base grind started to<br />show some serious momentum!
              </p>
            </div>
          </motion.div>
          
          {/* Gas Card */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.5 }}
            className="bg-black/30 backdrop-blur-sm rounded-lg p-6 border border-gray-800"
          >
            <div className="text-center">
              {/* <h2 className="font-pixel text-4xl md:text-5xl mb-2">
                {parseFloat(walletData.gasSpent.ethAmount).toFixed(2)} eth
              </h2> */}
              <p className="font-pixel text-xl md:text-2xl mb-2 text-green-400">
                ${walletData.gasSpent.usdAmount}
              </p>
              <p className="font-pixel text-2xl md:text-3xl mb-4">
                on Gas
              </p>
              <p className="text-sm text-gray-400">
                efficient enough to stay<br />Based and keep moving fast!
              </p>
            </div>
          </motion.div>
        </div>
        
        {/* Bottom Action Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 0.5 }}
          className="text-center mb-16"
        >
          <button
            onClick={() => router.push('/')}
            className="px-8 py-4 bg-base-blue font-pixel text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            CHECK ANOTHER WALLET
          </button>
        </motion.div>
      </div>
      
      {/* Blue Wave at bottom */}
      <BlueWave />
    </div>
  );
} 