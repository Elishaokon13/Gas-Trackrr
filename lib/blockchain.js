import { ethers } from 'ethers';
import axios from 'axios';
import { serverLog } from '../pages/api/logs';
import { namehash } from 'ethers/lib/utils';
import { Alchemy, Utils } from 'alchemy-sdk';
import EthDater from 'ethereum-block-by-date';

// Base mainnet RPC URL with fallback to public endpoint 
const BASE_RPC_URL = process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org';
const ETH_MAINNET_RPC_URL = process.env.NEXT_PUBLIC_ETH_MAINNET_RPC_URL || 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161';

// Basescan API key (get one from https://basescan.org/myapikey)
// Using a placeholder - in production, use environment variable
const BASESCAN_API_KEY = process.env.NEXT_PUBLIC_BASESCAN_API_KEY || '';
const BASESCAN_API_URL = 'https://api.basescan.org/api';

// USDC contract addresses
const USDC_ADDRESSES = {
  base: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
  ethereum: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  optimism: '0x0b2c639c533813f4aa9d7837caf62653d097ff85',
  assetchain: '0x2B7C1342Cc64add10B2a79C8f9767d2667DE64B2',
};

// API URLs and keys
const SCAN_CONFIG = {
  base: {
    apiUrl: 'https://api.basescan.org/api',
    apiKey: process.env.NEXT_PUBLIC_BASESCAN_API_KEY || '',
  },
  ethereum: {
    apiUrl: 'https://api.etherscan.io/api',
    apiKey: process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY || '',
  },
  optimism: {
    apiUrl: 'https://api-optimistic.etherscan.io/api',
    apiKey: process.env.NEXT_PUBLIC_OPTIMISM_ETHERSCAN_API_KEY || '',
  },
  assetchain: {
    apiUrl: 'https://scan.assetchain.org/api/v2',
    apiKey: '',
  },
};

// BaseName contract address on Base mainnet
const BASENAME_CONTRACT = '0x03c4738Ee98aE44591e1A4A4F3CaB6641d95DD9a';

// BaseName resolver contract address on Base mainnet
const BASENAME_RESOLVER = '0xC6d566A56A1aFf6508b41f6c90ff131615583BCD';
const BASENAME_RESOLVER_ABI = [
  "function addr(bytes32 node) view returns (address)"
];

// ENS Universal Resolver ABI (minimal)
const ENS_RESOLVER_ABI = [
  "function resolve(bytes name, bytes data) view returns (bytes, address)",
  "function resolve(bytes32 node, string name) view returns (address)"
];

// Optimism Name Service ABI (minimal)
const OP_NS_ABI = [
  "function resolve(string name) view returns (address)"
];

// AssetChain official RPC
const ASSETCHAIN_RPC_URL = 'https://mainnet-rpc.assetchain.org';

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
 * Get transaction count using the scan API
 */
async function getTransactionCountScan(address, scan) {
  try {
    const response = await axios.get(scan.apiUrl, {
      params: {
        module: 'proxy',
        action: 'eth_getTransactionCount',
        address: address,
        tag: 'latest',
        apikey: scan.apiKey
      }
    });
    if (response.data.result) {
      return parseInt(response.data.result, 16);
    }
    return 0;
  } catch (error) {
    return 0;
  }
}

/**
 * Get transaction history for gas calculation using the scan API
 */
async function getTransactionHistoryScan(address, scan, usdcAddress) {
  try {
    const response = await axios.get(scan.apiUrl, {
      params: {
        module: 'account',
        action: 'txlist',
        address: address,
        startblock: '0',
        endblock: '99999999',
        sort: 'asc',
        apikey: scan.apiKey
      }
    });
    // USDC transfers
    const tokenResponse = await axios.get(scan.apiUrl, {
      params: {
        module: 'account',
        action: 'tokentx',
        address: address,
        contractaddress: usdcAddress,
        startblock: '0',
        endblock: '99999999',
        sort: 'asc',
        apikey: scan.apiKey
      }
    });
    let transactions = [];
    if (response.data.status === '1' && Array.isArray(response.data.result)) {
      transactions = response.data.result;
    }
    if (tokenResponse.data.status === '1' && Array.isArray(tokenResponse.data.result)) {
      const tokenTransfers = tokenResponse.data.result;
      const formattedTransfers = tokenTransfers.map(transfer => ({
        ...transfer,
        logs: [{
          address: usdcAddress,
          topics: [
            '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
            '0x000000000000000000000000' + transfer.from.slice(2),
            '0x000000000000000000000000' + transfer.to.slice(2),
          ],
          data: transfer.value
        }]
      }));
      transactions = [...transactions, ...formattedTransfers];
    }
    return transactions;
  } catch (error) {
    return [];
  }
}

