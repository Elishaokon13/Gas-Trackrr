import { ethers } from 'ethers';
import axios from 'axios';
import { serverLog } from '../pages/api/logs';

// Base mainnet RPC URL with fallback to public endpoint 
const BASE_RPC_URL = process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org';
const ETH_MAINNET_RPC_URL = process.env.NEXT_PUBLIC_ETH_MAINNET_RPC_URL || 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161';

// Basescan API key (get one from https://basescan.org/myapikey)
// Using a placeholder - in production, use environment variable
const BASESCAN_API_KEY = process.env.NEXT_PUBLIC_BASESCAN_API_KEY || '';
const BASESCAN_API_URL = 'https://api.basescan.org/api';

// Replace the custom logger function with the serverLog function
const logMessage = (type, message, data = null) => {
  // If we're running in a browser context, just console.log
  if (typeof window !== 'undefined') {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${type.toUpperCase()}]`;
    
    console.log(`${prefix} ${message}`);
    if (data) {
      console.log(`${prefix} DATA:`, typeof data === 'object' ? 
        JSON.stringify(data).substring(0, 500) : data);
    }
    return;
  }
  
  // If we're in a server context, use the serverLog function
  return serverLog(type, message, data);
};

// Initialize ethers provider with increased timeout and retry options
export const getProvider = () => {
  const rpcUrl = getCustomRpcUrl();
  logMessage('info', `Using RPC URL: ${rpcUrl.replace(/\/v[23]\/.*$/, '/v2/***')}`);
  
  const options = {
    timeout: 120000, // 2 minute timeout
    allowGzip: true,
    keepAlive: true,
  };
  return new ethers.providers.JsonRpcProvider(rpcUrl, 8453, options);
};

// Initialize Ethereum mainnet provider for ENS resolution
export const getEthMainnetProvider = () => {
  const options = {
    timeout: 120000,
    allowGzip: true,
    keepAlive: true,
  };
  return new ethers.providers.JsonRpcProvider(ETH_MAINNET_RPC_URL, 1, options);
};

// Get ENS name for an address
export const getEnsName = async (address) => {
  try {
    logMessage('info', `Resolving ENS name for ${address}...`);
    const provider = getEthMainnetProvider();
    const ensName = await provider.lookupAddress(address);
    
    if (ensName) {
      logMessage('info', `Resolved ENS name: ${ensName}`);
      return ensName;
    }
    
    return null;
  } catch (error) {
    logMessage('error', `Error resolving ENS name: ${error.message}`);
    return null;
  }
};

// Use Alchemy or Infura if API keys are provided
const getCustomRpcUrl = () => {
  if (process.env.NEXT_PUBLIC_ALCHEMY_API_KEY) {
    return `https://base-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`;
  }
  if (process.env.NEXT_PUBLIC_INFURA_API_KEY) {
    return `https://base-mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY}`;
  }
  return BASE_RPC_URL;
};

// Get all transactions for an address with improved error handling
export const getTransactions = async (address) => {
  const provider = getProvider();
  
  try {
    logMessage('info', `Getting transactions for ${address} on Base...`);
    
    // Get the latest block number
    const latestBlock = await provider.getBlockNumber();
    logMessage('info', `Latest block: ${latestBlock}`);
    
    // Scan a larger range to get more comprehensive data
    const fromBlock = Math.max(0, latestBlock - 50000);
    logMessage('info', `Scanning from block ${fromBlock} to ${latestBlock}`);
    
    // Get transaction history
    try {
      const history = await provider.getHistory(address, fromBlock, latestBlock);
      logMessage('info', `Found ${history.length} transactions`);
      return history;
    } catch (error) {
      logMessage('error', 'Initial transaction fetch failed, retrying with smaller range:', error.message);
      
      // If full range fails, try with last 1,000 blocks
      const smallerFromBlock = Math.max(0, latestBlock - 1000);
      const history = await provider.getHistory(address, smallerFromBlock, latestBlock);
      logMessage('info', `Found ${history.length} transactions with reduced range`);
      return history;
    }
  } catch (error) {
    logMessage('error', `Error fetching transactions: ${error.message}`);
    // Return empty array instead of throwing to avoid breaking the app
    return [];
  }
};

