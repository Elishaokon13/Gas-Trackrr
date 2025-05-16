import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { getWalletData } from '../../lib/blockchain';

export default function AnalyticsPage() {
  const router = useRouter();
  const { address } = router.query;
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
          <h1 className="text-2xl text-white mb-4">Loading Wallet Data</h1>
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
          <h1 className="text-2xl text-white mb-4">Error</h1>
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

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <Head>
        <title>Wallet Data for {displayAddress}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div className="max-w-md w-full bg-gray-900 rounded-lg p-6 shadow-xl">
        <h1 className="text-2xl font-bold mb-6 text-center">Wallet Stats</h1>
        
        <div className="mb-4">
          <h2 className="text-xl font-medium mb-2">Address</h2>
          <p className="bg-gray-800 p-3 rounded overflow-auto break-all">
            {walletData.address}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-gray-400 text-sm mb-1">TOTAL TRANSACTIONS</h3>
            <p className="text-3xl font-bold">{walletData.transactionCount}</p>
            <p className="text-gray-400 text-xs mt-1">
              ({walletData.outgoingTransactions} outgoing)
            </p>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-gray-400 text-sm mb-1">GAS SPENT</h3>
            <p className="text-3xl font-bold">{walletData.gasSpent.ethAmount} ETH</p>
            <p className="text-gray-400 text-xs mt-1">
              ({parseFloat(walletData.gasSpent.ethAmount).toFixed(8)} ETH)
            </p>
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <h3 className="text-gray-400 text-sm mb-1">DATA SOURCE</h3>
          <p className="text-sm">
            Data from <a href="https://basescan.org" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Basescan API</a>
          </p>
        </div>

        <div className="text-center">
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-blue-600 rounded-full hover:bg-blue-700 transition-colors"
          >
            Check Another Wallet
          </button>
        </div>
      </div>
    </div>
  );
} 