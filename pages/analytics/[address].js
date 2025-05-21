import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { getWalletData } from '../../lib/blockchain';
import { BackgroundLines } from '../../components/BackgroundLines';
import OnchainHeatmap from '../../components/OnchainHeatmap';
import html2canvas from 'html2canvas';
import { ethers } from 'ethers';
import { 
  ChevronDownIcon, 
  ShareIcon, 
  ArrowLeftIcon, 
  ArrowUpIcon, 
  ArrowDownIcon, 
  BoltIcon 
} from '@heroicons/react/24/outline'; // Using Heroicons for consistent icons
import ChainIcon from '../../components/ChainIcon';

const CHAIN_OPTIONS = [
  { value: 'base', label: 'Base', color: 'bg-blue-600', accent: 'text-blue-400' },
  { value: 'optimism', label: 'Optimism', color: 'bg-red-600', accent: 'text-red-400' },
  { value: 'ethereum', label: 'Ethereum', color: 'bg-purple-600', accent: 'text-purple-400' },
];

const RANKS = {
  base: [
    { min: 0, max: 9, name: 'Base Newborn', emoji: '🍼', description: 'Just getting started on Base!' },
    { min: 10, max: 49, name: 'Base Explorer', emoji: '🧭', description: 'Exploring the Base ecosystem.' },
    { min: 50, max: 99, name: 'Base DeFi Kid', emoji: '🦄', description: 'Diving into DeFi on Base.' },
    { min: 100, max: 499, name: 'Base OG', emoji: '🧙‍♂️', description: 'A true Base veteran.' },
    { min: 500, max: Infinity, name: 'Base Legend', emoji: '👑', description: 'Legendary status achieved!' },
  ],
  optimism: [
    { min: 0, max: 9, name: 'OP Newbie', emoji: '🌱', description: 'Welcome to Optimism!' },
    { min: 10, max: 49, name: 'OP Explorer', emoji: '🚀', description: 'Exploring the OP chain.' },
    { min: 50, max: 99, name: 'OP DeFi Kid', emoji: '💎', description: 'DeFi adventures on Optimism.' },
    { min: 100, max: 499, name: 'OP OG', emoji: '🦸‍♂️', description: 'Optimistic OG.' },
    { min: 500, max: Infinity, name: 'OP Legend', emoji: '🏆', description: 'Legend of Optimism.' },
  ],
  ethereum: [
    { min: 0, max: 19, name: 'ETH Newborn', emoji: '🌱', description: 'Just getting started on Ethereum.' },
    { min: 20, max: 99, name: 'ETH Explorer', emoji: '🧭', description: 'Exploring the Ethereum world.' },
    { min: 100, max: 499, name: 'ETH DeFi Kid', emoji: '🦄', description: 'DeFi enthusiast on Ethereum.' },
    { min: 500, max: 1999, name: 'ETH OG', emoji: '🦍', description: 'Ethereum OG.' },
    { min: 2000, max: Infinity, name: 'ETH Legend', emoji: '👑', description: 'Legendary Ethereum user.' },
  ],
};

function getProviderForChain(chain) {
  if (chain === 'base') {
    return new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org');
  }
  if (chain === 'optimism') {
    return new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_OPTIMISM_MAINNET_RPC_URL || 'https://mainnet.optimism.io');
  }
  if (chain === 'ethereum') {
    return new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_ETH_MAINNET_RPC_URL || 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161');
  }
  return null;
}