// Calculate gas used and cost with improved error handling
export const calculateGasMetrics = async (transactions) => {
  let totalGasUsed = ethers.BigNumber.from(0);
  let totalGasCost = ethers.BigNumber.from(0);
  const provider = getProvider();
  
  logMessage('gas', `Calculating gas metrics for ${transactions.length} transactions...`);
  
  for (const tx of transactions) {
    try {
      // Get transaction receipt
      const receipt = await provider.getTransactionReceipt(tx.hash);
      
      if (receipt && receipt.gasUsed) {
        totalGasUsed = totalGasUsed.add(receipt.gasUsed);
        const gasCost = receipt.gasUsed.mul(tx.gasPrice || ethers.BigNumber.from(0));
        totalGasCost = totalGasCost.add(gasCost);
      }
    } catch (error) {
      logMessage('warning', `Could not get receipt for tx ${tx.hash}:`, error.message);
    }
  }
  
  // Get current ETH price in USD
  let ethPrice = 4000; // Default ETH price
  try {
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
      { timeout: 5000 }
    );
    if (response.data?.ethereum?.usd) {
      ethPrice = response.data.ethereum.usd;
    }
  } catch (error) {
    logMessage('warning', `Could not fetch ETH price, using default: ${ethPrice}`);
  }
  
  const formattedEth = ethers.utils.formatEther(totalGasCost);
  const usdValue = parseFloat(formattedEth) * ethPrice;
  
  logMessage('gas', `Total gas used: ${totalGasUsed.toString()}`);
  logMessage('gas', `Total gas cost (ETH): ${formattedEth}`);
  logMessage('gas', `Total gas cost (USD): $${usdValue.toFixed(2)}`);
  
  return {
    gasUsed: totalGasUsed.toString(),
    gasCostEth: formattedEth,
    gasCostUsd: usdValue.toFixed(2),
  };
};

// Get onchain score from Talent Protocol (simulated for now)
export const getOnchainScore = async (address) => {
  logMessage('info', `Getting onchain score for ${address}`);
  
  try {
    // In a real implementation, this would call the Talent Protocol API
    // For now, we'll generate a score based on transaction count and gas spent
    const transactions = await getTransactions(address);
    const gasMetrics = await calculateGasMetrics(transactions);
    
    // Calculate a score between 0-100 based on activity
    // This is a placeholder implementation
    const transactionScore = Math.min(transactions.length / 2, 50); // Max 50 points from transaction count
    const gasScore = Math.min(parseFloat(gasMetrics.gasCostEth) * 25, 50); // Max 50 points from gas spending
    
    const totalScore = Math.round(transactionScore + gasScore);
    const cappedScore = Math.min(totalScore, 100);
    
    // Calculate trading volume (simulated)
    const tradingVolume = parseFloat(gasMetrics.gasCostEth) * 200; // Placeholder calculation
    
    logMessage('info', `Calculated onchain score: ${cappedScore}`);
    
    return {
      score: cappedScore,
      tradingVolume: tradingVolume.toFixed(2),
      coins: transactions.length > 100 ? 3 : transactions.length > 50 ? 2 : 1,
    };
  } catch (error) {
    logMessage('error', `Error calculating onchain score: ${error.message}`);
    return {
      score: 0,
      tradingVolume: '0.00',
      coins: 0
    };
  }
};

