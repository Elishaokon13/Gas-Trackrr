import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { getTransactionCount, calculateGasSpent, calculateVolume } from '../../lib/blockchain';

export default function Wrapped() {
  const router = useRouter();
  const { address } = router.query;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!address) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch data sequentially to better handle errors
        const txCount = await getTransactionCount(address);
        const gasSpent = await calculateGasSpent(address);
        const volume = await calculateVolume(address);

        setData({
          txCount,
          gasSpent,
          volume
        });
      } catch (err) {
        console.error('Error fetching data:', err);
        let errorMessage = 'Failed to fetch wallet data. ';
        
        if (err.message.includes('API key')) {
          errorMessage += 'API key is not configured. Please check your environment variables.';
        } else if (err.message.includes('timeout')) {
          errorMessage += 'Request timed out. Please try again.';
        } else if (err.message.includes('NOTOK')) {
          errorMessage += 'API error: ' + err.message;
        } else {
          errorMessage += 'Please try again.';
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [address]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">Loading wallet data...</div>
          <div className="w-8 h-8 border-t-2 border-blue-500 border-solid rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-blue-900 flex items-center justify-center">
        <div className="max-w-md mx-auto p-8 text-center">
          <div className="text-red-400 text-xl mb-4">{error}</div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/')}
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium hover:from-blue-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            Try Another Address
          </motion.button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-blue-900">
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto space-y-8"
        >
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              Base Analytics
            </h1>
            <p className="mt-4 text-gray-300 text-sm md:text-base">
              {address}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="backdrop-blur-lg bg-white/10 rounded-2xl p-8 shadow-xl"
            >
              <h2 className="text-2xl font-bold text-white mb-4">Transactions</h2>
              <div className="text-4xl font-bold text-blue-400">
                {data.txCount.toLocaleString()}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="backdrop-blur-lg bg-white/10 rounded-2xl p-8 shadow-xl"
            >
              <h2 className="text-2xl font-bold text-white mb-4">Gas Spent</h2>
              <div className="text-4xl font-bold text-purple-400">
                {data.gasSpent.toFixed(4)} ETH
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="backdrop-blur-lg bg-white/10 rounded-2xl p-8 shadow-xl"
            >
              <h2 className="text-2xl font-bold text-white mb-4">Incoming Volume</h2>
              <div className="text-4xl font-bold text-green-400">
                {data.volume.incoming.toFixed(4)} ETH
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="backdrop-blur-lg bg-white/10 rounded-2xl p-8 shadow-xl"
            >
              <h2 className="text-2xl font-bold text-white mb-4">Outgoing Volume</h2>
              <div className="text-4xl font-bold text-red-400">
                {data.volume.outgoing.toFixed(4)} ETH
              </div>
            </motion.div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/')}
            className="mt-8 w-full py-3 px-6 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium hover:from-blue-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            Check Another Address
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
} 