function getNativeSymbol(chain) {
  return 'ETH'; // Simplified for the supported chains
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { address, chain } = router.query;
  const initialChain = (chain && CHAIN_OPTIONS.some(opt => opt.value === chain)) ? chain : 'base';
  const [selectedChain, setSelectedChain] = useState(initialChain);
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const resultsRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [streakData, setStreakData] = useState(null);
  const [streakLoading, setStreakLoading] = useState(true);
  const [streakError, setStreakError] = useState(null);

  useEffect(() => {
    if (chain && CHAIN_OPTIONS.some(opt => opt.value === chain) && chain !== selectedChain) {
      setSelectedChain(chain);
    }
  }, [chain]);

  useEffect(() => {
    if (!address || !selectedChain) return;
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

  useEffect(() => {
    if (!walletData || !walletData.address || !selectedChain) return;
    async function fetchStreak() {
      setStreakLoading(true);
      setStreakError(null);
      try {
        const res = await fetch(`/api/streak?address=${walletData.address}&chain=${selectedChain}`);
        const data = await res.json();
        if (!data.success) {
          setStreakError(data.error || 'Failed to fetch streak data');
        } else {
          setStreakData(data);
        }
      } catch (err) {
        setStreakError(err.message || 'Failed to load streak data');
      } finally {
        setStreakLoading(false);
      }
    }
    fetchStreak();
  }, [walletData, selectedChain]);

  const chainTheme = CHAIN_OPTIONS.find(c => c.value === selectedChain) || CHAIN_OPTIONS[0];

  function getRank(chain, txCount) {
    const ranks = RANKS[chain] || RANKS.base;
    return ranks.find(r => txCount >= r.min && txCount <= r.max)?.name || '';
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-2xl sm:text-3xl font-semibold text-white mb-4">Loading Wallet Data</h1>
          <div className="w-12 h-12 border-t-2 border-b-2 border-blue-400 border-solid rounded-full animate-spin mx-auto"></div>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full bg-gray-900/80 backdrop-blur-lg p-8 rounded-xl border border-gray-800"
        >
          <h1 className="text-2xl sm:text-3xl font-semibold text-white mb-4">Error</h1>
          <p className="text-red-400 mb-6">{error}</p>
          <div className="text-gray-400 mb-6 text-sm">
            <p>Possible issues:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>API rate limits</li>
              <li>Invalid wallet address</li>
              <li>Network issues</li>
              <li>Invalid BaseName format</li>
            </ul>
          </div>
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 px-6 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-all duration-300"
          >
            Go Back
          </button>
        </motion.div>
      </div>
    );
  }

  if (!walletData) {
    return null;
  }

  const rank = getRank(selectedChain, walletData.transactionCount);
  const displayAddress = walletData.baseName || `${walletData.address.slice(0, 6)}...${walletData.address.slice(-4)}`;
  let pageTitle = 'Based (Baby)';
  if (walletData.baseName && walletData.baseName.endsWith('.base.eth')) {
    const namePart = walletData.baseName.replace(/\.base\.eth$/, '');
    pageTitle = `Based (${namePart})`;
  } else if (walletData.baseName) {
    pageTitle = `Based (${walletData.baseName})`;
  } else if (walletData.address) {
    pageTitle = `Based (${walletData.address.slice(0, 6)})`;
  }

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

  const handleShare = async () => {
    if (!resultsRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(resultsRef.current, {
        backgroundColor: '#000',
        useCORS: true,
        scale: 2,
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${walletData.baseName || walletData.address}_analytics.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Failed to export image.');
    } finally {
      setDownloading(false);
    }
  };

  const rankObj = (RANKS[selectedChain] || RANKS.base).find(r => walletData.transactionCount >= r.min && walletData.transactionCount <= r.max) || RANKS.base[0];

  return (
    <BackgroundLines
      className="min-h-screen text-white relative"
      svgOptions={{ duration: 15 }}
    >
      <Head>
        <title>{pageTitle}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div className="container mx-auto max-w-[90%] sm:max-w-3xl lg:max-w-5xl px-4 sm:px-6 py-6 sm:py-8 relative z-10 overflow-x-hidden">
        {/* Top Action Row */}
        <div className="flex flex-wrap items-center justify-between mb-6 sm:mb-8 gap-3">
          {/* Network Selector */}
          <div className="relative w-40 sm:w-48">
            <button
              type="button"
              className={`w-full flex items-center justify-between ${chainTheme.color} text-white text-sm sm:text-base font-medium rounded-lg px-3 py-2 border border-gray-700 hover:bg-opacity-90 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm`}
              onClick={() => setDropdownOpen(v => !v)}
              aria-haspopup="listbox"
              aria-expanded={dropdownOpen ? 'true' : 'false'}
            >
              <span className="flex items-center gap-2">
                <ChainIcon chain={selectedChain} size={20} />
                {CHAIN_OPTIONS.find(opt => opt.value === selectedChain)?.label}
              </span>
              <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {dropdownOpen && (
              <motion.ul
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute z-20 mt-2 w-full bg-gray-900 border border-gray-700 rounded-lg shadow-lg overflow-hidden"
              >
                {CHAIN_OPTIONS.map(opt => (
                  <li
                    key={opt.value}
                    className={`flex items-center gap-2 px-3 py-2 cursor-pointer text-sm sm:text-base hover:bg-gray-800 transition-colors ${opt.value === selectedChain ? 'bg-gray-800' : ''}`}
                    onClick={() => { setSelectedChain(opt.value); setDropdownOpen(false); }}
                    role="option"
                    aria-selected={opt.value === selectedChain}
                  >
                    <ChainIcon chain={opt.value} size={18} />
                    {opt.label}
                  </li>
                ))}
              </motion.ul>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              disabled={downloading}
              className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
              title="Share as Image"
              aria-label="Share as Image"
            >
              <ShareIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => router.push('/')}
              className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
              title="Search Another Wallet"
              aria-label="Search Another Wallet"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div ref={resultsRef}>
          {/* Header Section */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-center mb-6 sm:mb-8"
          >
            <div className="flex flex-col items-center justify-center mb-2">
              <span className={`font-pixel text-4xl sm:text-5xl mb-2`}>{rankObj.emoji}</span>
              <span className={`font-pixel text-xl sm:text-2xl mb-2 ${chainTheme.accent}`}>{rankObj.name}</span>
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <h2 className="font-pixel text-sm sm:text-lg text-gray-300">
                {walletData.profileName || displayAddress}
              </h2>
            </div>
            <div className="relative group">
              {!walletData.baseName && (
                <div className="absolute inset-x-0 -bottom-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="bg-gray-800 text-xs p-1 rounded-lg">
                    {walletData.address}
                  </div>
                </div>
              )}
              {walletData.baseName && walletData.baseName.endsWith('.base.eth') && walletData.baseName !== displayAddress && (
                <div className="mt-1 text-blue-400 text-sm sm:text-base">
                  BaseName: <span className="text-white">{walletData.baseName}</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Stats Section */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-4 sm:gap-6 mb-8 sm:mb-10 max-w-full mx-auto"
          >
            {/* Transactions Card */}
            <motion.div 
              variants={itemVariants} 
              className="bg-gray-900/80 backdrop-blur-lg p-4 sm:p-6 rounded-xl border border-gray-800 hover:shadow-lg transition-shadow duration-300"
            >
              <div className="text-center">
                <h2 className="font-pixel text-3xl sm:text-4xl mb-1">
                  {walletData.transactionCount}
                </h2>
                <p className="font-pixel text-lg sm:text-xl mb-2 text-blue-400">
                  Transactions
                </p>
                <p className="font-pixel text-xs sm:text-sm text-gray-400">
                  {walletData.outgoingTransactions} outgoing transactions on {selectedChain.charAt(0).toUpperCase() + selectedChain.slice(1)} blockchain
                </p>
              </div>
            </motion.div>

            {/* Volume Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Incoming ETH Card */}
              <motion.div 
                variants={itemVariants} 
                className="bg-gray-900/80 backdrop-blur-lg p-4 sm:p-5 rounded-xl border border-gray-800 hover:shadow-lg transition-shadow duration-300 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-pixel text-sm sm:text-base text-yellow-400">Incoming ETH</h3>
                    <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <ArrowUpIcon className="w-4 h-4 text-yellow-400" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-baseline justify-between">
                      <span className="font-pixel text-lg sm:text-xl font-bold text-yellow-400">
                        {parseFloat(walletData.ethVolumeIn).toFixed(4)}
                      </span>
                      <span className="font-pixel text-xs sm:text-sm text-yellow-400/70">{getNativeSymbol(selectedChain)}</span>
                    </div>
                    <div className="font-pixel text-xs sm:text-sm text-gray-400">
                      ${walletData.ethVolumeInUsd}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Outgoing ETH Card */}
              <motion.div 
                variants={itemVariants} 
                className="bg-gray-900/80 backdrop-blur-lg p-4 sm:p-5 rounded-xl border border-gray-800 hover:shadow-lg transition-shadow duration-300 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-pixel text-sm sm:text-base text-red-400">Outgoing ETH</h3>
                    <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                      <ArrowDownIcon className="w-4 h-4 text-red-400" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-baseline justify-between">
                      <span className="font-pixel text-lg sm:text-xl font-bold text-red-400">
                        {parseFloat(walletData.ethVolumeOut).toFixed(4)}
                      </span>
                      <span className="font-pixel text-xs sm:text-sm text-red-400/70">{getNativeSymbol(selectedChain)}</span>
                    </div>
                    <div className="font-pixel text-xs sm:text-sm text-gray-400">
                      ${walletData.ethVolumeOutUsd}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Incoming USDC Card */}
              <motion.div 
                variants={itemVariants} 
                className="bg-gray-900/80 backdrop-blur-lg p-4 sm:p-5 rounded-xl border border-gray-800 hover:shadow-lg transition-shadow duration-300 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-pixel text-sm sm:text-base text-blue-400">Incoming USDC</h3>
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <ArrowUpIcon className="w-4 h-4 text-blue-400" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-baseline justify-between">
                      <span className="font-pixel text-lg sm:text-xl font-bold text-blue-400">
                        {parseFloat(walletData.usdcVolumeIn).toFixed(2)}
                      </span>
                      <span className="font-pixel text-xs sm:text-sm text-blue-400/70">USDC</span>
                    </div>
                    <div className="font-pixel text-xs sm:text-sm text-gray-400">
                      ${walletData.usdcVolumeInUsd}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Outgoing USDC Card */}
              <motion.div 
                variants={itemVariants} 
                className="bg-gray-900/80 backdrop-blur-lg p-4 sm:p-5 rounded-xl border border-gray-800 hover:shadow-lg transition-shadow duration-300 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-pixel text-sm sm:text-base text-purple-400">Outgoing USDC</h3>
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <ArrowDownIcon className="w-4 h-4 text-purple-400" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-baseline justify-between">
                      <span className="font-pixel text-lg sm:text-xl font-bold text-purple-400">
                        {parseFloat(walletData.usdcVolumeOut).toFixed(2)}
                      </span>
                      <span className="font-pixel text-xs sm:text-sm text-purple-400/70">USDC</span>
                    </div>
                    <div className="font-pixel text-xs sm:text-sm text-gray-400">
                      ${walletData.usdcVolumeOutUsd}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Gas Card */}
            <motion.div 
              variants={itemVariants} 
              className="bg-gray-900/80 backdrop-blur-lg p-4 sm:p-6 rounded-xl border border-gray-800 hover:shadow-lg transition-shadow duration-300"
            >
              <div className="text-center">
                <h2 className="font-pixel text-3xl sm:text-4xl mb-1">
                  {parseFloat(walletData.gasSpent.ethAmount).toFixed(4)} <span className="text-yellow-400">{getNativeSymbol(selectedChain)}</span>
                </h2>
                <p className="font-pixel text-base sm:text-lg text-gray-400 mb-2">
                  ${walletData.gasSpent.usdAmount}
                </p>
                <p className="font-pixel text-lg sm:text-xl mb-2 flex items-center justify-center gap-2 text-blue-400">
                  <BoltIcon className="w-5 h-5" />
                  Gas Spent
                </p>
                <p className="font-pixel text-xs sm:text-sm text-gray-400">
                  Current ETH price: ${walletData.ethPrice?.toFixed(2) || "N/A"}
                  {walletData.ethPrice && Number(walletData.ethPrice) === 3000 && (
                    <span className="text-red-400 ml-2">(Not live - using fallback)</span>
                  )}
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Heatmap Section */}
        {/* <div className="my-8 sm:my-10 min-h-[220px] sm:min-h-[260px] flex items-center justify-center">
          {streakLoading ? (
            <div className="text-center text-gray-400 text-sm sm:text-base w-full">Loading onchain streak...</div>
          ) : streakError ? (
            <div className="text-center text-red-400 text-sm sm:text-base w-full">{streakError}</div>
          ) : streakData ? (
            <OnchainHeatmap
              dailyActivity={streakData.dailyActivity}
              currentStreak={streakData.currentStreak}
              longestStreak={streakData.longestStreak}
              totalActiveDays={streakData.totalActiveDays}
            />
          ) : null}
        </div> */}
      </div>
    </BackgroundLines>
  );
}