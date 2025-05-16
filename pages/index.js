import { useState } from 'react';
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
        <title>Base Transaction Tracker | Gas & Transaction Count</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>
      
      <div className="w-full max-w-md p-4">
        <div className="w-full flex flex-col items-center justify-center">
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Base Transaction Tracker
            </h1>
            <p className="text-base text-gray-400">
              Check transaction count and gas spent
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="w-full bg-gray-900 rounded-lg p-6 shadow-lg">
            <div className="mb-4">
              <label htmlFor="wallet-address" className="block text-white text-sm mb-2">
                Enter wallet address:
              </label>
              <input
                id="wallet-address"
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="0x..."
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {error && (
              <p className="text-red-500 text-xs mb-4">{error}</p>
            )}
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition duration-300 flex items-center justify-center"
            >
              {isLoading ? (
                <span className="inline-block animate-spin mr-2">↻</span>
              ) : (
                'Check Wallet'
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center text-gray-500 text-sm">
            <p>
              This tool fetches data from the Base blockchain using Basescan API
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 