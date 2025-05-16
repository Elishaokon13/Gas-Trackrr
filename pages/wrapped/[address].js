import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { getWrappedData } from '../../lib/blockchain';
import ParticleBackground from '../../components/ParticleBackground';
import BlueWave from '../../components/BlueWave';
import Slide, { SlideHeading, StatDisplay, SlideParagraph } from '../../components/Slide';

const slides = [
  'welcome',
  'transactions',
  'gas',
  'gas-expenses',
  'protocols',
  'nfts',
  'busiest-month',
  'summary'
];

export default function WrappedPage() {
  const router = useRouter();
  const { address } = router.query;
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [wrappedData, setWrappedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Handle next slide navigation
  const handleNextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  // Fetch the wrapped data when address is available
  useEffect(() => {
    if (!address) return;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        // Use real blockchain data instead of mock data
        console.log(`Fetching data for address: ${address}`);
        const data = await getWrappedData(address);
        console.log('Fetched data:', data);
        
        setWrappedData(data);
      } catch (err) {
        console.error('Error fetching wrapped data:', err);
        setError('Failed to load your Base activity. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [address]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Head>
          <title>Loading | Base Wrapped</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        </Head>
        <div className="app-container">
          <ParticleBackground />
          <div className="h-full flex flex-col items-center justify-center">
            <div className="text-center px-4">
              <h1 className="text-xl sm:text-2xl font-pixel text-white mb-2 sm:mb-3">Loading Your Base Wrapped</h1>
              <p className="text-white/70 font-mono text-xs sm:text-sm">Analyzing your on-chain activity...</p>
              <div className="mt-3 sm:mt-5 w-8 h-8 sm:w-10 sm:h-10 border-t-2 sm:border-t-3 border-blue-500 border-solid rounded-full animate-spin mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Head>
          <title>Error | Base Wrapped</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        </Head>
        <div className="app-container">
          <ParticleBackground />
          <div className="h-full flex flex-col items-center justify-center">
            <div className="text-center max-w-xs mx-auto px-4">
              <h1 className="text-xl sm:text-2xl font-pixel text-white mb-2 sm:mb-3">Oops!</h1>
              <p className="text-white/70 font-mono text-xs sm:text-sm mb-3 sm:mb-5">{error}</p>
              <button
                onClick={() => router.push('/')}
                className="font-pixel text-xs sm:text-sm text-white bg-base-blue px-4 py-2 sm:px-5 sm:py-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No data available
  if (!wrappedData) {
    return null;
  }

  // Render the current slide
  const renderSlide = () => {
    const currentSlide = slides[currentSlideIndex];

    switch (currentSlide) {
      case 'welcome':
        return (
          <Slide onNext={handleNextSlide}>
            <SlideHeading>Based Baby</SlideHeading>
            <SlideParagraph>
              Let's explore your journey on Base in 2024
            </SlideParagraph>
            <StatDisplay
              value={wrappedData.address.slice(0, 6) + '...' + wrappedData.address.slice(-4)}
              label="Your wallet"
              custom={3}
            />
          </Slide>
        );
      
      case 'transactions':
        return (
          <Slide onNext={handleNextSlide}>
            <SlideHeading>{wrappedData.transactionCount}</SlideHeading>
            <SlideParagraph>
              Total Transactions on Base
            </SlideParagraph>
            <StatDisplay
              value="Txns"
              label="just dipping your toes into the Based waters"
              custom={3}
            />
          </Slide>
        );
      
      case 'gas':
        return (
          <Slide onNext={handleNextSlide}>
            <SlideHeading>{wrappedData.gasMetrics.gasCostEth} ETH</SlideHeading>
            <SlideParagraph>
              Total Gas Spent in 2024
            </SlideParagraph>
            <StatDisplay
              value="on Gas"
              label="efficient enough to stay Based and keep moving fast!"
              custom={3}
            />
          </Slide>
        );
      
      case 'gas-expenses':
        // Function to download CSV
        const downloadGasExpenseCSV = () => {
          // Create a CSV blob
          const blob = new Blob([wrappedData.gasExpenses.csv], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          
          // Create a link to download it
          const link = document.createElement('a');
          link.setAttribute('href', url);
          link.setAttribute('download', `base_gas_expenses_${wrappedData.address.slice(0, 6)}.csv`);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        };
        
        return (
          <Slide onNext={handleNextSlide}>
            <SlideHeading>Gas Expenses</SlideHeading>
            <SlideParagraph>
              Monthly breakdown of your gas expenses
            </SlideParagraph>
            
            <div className="w-full max-h-[40vh] overflow-y-auto px-2 flex flex-col items-center space-y-2 pb-16 sm:pb-20">
              <table className="w-full max-w-sm text-white font-mono text-xs sm:text-sm">
                <thead className="text-base-blue">
                  <tr>
                    <th className="text-left py-2">Month</th>
                    <th className="text-right py-2">ETH</th>
                    <th className="text-right py-2">USD</th>
                  </tr>
                </thead>
                <tbody>
                  {wrappedData.gasExpenses.monthlyGasExpenses.map(expense => (
                    parseFloat(expense.ethCost) > 0 ? (
                      <tr key={expense.month} className="border-t border-white/10">
                        <td className="py-2">{expense.monthName}</td>
                        <td className="text-right py-2">{parseFloat(expense.ethCost).toFixed(4)}</td>
                        <td className="text-right py-2">${expense.usdCost}</td>
                      </tr>
                    ) : null
                  ))}
                  <tr className="border-t border-white/20 font-bold text-base-blue">
                    <td className="py-2">Total</td>
                    <td className="text-right py-2">{parseFloat(wrappedData.gasExpenses.totalGasEth).toFixed(4)}</td>
                    <td className="text-right py-2">${wrappedData.gasExpenses.totalGasUsd}</td>
                  </tr>
                </tbody>
              </table>
              
              <button 
                onClick={downloadGasExpenseCSV}
                className="mt-4 bg-base-blue/80 hover:bg-base-blue px-4 py-2 rounded text-white font-pixel text-xs sm:text-sm flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>
            </div>
          </Slide>
        );
      
      case 'protocols':
        return (
          <Slide onNext={handleNextSlide}>
            <SlideHeading>Top Protocols</SlideHeading>
            <SlideParagraph>
              Your favorite places on Base
            </SlideParagraph>
            <div className="w-full max-h-[40vh] overflow-y-auto px-2 flex flex-col items-center space-y-2 pb-16 sm:pb-20">
              {wrappedData.protocolInteractions.length > 0 ? (
                wrappedData.protocolInteractions.map((protocol, index) => (
                  <StatDisplay
                    key={protocol.address}
                    value={protocol.name}
                    label={`${protocol.count} interactions`}
                    custom={index + 2}
                  />
                ))
              ) : (
                <StatDisplay
                  value="No protocols found"
                  label="Try interacting with some Base protocols"
                  custom={2}
                />
              )}
            </div>
          </Slide>
        );
      
      case 'nfts':
        return (
          <Slide onNext={handleNextSlide}>
            <SlideHeading>{wrappedData.nftActivity.nftsMinted} NFTs</SlideHeading>
            <SlideParagraph>
              Minted in 2024
            </SlideParagraph>
            <StatDisplay
              value="Minted"
              label="your collection's growing faster than gas spikes during a bull run"
              custom={3}
            />
            {wrappedData.nftActivity.zoraRewards !== '0' && (
              <StatDisplay
                value={`${wrappedData.nftActivity.zoraRewards} ETH`}
                label="earned in Zora rewards"
                custom={4}
              />
            )}
          </Slide>
        );
      
      case 'busiest-month':
        return (
          <Slide onNext={handleNextSlide}>
            <SlideHeading>{wrappedData.monthlyActivity.busiestMonthName}</SlideHeading>
            <SlideParagraph>
              Your busiest month on Base
            </SlideParagraph>
            <StatDisplay
              value={`${wrappedData.monthlyActivity.busiestMonthCount} Transactions`}
              label="your Base grind started to show some serious momentum!"
              custom={3}
            />
          </Slide>
        );
      
      case 'summary':
        return (
          <Slide isLast={true}>
            <SlideHeading>Based Baby</SlideHeading>
            <SlideParagraph>
              Looks like Jesse Pollak can't keep up with your {wrappedData.transactionCount} transactions on Base Wrapped in 2024! With a total volume of $1.8k, you're more of a minnow than a whale. Let's step up those onchain moves in 2025!
            </SlideParagraph>
            <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full px-2 sm:px-3 mt-1 sm:mt-2">
              <StatDisplay
                value={`${wrappedData.transactionCount} Txns`}
                label="just dipping your toes into the Based waters"
                custom={3}
              />
              <StatDisplay
                value={`${wrappedData.nftActivity.nftsMinted} NFTs`}
                label="Minted"
                custom={3.5}
              />
              <StatDisplay
                value={wrappedData.monthlyActivity.busiestMonthName || "2024"}
                label="your Base grind started to show some serious momentum!"
                custom={4}
              />
              <StatDisplay
                value={`${wrappedData.gasMetrics.gasCostEth} eth`}
                label="on Gas"
                custom={4.5}
              />
            </div>
            <BlueWave />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 1 }}
              className="absolute bottom-8 sm:bottom-14 w-full z-10"
            >
              <div className="text-center">
                <button
                  onClick={() => router.push('/')}
                  className="font-pixel text-xs sm:text-sm text-white bg-blue-700 px-4 py-1.5 sm:px-5 sm:py-2 rounded-full shadow-lg hover:bg-blue-800 transition-colors"
                >
                  Try Another Wallet
                </button>
              </div>
            </motion.div>
          </Slide>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Head>
        <title>Your Base Wrapped | 2024 Review</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>
      <div className="app-container">
        <ParticleBackground />
        {renderSlide()}
      </div>
    </div>
  );
} 