// Get all the wrapped data for an address
export const getWrappedData = async (address) => {
  try {
    logMessage('info', `Getting analytics data for ${address}`);
    const startTime = Date.now();
    
    // Normalize address to checksum format
    const normalizedAddress = ethers.utils.getAddress(address);
    
    // Get ENS name
    const ensName = await getEnsName(normalizedAddress);
    
    // Get transactions
    const transactions = await getTransactions(normalizedAddress);
    
    // If no transactions, return basic data
    if (transactions.length === 0) {
      logMessage('warning', 'No transactions found, returning default data');
      return {
        address: normalizedAddress,
        ensName: ensName || null,
        transactionCount: 0,
        gasMetrics: {
          gasUsed: '0',
          gasCostEth: '0.00',
          gasCostUsd: '0.00',
        },
        onchainScore: {
          score: 0,
          tradingVolume: '0.00',
          coins: 0
        }
      };
    }
    
    // Process in parallel for better performance
    const [gasMetrics, onchainScore] = await Promise.all([
      calculateGasMetrics(transactions),
      getOnchainScore(normalizedAddress)
    ]);
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    logMessage('info', `Completed data processing in ${duration} seconds`);
    
    return {
      address: normalizedAddress,
      ensName: ensName || null,
      transactionCount: transactions.length,
      gasMetrics,
      onchainScore
    };
  } catch (error) {
    logMessage('error', `Error getting analytics data: ${error.message}`);
    throw error;
  }
};

/**
 * Get transaction count using the proxy API (faster)
 * @param {string} address - Wallet address
 * @returns {Promise<number>} - Transaction count
 */
async function getTransactionCount(address) {
  console.log(`Getting transaction count for ${address}`);
  
  try {
    const response = await axios.get(BASESCAN_API_URL, {
      params: {
        module: 'proxy',
        action: 'eth_getTransactionCount',
        address: address,
        tag: 'latest',
        apikey: BASESCAN_API_KEY
      }
    });
    
    console.log('Transaction count response:', response.data);
    
    if (response.data.result) {
      // Result is in hex, convert to decimal
      const count = parseInt(response.data.result, 16);
      console.log(`Transaction count: ${count}`);
      return count;
    }
    
    console.log('No transaction count result:', response.data);
    return 0;
  } catch (error) {
    console.error('Error getting transaction count:', error.message);
    return 0;
  }
}

/**
 * Get transaction history for gas calculation
 * @param {string} address - Wallet address
 * @returns {Promise<Array>} - Transaction list
 */
async function getTransactionHistory(address) {
  console.log(`Getting transaction history for ${address}`);
  
  try {
    const response = await axios.get(BASESCAN_API_URL, {
      params: {
        module: 'account',
        action: 'txlist',
        address: address,
        startblock: '0',
        endblock: '99999999',
        sort: 'asc',
        apikey: BASESCAN_API_KEY
      }
    });
    
    if (response.data.status === '1' && Array.isArray(response.data.result)) {
      console.log(`Found ${response.data.result.length} transactions in history`);
      return response.data.result;
    }
    
    console.log('No transaction history or error:', response.data.message);
    return [];
  } catch (error) {
    console.error('Error getting transaction history:', error.message);
    return [];
  }
}

/**
 * Calculate total transaction volume and gas spent from transaction history
 * @param {Array} transactions - Transaction history
 * @param {string} address - Wallet address
 * @returns {Object} - Volume and gas information
 */
function calculateVolumeAndGas(transactions, address) {
  console.log(`Calculating volume and gas for ${transactions.length} transactions`);
  
  let totalGasWei = ethers.BigNumber.from(0);
  let totalVolumeWei = ethers.BigNumber.from(0);
  let outgoingCount = 0;
  
  // Normalize address for comparison
  const normalizedAddress = address.toLowerCase();
  
  for (const tx of transactions) {
    // Only count transactions where this address is the sender
    if (tx.from && tx.from.toLowerCase() === normalizedAddress) {
      outgoingCount++;
      
      try {
        // Calculate gas cost
        if (tx.gasUsed && tx.gasPrice) {
          const gasPrice = ethers.BigNumber.from(tx.gasPrice || '0');
          const gasUsed = ethers.BigNumber.from(tx.gasUsed || '0');
          const gasCost = gasPrice.mul(gasUsed);
          
          totalGasWei = totalGasWei.add(gasCost);
        }
        
        // Calculate transaction value/volume (excluding gas)
        if (tx.value) {
          const txValue = ethers.BigNumber.from(tx.value || '0');
          totalVolumeWei = totalVolumeWei.add(txValue);
        }
      } catch (err) {
        console.warn(`Error processing tx ${tx.hash}: ${err.message}`);
      }
    }
  }
  
  const totalGasEth = ethers.utils.formatEther(totalGasWei);
  const totalVolumeEth = ethers.utils.formatEther(totalVolumeWei);
  
  console.log(`Total gas spent: ${totalGasEth} ETH`);
  console.log(`Total volume: ${totalVolumeEth} ETH (${outgoingCount} outgoing txs)`);
  
  return {
    gasEthAmount: totalGasEth,
    gasWeiAmount: totalGasWei.toString(),
    volumeEthAmount: totalVolumeEth,
    volumeWeiAmount: totalVolumeWei.toString(),
    outgoingCount
  };
}

