import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { getWalletData } from '../../lib/blockchain';
import { BackgroundLines } from '../../components/BackgroundLines';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, AreaChart, Area } from 'recharts';
import ChainIcon from '../../components/ChainIcon';

const CHAIN_OPTIONS = [
  { value: 'base', label: 'Base', color: 'bg-base-blue', accent: 'text-base-blue' },
  { value: 'optimism', label: 'Optimism', color: 'bg-red-600', accent: 'text-red-400' },
  { value: 'ethereum', label: 'Ethereum', color: 'bg-purple-700', accent: 'text-purple-400' },
];

const RANKS = {
  base: [
    { min: 0, max: 9, name: 'Base Newborn' },
    { min: 10, max: 49, name: 'Base Explorer' },
    { min: 50, max: 99, name: 'Base DeFi Kid' },
    { min: 100, max: 499, name: 'Base OG' },
    { min: 500, max: Infinity, name: 'Base Legend' },
  ],
  optimism: [
    { min: 0, max: 9, name: 'OP Newbie' },
    { min: 10, max: 49, name: 'OP Explorer' },
    { min: 50, max: 99, name: 'OP DeFi Kid' },
    { min: 100, max: 499, name: 'OP OG' },
    { min: 500, max: Infinity, name: 'OP Legend' },
  ],
  ethereum: [
    { min: 0, max: 19, name: 'ETH Newborn' },
    { min: 20, max: 99, name: 'ETH Explorer' },
    { min: 100, max: 499, name: 'ETH DeFi Kid' },
    { min: 500, max: 1999, name: 'ETH OG' },
    { min: 2000, max: Infinity, name: 'ETH Legend' },
  ],
};

