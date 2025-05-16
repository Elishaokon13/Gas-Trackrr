import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { getWrappedData } from '../../lib/blockchain';

export default function AnalyticsPage() {
  const router = useRouter();
  const { address } = router.query;
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data when address is available
  useEffect(() => {
    if (!address) return;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        const data = await getWrappedData(address);
        console.log('Fetched analytics data:', data);
        
        setAnalyticsData(data);
      } catch (err) {
        console.error('Error fetching analytics data:', err);
        setError('Failed to load wallet analytics. Please try again.');
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
          <h1 className="text-2xl text-white mb-4">Loading Analytics</h1>
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
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 text-white"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No data available
  if (!analyticsData) {
    return null;
  }

  // Get wallet display name (ENS or truncated address)
  const displayName = analyticsData.ensName || 
    `${analyticsData.address.slice(0, 6)}...${analyticsData.address.slice(-4)}`;

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <Head>
        <title>Wallet Analytics | {displayName}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div className="max-w-5xl mx-auto">
        <div className="border-b border-gray-800 pb-4 mb-8">
          <h1 className="text-3xl text-green-400 font-bold">Creator Analytics</h1>
        </div>

        {/* Profile Section */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <div className="flex items-start md:items-center flex-col md:flex-row">
            <div className="flex items-center flex-1">
              <div className="w-16 h-16 rounded-full bg-gray-700 overflow-hidden mr-4">
                <div className="w-full h-full flex items-center justify-center text-gray-500 text-xl">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold">{displayName}</h2>
                <p className="text-gray-400 text-sm">
                  {analyticsData.address}
                </p>
              </div>
            </div>
            <div className="mt-4 md:mt-0 md:text-right">
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-gray-400 text-xs uppercase mb-1">COINS</h3>
                <p className="text-3xl font-bold">{analyticsData.onchainScore.coins}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Earnings Summary */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6">Earnings Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <h3 className="text-gray-400 text-xs uppercase mb-1">TOTAL EARNINGS</h3>
              <p className="text-3xl font-bold text-green-400">
                ${analyticsData.gasMetrics.gasCostUsd}
              </p>
            </div>
            <div>
              <h3 className="text-gray-400 text-xs uppercase mb-1">TRADING VOLUME</h3>
              <p className="text-3xl font-bold">
                ${analyticsData.onchainScore.tradingVolume}
              </p>
            </div>
            <div>
              <h3 className="text-gray-400 text-xs uppercase mb-1">TXNS</h3>
              <p className="text-3xl font-bold">
                {analyticsData.transactionCount}
              </p>
            </div>
            <div>
              <h3 className="text-gray-400 text-xs uppercase mb-1">AVG PER TXN</h3>
              <p className="text-3xl font-bold">
                ${analyticsData.transactionCount > 0 
                  ? (parseFloat(analyticsData.gasMetrics.gasCostUsd) / analyticsData.transactionCount).toFixed(2) 
                  : "0.00"}
              </p>
            </div>
          </div>
        </div>

        {/* Gas Metrics */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6">Gas Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-gray-400 text-xs uppercase mb-1">TOTAL GAS USED</h3>
              <p className="text-xl font-bold">
                {analyticsData.gasMetrics.gasUsed} wei
              </p>
            </div>
            <div>
              <h3 className="text-gray-400 text-xs uppercase mb-1">TOTAL GAS COST</h3>
              <p className="text-xl font-bold">
                {analyticsData.gasMetrics.gasCostEth} ETH 
                <span className="text-gray-400 ml-2">
                  (${analyticsData.gasMetrics.gasCostUsd})
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Onchain Score */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Onchain Score</h2>
          <div className="h-10 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-green-400" 
              style={{ width: `${analyticsData.onchainScore.score}%` }}
            ></div>
          </div>
          <div className="mt-2 text-right">
            <span className="text-lg font-bold">{analyticsData.onchainScore.score}/100</span>
          </div>
          <div className="mt-6 text-center text-gray-400">
            <p>Score based on transaction activity and gas usage on Base blockchain</p>
          </div>
        </div>
      </div>
    </div>
  );
} 