/**
 * Get ETH price in USD from CoinGecko API
 * @returns {Promise<number>} - ETH price in USD
 */
async function getEthPriceUSD() {
  try {
    console.log('Fetching ETH price from CoinGecko...');
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
      { timeout: 5000 }
    );
    
    if (response.data?.ethereum?.usd) {
      const price = response.data.ethereum.usd;
      console.log(`Current ETH price: $${price} USD`);
      return price;
    }
    
    console.log('Could not get ETH price, using default');
    return 3000; // Default fallback price
  } catch (error) {
    console.error('Error fetching ETH price:', error.message);
    return 3000; // Default fallback price on error
  }
}

/**
 * Get wallet data including transaction count, volume, and gas spent
 * @param {string} address - Wallet address
 * @returns {Promise<Object>} - Wallet data
 */
export const getWalletData = async (address) => {
  try {
    console.log(`Fetching data for address: ${address}`);
    
    // Normalize address to checksum format
    const normalizedAddress = ethers.utils.getAddress(address);
    
    // Get transaction count first (fast)
    const txCount = await getTransactionCount(normalizedAddress);
    
    // Get ETH price
    const ethPrice = await getEthPriceUSD();
    
    // If no transactions, return early
    if (txCount === 0) {
      console.log('No transactions found for this address');
      return {
        address: normalizedAddress,
        transactionCount: 0,
        outgoingTransactions: 0,
        gasSpent: {
          ethAmount: '0',
          weiAmount: '0',
          usdAmount: '0.00'
        },
        volume: {
          ethAmount: '0',
          weiAmount: '0',
          usdAmount: '0.00'
        },
        ethPrice,
        success: true
      };
    }
    
    // Get transaction history for calculations
    const txHistory = await getTransactionHistory(normalizedAddress);
    
    // Calculate gas spent and volume
    const stats = calculateVolumeAndGas(txHistory, normalizedAddress);
    
    // Calculate USD values
    const gasUsdAmount = (parseFloat(stats.gasEthAmount) * ethPrice).toFixed(2);
    const volumeUsdAmount = (parseFloat(stats.volumeEthAmount) * ethPrice).toFixed(2);
    
    console.log(`Gas spent in USD: $${gasUsdAmount} (ETH price: $${ethPrice})`);
    console.log(`Volume in USD: $${volumeUsdAmount}`);
    
    return {
      address: normalizedAddress,
      transactionCount: txHistory.length || txCount, // Use history length if available, otherwise use count
      outgoingTransactions: stats.outgoingCount,
      gasSpent: {
        ethAmount: stats.gasEthAmount,
        weiAmount: stats.gasWeiAmount,
        usdAmount: gasUsdAmount
      },
      volume: {
        ethAmount: stats.volumeEthAmount,
        weiAmount: stats.volumeWeiAmount,
        usdAmount: volumeUsdAmount
      },
      ethPrice,
      success: true
    };
  } catch (error) {
    console.error('Error fetching wallet data:', error);
    
    // Return error information
    return {
      address,
      error: error.message,
      success: false
    };
  }
}; 