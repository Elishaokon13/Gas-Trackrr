import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion } from 'framer-motion';
import ParticleBackground from '../components/ParticleBackground';

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-black overflow-hidden relative">
      <Head>
        <title>Based Baby | Your Base Wrapped Experience</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>
      
      {/* Particle background */}
      <ParticleBackground />
      
      <div className="w-full max-w-md p-4 relative z-10">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full flex flex-col items-center justify-center"
        >
          <div className="text-center mb-6">
            <motion.h1 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-4xl sm:text-5xl font-pixel text-white mb-4 tracking-wider"
            >
              Based Baby
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-base text-gray-400 max-w-xs mx-auto"
            >
              See your transaction count and gas on Base Wrapped
            </motion.p>
          </div>
          
          <motion.form 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            onSubmit={handleSubmit} 
            className="w-full bg-gray-900/50 backdrop-blur-sm rounded-lg p-6 shadow-lg border border-gray-800"
          >
            <div className="mb-4">
              <label htmlFor="wallet-address" className="block text-white font-pixel text-sm mb-2">
                ENTER WALLET ADDRESS:
              </label>
              <input
                id="wallet-address"
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="0x..."
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-base-blue"
              />
            </div>
            
            {error && (
              <p className="text-red-500 text-xs mb-4">{error}</p>
            )}
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-base-blue hover:bg-blue-700 text-white font-pixel text-sm rounded-lg transition duration-300 flex items-center justify-center"
            >
              {isLoading ? (
                <span className="inline-block animate-spin mr-2">↻</span>
              ) : (
                'GET YOUR WRAPPED'
              )}
            </button>
          </motion.form>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="mt-6 text-center text-gray-500 text-sm"
          >
            <p>
              View your Base onchain activity in <span className="font-pixel text-base-blue">2024</span>
            </p>
          </motion.div>
        </motion.div>
      </div>
      
      {/* Decorative elements */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute bottom-0 w-full h-20 bg-base-blue/20 backdrop-blur-sm"
      >
        <div className="w-full h-full flex items-center justify-center">
          <span className="font-pixel text-xl text-white mx-4">2023</span>
          <span className="text-yellow-300 text-2xl">✨</span>
          <span className="font-pixel text-xl text-white mx-4">2024</span>
        </div>
      </motion.div>
    </div>
  );
} 