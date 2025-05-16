import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Home() {
  const [walletAddress, setWalletAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic ETH address validation
    if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      setError('Please enter a valid Ethereum address');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Navigate to analytics page
      router.push(`/analytics/${walletAddress}`);
    } catch (error) {
      console.error('Error:', error);
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black">
      <Head>
        <title>Base Analytics | Wallet Analytics Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>
      
      <div className="w-full max-w-md p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full flex flex-col items-center justify-center"
        >
          <div className="text-center mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-green-400 mb-3">Base Analytics</h1>
            <p className="text-base sm:text-lg text-white/80">
              Track your onchain activity on Base
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="w-full bg-gray-900 rounded-lg p-6 shadow-lg border border-gray-800">
            <div className="mb-4">
              <label htmlFor="wallet-address" className="block text-white/80 text-sm mb-2">
                Enter your wallet address:
              </label>
              <input
                id="wallet-address"
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="0x..."
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            {error && (
              <p className="text-red-500 text-xs mb-4">{error}</p>
            )}
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium text-sm rounded-lg transition duration-300 flex items-center justify-center"
            >
              {isLoading ? (
                <span className="inline-block animate-spin mr-2">↻</span>
              ) : (
                'View Analytics'
              )}
            </button>
          </form>
          
          <div className="mt-8 text-center">
            <h2 className="text-xl text-white mb-4">Track Your Base Activity</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-gray-900 p-4 rounded-lg">
                <div className="text-green-400 text-xl mb-2">📊</div>
                <h3 className="font-medium text-white mb-1">Transaction Count</h3>
                <p className="text-gray-400">See your total transactions on Base</p>
              </div>
              <div className="bg-gray-900 p-4 rounded-lg">
                <div className="text-green-400 text-xl mb-2">⛽</div>
                <h3 className="font-medium text-white mb-1">Gas Tracking</h3>
                <p className="text-gray-400">Monitor your gas spending in ETH and USD</p>
              </div>
              <div className="bg-gray-900 p-4 rounded-lg">
                <div className="text-green-400 text-xl mb-2">🏆</div>
                <h3 className="font-medium text-white mb-1">Onchain Score</h3>
                <p className="text-gray-400">Get your overall onchain activity score</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 