/**
 * Calculate incoming/outgoing ETH and USDC volume from transaction history
 * @param {Array} transactions - Transaction history
 * @param {string} address - Wallet address
 * @returns {Object} - Volume and gas information
 */
function calculateDetailedVolumes(transactions, address) {
  let ethInWei = ethers.BigNumber.from(0);
  let ethOutWei = ethers.BigNumber.from(0);
  let usdcIn = ethers.BigNumber.from(0);
  let usdcOut = ethers.BigNumber.from(0);
  let totalGasWei = ethers.BigNumber.from(0);
  let outgoingCount = 0;
  const normalizedAddress = address.toLowerCase();

  for (const tx of transactions) {
    // ETH incoming/outgoing
    if (tx.from && tx.from.toLowerCase() === normalizedAddress) {
      outgoingCount++;
      if (tx.value) {
        ethOutWei = ethOutWei.add(ethers.BigNumber.from(tx.value));
      }
      // Gas
      if (tx.gasUsed && tx.gasPrice) {
        const gasPrice = ethers.BigNumber.from(tx.gasPrice || '0');
        const gasUsed = ethers.BigNumber.from(tx.gasUsed || '0');
        const gasCost = gasPrice.mul(gasUsed);
        totalGasWei = totalGasWei.add(gasCost);
      }
    }
    if (tx.to && tx.to.toLowerCase() === normalizedAddress) {
      if (tx.value) {
        ethInWei = ethInWei.add(ethers.BigNumber.from(tx.value));
      }
    }
    // USDC incoming/outgoing (parse logs)
    if (Array.isArray(tx.logs)) {
      for (const log of tx.logs) {
        if (
          log.address &&
          log.address.toLowerCase() === USDC_ADDRESSES.base.toLowerCase() &&
          log.topics &&
          log.topics.length >= 3
        ) {
          // ERC20 Transfer event: topics[0] is event signature, [1] is from, [2] is to
          const from = '0x' + log.topics[1].slice(26).toLowerCase();
          const to = '0x' + log.topics[2].slice(26).toLowerCase();
          const value = ethers.BigNumber.from(log.data);
          if (to === normalizedAddress) {
            usdcIn = usdcIn.add(value);
          }
          if (from === normalizedAddress) {
            usdcOut = usdcOut.add(value);
          }
        }
      }
    }
  }

  return {
    ethIn: ethers.utils.formatEther(ethInWei),
    ethOut: ethers.utils.formatEther(ethOutWei),
    usdcIn: ethers.utils.formatUnits(usdcIn, 6),
    usdcOut: ethers.utils.formatUnits(usdcOut, 6),
    gasEthAmount: ethers.utils.formatEther(totalGasWei),
    gasWeiAmount: totalGasWei.toString(),
    outgoingCount
  };
}

let cachedEthPrice = null;
let cachedEthPriceTimestamp = 0;
const CACHE_DURATION_MS = 60 * 1000; // 1 minute

async function getEthPriceUSD() {
  const now = Date.now();
  if (cachedEthPrice && (now - cachedEthPriceTimestamp < CACHE_DURATION_MS)) {
    return cachedEthPrice;
  }
  try {
    console.log('Fetching ETH price from CoinGecko...');
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
      { timeout: 5000 }
    );
    if (response.data?.ethereum?.usd) {
      cachedEthPrice = response.data.ethereum.usd;
      cachedEthPriceTimestamp = now;
      return cachedEthPrice;
    }
    throw new Error('No live ETH price from CoinGecko');
  } catch (error) {
    console.error('Error fetching ETH price:', error.message);
    throw new Error('No live ETH price from CoinGecko');
  }
}

