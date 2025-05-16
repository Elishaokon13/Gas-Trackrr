import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { BackgroundLines } from '../components/BackgroundLines';

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
    <BackgroundLines 
      className="min-h-screen flex flex-col items-center justify-center overflow-hidden"
      svgOptions={{ duration: 15 }}
    >
      <Head>
        <title>Based Baby | Your Base Wrapped Experience</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>
      
      <main className="w-full max-w-md sm:max-w-lg px-4 relative z-10">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full flex flex-col items-center justify-center"
        >
          <div className="text-center mb-8">
            <motion.h1 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-4xl sm:text-5xl font-pixel text-white mb-4 tracking-wider text-gradient animate-float"
            >
              Based Baby
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-base text-gray-300 max-w-xs mx-auto"
            >
              View your transaction data on Base in style
            </motion.p>
          </div>
          
          <motion.form 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            onSubmit={handleSubmit} 
            className="w-full glass-card p-8"
          >
            <div className="mb-6">
              <label htmlFor="wallet-address" className="block text-white font-pixel text-sm mb-3 text-gradient">
                ENTER WALLET ADDRESS
              </label>
              <input
                id="wallet-address"
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="0x..."
                className="w-full p-4 bg-black/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-base-blue transition-all duration-300"
              />
            </div>
            
            {error && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-xs mb-4"
              >
                {error}
              </motion.p>
            )}
            
            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-6 bg-base-blue hover:bg-blue-700 text-white font-pixel text-sm rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-blue-900/20"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <span className="inline-block animate-spin mr-2">↻</span>
              ) : (
                'GET YOUR WRAPPED'
              )}
            </motion.button>
          </motion.form>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="mt-8 text-center"
          >
            <p className="text-sm text-gray-400">
              View your onchain activity on <span className="font-pixel text-base-blue">Base</span>
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Powered by Basescan API • {new Date().getFullYear()}
            </p>
          </motion.div>
        </motion.div>
      </main>
    </BackgroundLines>
  );
} 