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
      // We'll navigate directly for now, but you could do some validation here
      router.push(`/wrapped/${walletAddress}`);
    } catch (error) {
      console.error('Error:', error);
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <Head>
        <title>Base Wrapped | Your Year on Base</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>
      
      <div className="app-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full h-full flex flex-col items-center justify-center p-4"
        >
          <div className="text-center mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-pixel text-base-blue mb-2 sm:mb-3">Base Wrapped</h1>
            <p className="text-base sm:text-lg font-mono text-white/80">
              Your Year on Base
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="w-full max-w-xs bg-black/30 backdrop-blur-md rounded-xl p-4 sm:p-5 shadow-lg border border-white/10">
            <div className="mb-3 sm:mb-4">
              <label htmlFor="wallet-address" className="block font-mono text-white/80 text-xs sm:text-sm mb-1 sm:mb-2">
                Enter your wallet address:
              </label>
              <input
                id="wallet-address"
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="0x..."
                className="w-full p-2 sm:p-3 bg-black/50 border border-white/20 rounded-lg text-white font-mono text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-base-blue"
              />
            </div>
            
            {error && (
              <p className="text-red-500 font-mono text-xs mb-3 sm:mb-4">{error}</p>
            )}
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 sm:py-3 px-3 sm:px-4 bg-base-blue hover:bg-blue-700 text-white font-pixel text-xs sm:text-sm rounded-lg transition duration-300 flex items-center justify-center"
            >
              {isLoading ? (
                <span className="inline-block animate-spin mr-2">↻</span>
              ) : (
                'View Your Wrapped'
              )}
            </button>
          </form>
          
          <p className="text-center text-white/60 font-mono text-xs mt-3 sm:mt-4 px-2">
            Explore your Base blockchain journey of 2024
          </p>
        </motion.div>
      </div>
    </div>
  );
} 