function isValidBaseName(name) {
  // Only support .base.eth names
  return /^[a-zA-Z0-9]+\.base\.eth$/.test(name);
}

async function resolveBaseName(baseName) {
  try {
    if (!isValidBaseName(baseName)) {
      console.log('Invalid BaseName format');
      return null;
    }
    const provider = getProvider();
    const contract = new ethers.Contract(BASENAME_RESOLVER, BASENAME_RESOLVER_ABI, provider);
    const node = namehash(baseName); // baseName should be like 'jesse.base.eth'
    const address = await contract.addr(node);
    if (address && address !== ethers.constants.AddressZero) {
      return address;
    }
    return null;
  } catch (error) {
    console.error('Error resolving BaseName:', error.message);
    return null;
  }
}

/**
 * Get BaseName for an address
 * @param {string} address - The address to look up
 * @returns {Promise<string|null>} - The BaseName or null if not found
 */
async function getBaseName(address) {
  try {
    console.log(`Looking up BaseName for address: ${address}`);
    
    const response = await axios.get(BASESCAN_API_URL, {
      params: {
        module: 'account',
        action: 'tokennft',
        address: address,
        contractaddress: BASENAME_CONTRACT,
        apikey: BASESCAN_API_KEY
      }
    });

    if (response.data.status === '1' && Array.isArray(response.data.result)) {
      const baseNames = response.data.result;
      if (baseNames.length > 0) {
        // Get the first BaseName (most recent)
        const baseName = baseNames[0].tokenName;
        console.log(`Found BaseName: ${baseName}`);
        return baseName;
      }
    }
    
    console.log('No BaseName found for address');
    return null;
  } catch (error) {
    console.error('Error getting BaseName:', error.message);
    return null;
  }
}

// Helper: resolve ENS name to address (Ethereum)
async function resolveEnsName(name) {
  try {
    const provider = new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161');
    // Use the standard ethers.js ENS resolution
    const address = await provider.resolveName(name);
    if (address && address !== ethers.constants.AddressZero) {
      return address;
    }
    return null;
  } catch (error) {
    console.error('ENS resolution error:', error);
    return null;
  }
}

// Helper: resolve OP name to address (Optimism)
async function resolveOpName(name) {
  try {
    // Use Optimism mainnet RPC
    const provider = new ethers.providers.JsonRpcProvider('https://mainnet.optimism.io');
    
    // Use Optimism Name Service contract
    const opNameService = new ethers.Contract(
      '0x6f2E655dE0063cE0974a5511006d30366A964B8d', // Optimism Name Service address
      OP_NS_ABI,
      provider
    );

    // Call resolve
    const resolvedAddress = await opNameService.resolve(name);
    return resolvedAddress;
  } catch (error) {
    console.error('OP name resolution error:', error);
    return null;
  }
}

// AssetChain transaction fetcher
async function getAssetChainTransactions(address) {
  try {
    const url = `https://scan.assetchain.org/api/v2/addresses/${address}/transactions?filter=to%20%7C%20from`;
    const response = await axios.get(url);
    if (response.data && Array.isArray(response.data.items)) {
      return response.data.items;
    }
    return [];
  } catch (error) {
    console.error('Error fetching AssetChain transactions:', error.message);
    return [];
  }
}

// AssetChain ethers provider
function getAssetChainProvider() {
  return new ethers.providers.JsonRpcProvider(ASSETCHAIN_RPC_URL, 42420);
}

/**
 * Get wallet data including transaction count, volume, and gas spent
 * @param {string} addressOrName - Wallet address or BaseName
 * @param {string} chain - 'base' | 'ethereum' | 'optimism'
 * @returns {Promise<Object>} - Wallet data
 */
