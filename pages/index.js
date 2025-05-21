import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { BackgroundLines } from '../components/BackgroundLines';
import ChainIcon from '../components/ChainIcon';

const CHAIN_OPTIONS = [
  { value: 'base', label: 'Base', placeholder: '0x... or yourname.base.eth' },
  { value: 'optimism', label: 'Optimism', placeholder: '0x... or yourname.op' },
  { value: 'ethereum', label: 'Ethereum', placeholder: '0x... or yourname.eth' },
  // { value: 'assetchain', label: 'AssetChain', placeholder: '0x... (address only)' },
];

export default function Home() {
  const [walletAddress, setWalletAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedChain, setSelectedChain] = useState('base');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();

  const getPlaceholder = () => CHAIN_OPTIONS.find(opt => opt.value === selectedChain)?.placeholder || '0x...';

  const validateInput = (input) => {
    if (/^0x[a-fA-F0-9]{40}$/.test(input)) return true;
    if (selectedChain === 'base' && /^[a-zA-Z0-9]+\.base\.eth$/.test(input)) return true;
    if (selectedChain === 'optimism' && /^[a-zA-Z0-9]+\.op$/.test(input)) return true;
    if (selectedChain === 'ethereum' && /^[a-zA-Z0-9]+\.eth$/.test(input)) return true;
    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateInput(walletAddress)) {
      setError('Please enter a valid address or name for the selected chain');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      router.push(`/analytics/${walletAddress}?chain=${selectedChain}`);
    } catch (error) {
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
        <title>Base Gas Trackrr | Track your gas on Base</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>
      
      <main className="w-full max-w-xs font-pixel sm:max-w-md md:max-w-lg lg:max-w-2xl px-1 sm:px-4 md:px-8 relative z-10">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full flex flex-col items-center justify-center"
        >
          <div className="text-center mb-4 sm:mb-8">
            <motion.h1 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-pixel text-white mb-2 sm:mb-4 tracking-wider text-gradient animate-float"
            >
              GAS TRACKRR
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-xs xs:text-sm sm:text-lg text-gray-300 max-w-[90vw] sm:max-w-sm md:max-w-md mx-auto"
            >
              View your transaction data on Base in style
            </motion.p>
          </div>
          
          <motion.form 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            onSubmit={handleSubmit} 
            className="w-full glass-card p-2 xs:p-3 sm:p-6 md:p-8"
          >
            {/* Chain Selector Dropdown */}
            <div className="flex justify-center mb-3 sm:mb-6">
              <div className="relative inline-block w-full max-w-[220px] xs:max-w-xs sm:max-w-sm">
                <button
                  type="button"
                  className={`w-full flex items-center justify-between font-pixel text-xs xs:text-base sm:text-lg rounded-lg px-2 xs:px-3 sm:px-4 py-2 border-2 border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-base-blue text-white shadow transition`}
                  onClick={() => setDropdownOpen(v => !v)}
                  aria-haspopup="listbox"
                  aria-expanded={dropdownOpen ? 'true' : 'false'}
                >
                  <span className="flex items-center gap-2">
                    <ChainIcon chain={selectedChain} size={18} />
                    {CHAIN_OPTIONS.find(opt => opt.value === selectedChain)?.label}
                  </span>
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {dropdownOpen && (
                  <ul className="absolute z-10 mt-2 w-full bg-black border border-gray-700 rounded-lg shadow-lg">
                    {CHAIN_OPTIONS.map(opt => (
                      <li
                        key={opt.value}
                        className={`flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-gray-800 font-pixel text-xs xs:text-base sm:text-lg ${opt.value === selectedChain ? 'bg-gray-900' : ''}`}
                        onClick={() => { setSelectedChain(opt.value); setDropdownOpen(false); }}
                        role="option"
                        aria-selected={opt.value === selectedChain}
                      >
                        {opt.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="mb-3 sm:mb-6 relative">
              <label htmlFor="wallet-address" className="block text-white font-pixel text-xs sm:text-sm mb-1 sm:mb-3 text-gradient">
                ENTER WALLET OR NAME
              </label>
              <div className="relative">
                <span className="absolute left-2 xs:left-3 sm:left-4 top-1/2 transform -translate-y-1/2 flex items-center justify-center h-6 w-6">
                  <ChainIcon chain={selectedChain} size={16} />
                </span>
                <input
                  id="wallet-address"
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder={getPlaceholder()}
                  className="w-full p-2 xs:p-3 sm:p-4 pl-8 xs:pl-10 sm:pl-12 bg-black/50 border border-gray-700 rounded-lg text-white text-xs xs:text-sm focus:outline-none focus:ring-2 focus:ring-base-blue transition-all duration-300"
                />
              </div>
            </div>
            
            {error && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-xs mb-2 sm:mb-4"
              >
                {error}
              </motion.p>
            )}
            
            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 xs:py-3 sm:py-4 px-2 xs:px-4 sm:px-6 bg-base-blue hover:bg-blue-700 text-white font-pixel text-xs sm:text-sm rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-blue-900/20"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <span className="inline-block font-pixel animate-spin mr-2">↻</span>
              ) : (
                'FETCH DATA'
              )}
            </motion.button>
          </motion.form>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="mt-4 sm:mt-8 text-center"
          >
            <p className="text-xs sm:text-sm text-gray-400">
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