export default function AnalyticsPage() {
  const router = useRouter();
  const { address } = router.query;
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedChain, setSelectedChain] = useState('base');
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState(null);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().toLocaleString('default', { month: 'short' }).toUpperCase();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Fetch data when address or chain is available
  useEffect(() => {
    if (!address) return;
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const decodedAddress = decodeURIComponent(address);
        const data = await getWalletData(decodedAddress, selectedChain);
        if (!data.success) {
          setError(data.error || 'Failed to fetch wallet data');
        } else {
          setWalletData(data);
        }
      } catch (err) {
        setError(err.message || 'Failed to load wallet data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [address, selectedChain]);

  // Fetch historical balances for the last 30 days
  useEffect(() => {
    if (!walletData?.address) return;
    async function fetchHistory() {
      setHistoryLoading(true);
      setHistoryError(null);
      try {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 29);
        const startStr = start.toISOString().slice(0, 10);
        const endStr = end.toISOString().slice(0, 10);
        const res = await fetch(`/api/historical-balances?address=${walletData.address}&start=${startStr}&end=${endStr}`);
        const json = await res.json();
        if (json.success) {
          setHistory(json.data);
        } else {
          setHistoryError(json.error || 'Failed to fetch history');
        }
      } catch (err) {
        setHistoryError(err.message || 'Failed to fetch history');
      } finally {
        setHistoryLoading(false);
      }
    }
    fetchHistory();
  }, [walletData?.address]);

  // Theme colors based on chain
  const chainTheme = CHAIN_OPTIONS.find(c => c.value === selectedChain) || CHAIN_OPTIONS[0];

  // Chain-specific rank system
  function getRank(chain, txCount) {
    const ranks = RANKS[chain] || RANKS.base;
    return ranks.find(r => txCount >= r.min && txCount <= r.max)?.name || '';
  }

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
          {/* <p className="text-gray-400 mb-6">Fetching data from Base blockchain...</p> */}
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
              <li>The wallet address or BaseName may not exist on Base</li>
              <li>There may be network issues</li>
              <li>Invalid BaseName format (should be name.base or name.base.eth)</li>
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

  // Calculate rank after we know walletData exists
  const rank = getRank(selectedChain, walletData.transactionCount);

  // Format the wallet address for display
  const displayAddress = walletData.baseName || `${walletData.address.slice(0, 6)}...${walletData.address.slice(-4)}`;
  // Always compute pageTitle from the latest walletData
  let pageTitle = 'Based (Baby)';
  if (walletData.baseName && walletData.baseName.endsWith('.base.eth')) {
    const namePart = walletData.baseName.replace(/\.base\.eth$/, '');
    pageTitle = `Based (${namePart})`;
  } else if (walletData.baseName) {
    pageTitle = `Based (${walletData.baseName})`;
  } else if (walletData.address) {
    pageTitle = `Based (${walletData.address.slice(0, 6)})`;
  }

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
        <title>{pageTitle}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      
      <div className="container mx-auto max-w-4xl px-4 py-8 md:py-12 relative z-10 content-container">
        {/* Chain Selector Dropdown */}
        <div className="flex justify-center mb-8">
          <div className="relative inline-block w-56">
            <button
              type="button"
              className={`w-full flex items-center justify-between font-pixel text-lg rounded-lg px-4 py-2 border-2 border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 ${chainTheme.color} text-white shadow transition`}
              onClick={() => setDropdownOpen(v => !v)}
              aria-haspopup="listbox"
              aria-expanded={dropdownOpen ? 'true' : 'false'}
            >
              <span className="flex items-center gap-2">
                <ChainIcon chain={selectedChain} size={22} />
                {CHAIN_OPTIONS.find(opt => opt.value === selectedChain)?.label}
              </span>
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {dropdownOpen && (
              <ul className="absolute z-10 mt-2 w-full bg-black border border-gray-700 rounded-lg shadow-lg">
                {CHAIN_OPTIONS.map(opt => (
                  <li
                    key={opt.value}
                    className={`flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-gray-800 font-pixel text-lg ${opt.value === selectedChain ? 'bg-gray-900' : ''}`}
                    onClick={() => { setSelectedChain(opt.value); setDropdownOpen(false); }}
                    role="option"
                    aria-selected={opt.value === selectedChain}
                  >
                    <ChainIcon chain={opt.value} size={20} />
                    {opt.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center mb-8 md:mb-12"
        >
          <h1 className={`text-4xl sm:text-5xl md:text-6xl font-pixel mb-6 tracking-wider ${chainTheme.accent} animate-float`}>
            {rank}
          </h1>
          <div className="relative group">
            <h2 className="text-xl sm:text-2xl font-pixel text-gray-300">
              {displayAddress}
            </h2>
            {!walletData.baseName && (
              <div className="absolute inset-x-0 -bottom-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="bg-black/80 text-xs p-2 rounded-lg">
                  {walletData.address}
                </div>
              </div>
            )}
            {/* Show BaseName if found and user entered an address */}
            {walletData.baseName && walletData.baseName.endsWith('.base.eth') && walletData.baseName !== displayAddress && (
              <div className="mt-2 text-base-blue font-pixel text-sm">
                BaseName: <span className="text-white">{walletData.baseName}</span>
              </div>
            )}
          </div>
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
              <p className="text-sm font-pixel text-gray-400">
                {walletData.outgoingTransactions} outgoing transactions<br />on Base blockchain
              </p>
            </div>
          </motion.div>

          {/* Volume Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            {/* Incoming ETH Card */}
            <motion.div variants={itemVariants} className="glass-card p-6 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-pixel text-lg text-yellow-400">Incoming ETH</h3>
                  <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold font-pixel text-yellow-400">
                      {parseFloat(walletData.ethVolumeIn).toFixed(4)}
                    </span>
                    <span className="text-sm font-pixel text-yellow-400/70">ETH</span>
                  </div>
                  <div className="text-sm font-pixel text-gray-400">
                    ${walletData.ethVolumeInUsd}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Outgoing ETH Card */}
            <motion.div variants={itemVariants} className="glass-card p-6 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-pixel text-lg text-red-400">Outgoing ETH</h3>
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold font-pixel text-red-400">
                      {parseFloat(walletData.ethVolumeOut).toFixed(4)}
                    </span>
                    <span className="text-sm font-pixel text-red-400/70">ETH</span>
                  </div>
                  <div className="text-sm font-pixel text-gray-400">
                    ${walletData.ethVolumeOutUsd}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Incoming USDC Card */}
            <motion.div variants={itemVariants} className="glass-card p-6 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-pixel text-lg text-blue-400">Incoming USDC</h3>
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold font-pixel text-blue-400">
                      {parseFloat(walletData.usdcVolumeIn).toFixed(2)}
                    </span>
                    <span className="text-sm font-pixel text-blue-400/70">USDC</span>
                  </div>
                  <div className="text-sm font-pixel text-gray-400">
                    ${walletData.usdcVolumeInUsd}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Outgoing USDC Card */}
            <motion.div variants={itemVariants} className="glass-card p-6 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-pixel text-lg text-purple-400">Outgoing USDC</h3>
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold font-pixel  text-purple-400">
                      {parseFloat(walletData.usdcVolumeOut).toFixed(2)}
                    </span>
                    <span className="text-sm font-pixel text-purple-400/70">USDC</span>
                  </div>
                  <div className="text-sm font-pixel text-gray-400">
                    ${walletData.usdcVolumeOutUsd}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

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
              <p className="text-sm font-pixel text-gray-400">
                Current ETH price: ${walletData.ethPrice?.toFixed(2) || "N/A"}
                {walletData.ethPrice && Number(walletData.ethPrice) === 3000 && (
                  <span className="text-red-400 ml-2">(Not live - using fallback)</span>
                )}
              </p>
            </div>
          </motion.div>
        </motion.div>
        
        {/* Historical Balance Chart */}
        {/*
        <div className="mt-12">
          <h2 className="font-pixel text-2xl mb-4 text-gradient text-center">Portfolio Value (USD, 30d)</h2>
          {historyLoading ? (
            <div className="text-center text-gray-400">Loading chart...</div>
          ) : historyError ? (
            <div className="text-center text-red-400">{historyError}</div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={history} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="usdGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2226" />
                <XAxis dataKey="date" tick={{ fontFamily: 'monospace', fontSize: 12, fill: '#a3e635' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontFamily: 'monospace', fontSize: 12, fill: '#a3e635' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ background: '#18181b', border: 'none', borderRadius: 8, color: '#fff' }} labelStyle={{ color: '#a3e635' }} />
                <Area type="monotone" dataKey="usd" stroke="#a78bfa" fillOpacity={1} fill="url(#usdGradient)" strokeWidth={3} name="Portfolio USD" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        */}
        
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