export const getWalletData = async (addressOrName, chain = 'base') => {
  try {
    const scan = SCAN_CONFIG[chain] || SCAN_CONFIG.base;
    const usdcAddress = USDC_ADDRESSES[chain] || USDC_ADDRESSES.base;
    console.log(`Fetching data for: ${addressOrName} on chain: ${chain}`);
    
    let normalizedAddress;
    let baseName = null;
    
    // AssetChain: only address, no name resolution
    if (chain === 'assetchain') {
      if (!addressOrName || typeof addressOrName !== 'string') {
        throw new Error('Address must be a non-empty string');
      }
      if (!/^0x[a-fA-F0-9]{40}$/.test(addressOrName)) {
        throw new Error('Invalid address format: Must be a 42-character hex string starting with 0x');
      }
      try {
        normalizedAddress = ethers.utils.getAddress(addressOrName);
      } catch (error) {
        throw new Error(`Invalid address format: ${error.message}`);
      }
      // Fetch transactions from AssetChain
      const txs = await getAssetChainTransactions(normalizedAddress);
      console.log('AssetChain txs:', JSON.stringify(txs, null, 2));
      let rwaIn = ethers.BigNumber.from(0);
      let rwaOut = ethers.BigNumber.from(0);
      let usdcIn = ethers.BigNumber.from(0);
      let usdcOut = ethers.BigNumber.from(0);
      let totalGas = ethers.BigNumber.from(0);
      const normalized = normalizedAddress.toLowerCase();
      for (const tx of txs) {
        // RWA (native token)
        if (typeof tx.to === 'string' && tx.to.toLowerCase() === normalized) {
          if (tx.value) rwaIn = rwaIn.add(ethers.BigNumber.from(tx.value));
        }
        if (typeof tx.from === 'string' && tx.from.toLowerCase() === normalized) {
          if (tx.value) rwaOut = rwaOut.add(ethers.BigNumber.from(tx.value));
          // Gas spent (only for outgoing txs)
          if (tx.gasUsed && tx.gasPrice) {
            try {
              const gasUsed = ethers.BigNumber.from(tx.gasUsed);
              const gasPrice = ethers.BigNumber.from(tx.gasPrice);
              totalGas = totalGas.add(gasUsed.mul(gasPrice));
            } catch {}
          }
        }
        // USDC (ERC20 transfers)
        if (Array.isArray(tx.logs)) {
          for (const log of tx.logs) {
            if (
              log.address &&
              typeof log.address === 'string' &&
              log.address.toLowerCase() === usdcAddress &&
              Array.isArray(log.topics) &&
              log.topics.length >= 3
            ) {
              // ERC20 Transfer event: topics[0] is event signature, [1] is from, [2] is to
              const from = '0x' + log.topics[1].slice(26).toLowerCase();
              const to = '0x' + log.topics[2].slice(26).toLowerCase();
              const value = ethers.BigNumber.from(log.data);
              if (to === normalized) usdcIn = usdcIn.add(value);
              if (from === normalized) usdcOut = usdcOut.add(value);
            }
          }
        }
      }
      // USDC price is always 1
      const usdcPrice = 1;
      // Format values
      const rwaInEth = ethers.utils.formatEther(rwaIn);
      const rwaOutEth = ethers.utils.formatEther(rwaOut);
      const usdcInVal = ethers.utils.formatUnits(usdcIn, 6);
      const usdcOutVal = ethers.utils.formatUnits(usdcOut, 6);
      const gasEth = ethers.utils.formatEther(totalGas);
      return {
        address: normalizedAddress,
        baseName: null,
        transactionCount: txs.length,
        outgoingTransactions: txs.filter(
          tx => typeof tx.from === 'string' && tx.from.toLowerCase() === normalized
        ).length,
        ethVolumeIn: rwaInEth,
        ethVolumeOut: rwaOutEth,
        usdcVolumeIn: usdcInVal,
        usdcVolumeOut: usdcOutVal,
        ethVolumeInUsd: 'N/A',
        ethVolumeOutUsd: 'N/A',
        usdcVolumeInUsd: usdcInVal,
        usdcVolumeOutUsd: usdcOutVal,
        gasSpent: {
          ethAmount: gasEth,
          weiAmount: totalGas.toString(),
          usdAmount: 'N/A'
        },
        ethPrice: null,
        usdcPrice: usdcPrice,
        success: true
      };
    }
    // Name resolution per chain
    if (chain === 'ethereum' && typeof addressOrName === 'string' && addressOrName.endsWith('.eth')) {
      console.log('Resolving ENS name:', addressOrName);
      normalizedAddress = await resolveEnsName(addressOrName);
      baseName = addressOrName;
      if (!normalizedAddress) throw new Error('Invalid or unregistered ENS name');
    } else if (chain === 'optimism' && typeof addressOrName === 'string' && addressOrName.endsWith('.op')) {
      console.log('Resolving OP name:', addressOrName);
      normalizedAddress = await resolveOpName(addressOrName);
      baseName = addressOrName;
      if (!normalizedAddress) throw new Error('Invalid or unregistered OP name');
    } else if (chain === 'base' && isValidBaseName(addressOrName)) {
      console.log('Resolving BaseName:', addressOrName);
      baseName = addressOrName;
      normalizedAddress = await resolveBaseName(baseName);
      if (!normalizedAddress) throw new Error('Invalid or unregistered BaseName');
    } else {
      // Address validation
      if (!addressOrName || typeof addressOrName !== 'string') {
        throw new Error('Address or name must be a non-empty string');
      }
      
      // Check if it's a valid hex string
      if (!/^0x[a-fA-F0-9]{40}$/.test(addressOrName)) {
        throw new Error('Invalid address format: Must be a 42-character hex string starting with 0x');
      }
      
      try {
        normalizedAddress = ethers.utils.getAddress(addressOrName);
        console.log('Normalized address:', normalizedAddress);
      } catch (error) {
        console.error('Address normalization error:', error);
        throw new Error(`Invalid address format: ${error.message}`);
      }
      
      // Try to get BaseName for the address (optional, only for Base)
      if (chain === 'base') {
        baseName = await getBaseName(normalizedAddress);
        if (baseName) console.log('Found BaseName:', baseName);
      }
    }
    
    // Get transaction count first (fast)
    const txCount = await getTransactionCountScan(normalizedAddress, scan);
    
    // Get ETH price
    const ethPrice = await getEthPriceUSD();
    
    // Get USDC price in USD
    let usdcPrice = 1;
    try {
      const usdcResp = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=usd');
      if (usdcResp.data?.['usd-coin']?.usd) usdcPrice = usdcResp.data['usd-coin'].usd;
    } catch {}
    
    // If no transactions, return early
    if (txCount === 0) {
      console.log('No transactions found for this address');
      return {
        address: normalizedAddress,
        baseName,
        transactionCount: 0,
        outgoingTransactions: 0,
        ethVolumeIn: '0',
        ethVolumeOut: '0',
        usdcVolumeIn: '0',
        usdcVolumeOut: '0',
        ethVolumeInUsd: '0.00',
        ethVolumeOutUsd: '0.00',
        usdcVolumeInUsd: '0.00',
        usdcVolumeOutUsd: '0.00',
        gasSpent: {
          ethAmount: '0',
          weiAmount: '0',
          usdAmount: '0.00'
        },
        ethPrice,
        usdcPrice,
        success: true
      };
    }
    
    // Get transaction history for calculations
    const txHistory = await getTransactionHistoryScan(normalizedAddress, scan, usdcAddress);
    
    // Calculate gas spent and volume
    const stats = calculateDetailedVolumes(txHistory, normalizedAddress);
    
    // Calculate USD values
    const ethInUsd = (parseFloat(stats.ethIn) * ethPrice).toFixed(2);
    const ethOutUsd = (parseFloat(stats.ethOut) * ethPrice).toFixed(2);
    const usdcInUsd = (parseFloat(stats.usdcIn) * usdcPrice).toFixed(2);
    const usdcOutUsd = (parseFloat(stats.usdcOut) * usdcPrice).toFixed(2);
    const gasUsdAmount = (parseFloat(stats.gasEthAmount) * ethPrice).toFixed(2);
    
    console.log(`Gas spent in USD: $${gasUsdAmount} (ETH price: $${ethPrice})`);
    console.log(`Volume in USD: $${ethInUsd} (ETH in) + $${ethOutUsd} (ETH out) + $${usdcInUsd} (USDC in) + $${usdcOutUsd} (USDC out)`);
    
    return {
      address: normalizedAddress,
      baseName,
      transactionCount: txHistory.length || txCount,
      outgoingTransactions: stats.outgoingCount,
      ethVolumeIn: stats.ethIn,
      ethVolumeOut: stats.ethOut,
      usdcVolumeIn: stats.usdcIn,
      usdcVolumeOut: stats.usdcOut,
      ethVolumeInUsd: ethInUsd,
      ethVolumeOutUsd: ethOutUsd,
      usdcVolumeInUsd: usdcInUsd,
      usdcVolumeOutUsd: usdcOutUsd,
      gasSpent: {
        ethAmount: stats.gasEthAmount,
        weiAmount: stats.gasWeiAmount,
        usdAmount: gasUsdAmount
      },
      ethPrice,
      usdcPrice,
      success: true
    };
  } catch (error) {
    console.error('Error fetching wallet data:', error);
    
    return {
      address: addressOrName,
      error: error.message,
      success: false
    };
  }
};

/**
 * Helper to fetch daily prices for a coin from CoinGecko using market_chart/range
 * @param {string} coinId - CoinGecko coin id (e.g. 'ethereum', 'usd-coin')
 * @param {number} fromTs - unix timestamp (seconds)
 * @param {number} toTs - unix timestamp (seconds)
 * @returns {Promise<Object>} - { 'YYYY-MM-DD': price }
 */
async function fetchCoinGeckoPricesRange(coinId, fromTs, toTs) {
  const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart/range?vs_currency=usd&from=${fromTs}&to=${toTs}`;
  const resp = await axios.get(url);
  // resp.data.prices: [ [timestamp, price], ... ]
  const priceMap = {};
  for (const [ts, price] of resp.data.prices) {
    const date = new Date(ts).toISOString().slice(0, 10);
    priceMap[date] = price;
  }
  return priceMap;
}

export async function getHistoricalBalances({ address, startDate, endDate, alchemyApiKey, usdcAddress, alchemyNetwork }) {
  const settings = { apiKey: alchemyApiKey, network: alchemyNetwork };
  const alchemy = new Alchemy(settings);
  const provider = alchemy.core;
  const dater = new EthDater(provider);

  // Get all days between start and end
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }

  // Get block numbers for each day (at 00:00 UTC)
  const blockPromises = days.map(day => {
    const iso = day.toISOString().slice(0, 10) + 'T00:00:00Z';
    return dater.getDate(iso).then(res => res.block);
  });
  const blocks = await Promise.all(blockPromises);

  // Fetch all prices in one call per coin
  const fromTs = Math.floor(start.getTime() / 1000);
  const toTs = Math.floor(end.getTime() / 1000) + 86400; // include last day
  const [ethPrices, usdcPrices] = await Promise.all([
    fetchCoinGeckoPricesRange('ethereum', fromTs, toTs),
    fetchCoinGeckoPricesRange('usd-coin', fromTs, toTs)
  ]);

  // Fetch balances and prices for each block
  const results = [];
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const dateObj = days[i];
    const date = dateObj.toISOString().slice(0, 10);
    // ETH balance
    const ethBal = await provider.getBalance(address, block);
    // USDC balance
    const usdcBal = await alchemy.core.getTokenBalances(address, [usdcAddress], block);
    const usdc = usdcBal.tokenBalances[0]?.tokenBalance || '0';
    // Get prices for this day
    const ethPrice = ethPrices[date] || 0;
    const usdcPrice = usdcPrices[date] || 0;
    // Calculate USD value
    const ethUsd = parseFloat(Utils.formatEther(ethBal)) * ethPrice;
    const usdcUsd = parseFloat(Utils.formatUnits(usdc, 6)) * usdcPrice;
    results.push({
      date,
      eth: Utils.formatEther(ethBal),
      usdc: Utils.formatUnits(usdc, 6),
      usd: (ethUsd + usdcUsd).toFixed(2)
    });
  }
  return results;
} 