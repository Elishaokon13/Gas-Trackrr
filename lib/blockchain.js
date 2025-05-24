import { ethers } from 'ethers';
import axios from 'axios';
import { serverLog } from '../pages/api/logs';
import { namehash } from 'ethers/lib/utils';
import { Alchemy, Utils } from 'alchemy-sdk';
import EthDater from 'ethereum-block-by-date';
import { getEthPrice } from './getEthPrice';
import { Connection, PublicKey } from '@solana/web3.js';

// Base mainnet RPC URL with fallback to public endpoint 
const BASE_RPC_URL = process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org';
const ETH_MAINNET_RPC_URL = process.env.NEXT_PUBLIC_ETH_MAINNET_RPC_URL || 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161';

// Basescan API key (get one from https://basescan.org/myapikey)
// Using a placeholder - in production, use environment variable
const BASESCAN_API_KEY = process.env.NEXT_PUBLIC_BASESCAN_API_KEY || '';
const BASESCAN_API_URL = 'https://api.basescan.org/api';

const USDC_ADDRESSES = {
  base: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
  ethereum: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  optimism: '0x0b2c639c533813f4aa9d7837caf62653d097ff85',
  // assetchain: '0x2B7C1342Cc64add10B2a79C8f9767d2667DE64B2',
};

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
  // assetchain: {
  //   apiUrl: 'https://scan.assetchain.org/api/v2',
  //   apiKey: '',
  // },
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

// ENS Registry address (Ethereum mainnet)
const ENS_REGISTRY = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
const ENS_REGISTRY_ABI = [
  'function resolver(bytes32 node) view returns (address)'
];
const ENS_RESOLVER_ABI_DIRECT = [
  'function addr(bytes32 node) view returns (address)'
];

// Add helper to fetch ENS/BaseName text records (avatar, display)
const ENS_TEXT_ABI = [
  'function text(bytes32 node, string key) view returns (string)'
];

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
      
      if (receipt) {
        // Add gas used from receipt
        totalGasUsed = totalGasUsed.add(receipt.gasUsed);
        
        // Calculate gas cost in wei
        const gasCost = receipt.gasUsed.mul(tx.gasPrice || 0);
        totalGasCost = totalGasCost.add(gasCost);
      }
    } catch (error) {
      logMessage('error', `Error getting receipt for tx ${tx.hash}: ${error.message}`);
      continue;
    }
  }
  
  // Convert to ETH and USD
  const gasCostEth = ethers.utils.formatEther(totalGasCost);
  const ethPrice = await getEthPrice();
  const gasCostUsd = (parseFloat(gasCostEth) * ethPrice).toFixed(2);
  
  return {
    gasUsed: totalGasUsed.toString(),
    gasCostEth,
    gasCostUsd: ethPrice ? gasCostUsd : 'N/A'
  };
};

// Get all transactions for an address with improved error handling and rate limiting
export const getTransactions = async (address, chain = 'base') => {
  const scan = SCAN_CONFIG[chain] || SCAN_CONFIG.base;
  
  try {
    logMessage('info', `Getting transactions for ${address} on ${chain}...`);
    
    // Get transaction history from scan API
    const transactions = await getTransactionHistoryScan(address, scan, USDC_ADDRESSES[chain]);
    logMessage('info', `Found ${transactions.length} transactions`);
    
    return transactions;
  } catch (error) {
    logMessage('error', `Error fetching transactions: ${error.message}`);
    return [];
  }
};

// Get onchain score based on actual transaction data
export const getOnchainScore = async (address) => {
  logMessage('info', `Getting onchain score for ${address}`);
  
  try {
    const transactions = await getTransactions(address);
    const gasMetrics = await calculateGasMetrics(transactions);
    
    // Calculate score based on actual transaction data
    const transactionScore = Math.min(transactions.length / 2, 50); // Max 50 points from transaction count
    const gasScore = Math.min(parseFloat(gasMetrics.gasCostEth) * 25, 50); // Max 50 points from gas spending
    
    const totalScore = Math.round(transactionScore + gasScore);
    const cappedScore = Math.min(totalScore, 100);
    
    // Calculate actual trading volume from transactions
    const volumes = calculateDetailedVolumes(transactions, address);
    const tradingVolume = parseFloat(volumes.ethVolumeIn) + parseFloat(volumes.ethVolumeOut);
    
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

// Direct ENS resolver for .eth names
async function resolveEnsNameDirect(name) {
  try {
    const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
    const provider = new ethers.providers.JsonRpcProvider(
      alchemyKey
        ? `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`
        : 'https://eth-mainnet.g.alchemy.com/v2/demo'
    );
    const node = ethers.utils.namehash(name);
    const registry = new ethers.Contract(ENS_REGISTRY, ENS_REGISTRY_ABI, provider);
    const resolverAddress = await registry.resolver(node);
    if (!resolverAddress || resolverAddress === ethers.constants.AddressZero) return null;
    const resolver = new ethers.Contract(resolverAddress, ENS_RESOLVER_ABI_DIRECT, provider);
    const ethAddress = await resolver.addr(node);
    if (!ethAddress || ethAddress === ethers.constants.AddressZero) return null;
    return ethAddress;
  } catch (error) {
    console.error('Direct ENS resolution error:', error);
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

function isValidOpName(name) {
  // Only support .op names with alphanumeric and dashes, at least 3 chars before .op
  return /^[a-zA-Z0-9\-]{3,}\.op$/.test(name);
}

// In-memory cache for OP name resolutions (1-hour TTL)
const opNameCache = {};
const OP_NAME_CACHE_TTL = 60 * 60 * 1000; // 1 hour in ms

async function resolveOpName(name) {
  try {
    if (!isValidOpName(name)) {
      throw new Error('Invalid OP Name format. Must be at least 3 characters and end with .op');
    }
    // Check cache
    const now = Date.now();
    if (opNameCache[name] && (now - opNameCache[name].ts < OP_NAME_CACHE_TTL)) {
      return opNameCache[name].address;
    }
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
    if (!resolvedAddress || resolvedAddress === ethers.constants.AddressZero) {
      throw new Error('OP Name not registered or has no address record');
    }
    // Cache result
    opNameCache[name] = { address: resolvedAddress, ts: now };
    return resolvedAddress;
  } catch (error) {
    console.error('OP name resolution error:', error);
    return null;
  }
}

// TODO: Re-enable AssetChain support when tools are ready
// function getAssetChainProvider() {
//   return new ethers.providers.JsonRpcProvider(ASSETCHAIN_RPC_URL, 42420);
// }

// TODO: Re-enable AssetChain support when tools are ready
// async function getAssetChainTransactions(address) {
//   try {
//     const url = `https://scan.assetchain.org/api/v2/addresses/${address}/transactions?filter=to%20%7C%20from`;
//     const response = await axios.get(url);
//     if (response.data && Array.isArray(response.data.items)) {
//       return response.data.items;
//     }
//     return [];
//   } catch (error) {
//     console.error('Error fetching AssetChain transactions:', error.message);
//     return [];
//   }
// }

// --- Solana Support ---
const SOLSCAN_PRO_API = 'https://pro-api.solscan.io/v2.0';
const SOLSCAN_API_KEY = process.env.SOLSCAN_API_KEY;
const SOLANA_USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const HELIUS_API_URL = `https://api.helius.xyz/v0/transactions?api-key=${HELIUS_API_KEY}`;
const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

async function getSolanaAnalytics(address) {
  // 1. Get SOL balance and total transaction count (public API)
  let solBalance = 0;
  let totalTxCount = 0;
  try {
    const accountResp = await axios.get(`https://public-api.solscan.io/account?address=${address}`);
    solBalance = accountResp.data.lamports ? accountResp.data.lamports / 1e9 : 0;
    totalTxCount = accountResp.data.txCount || 0;
  } catch (err) {
    if (!(err.response && err.response.status === 404)) throw err;
  }

  // 2. Get USDC SPL token balance (public API)
  let usdcBalance = 0;
  try {
    const tokensResp = await axios.get(`https://public-api.solscan.io/account/tokens?address=${address}`);
    if (Array.isArray(tokensResp.data)) {
      const usdcToken = tokensResp.data.find(t => t.tokenAddress === SOLANA_USDC_MINT);
      if (usdcToken && usdcToken.tokenAmount?.uiAmount) {
        usdcBalance = usdcToken.tokenAmount.uiAmount;
      }
    }
  } catch (err) {
    if (!(err.response && err.response.status === 404)) throw err;
  }

  // 3. Get last 20 transaction signatures
  let signatures = [];
  try {
    const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
    const pubkey = new PublicKey(address);
    const sigs = await connection.getSignaturesForAddress(pubkey, { limit: 20 });
    signatures = sigs.map(s => s.signature);
  } catch (err) {}

  // 4. Get enhanced transaction data from Helius
  let txs = [];
  if (signatures.length > 0 && HELIUS_API_KEY) {
    try {
      const heliusResp = await axios.post(HELIUS_API_URL, { transactions: signatures });
      if (Array.isArray(heliusResp.data)) {
        txs = heliusResp.data;
      }
    } catch (err) {}
  }

  let incomingSOL = 0, outgoingSOL = 0, incomingUSDC = 0, outgoingUSDC = 0, totalFees = 0;
  for (const tx of txs) {
    // Fees
    if (tx.fee) totalFees += Number(tx.fee) / 1e9;
    // SOL transfers
    if (Array.isArray(tx.nativeTransfers)) {
      for (const transfer of tx.nativeTransfers) {
        if (transfer.toUserAccount === address) incomingSOL += Number(transfer.amount) / 1e9;
        if (transfer.fromUserAccount === address) outgoingSOL += Number(transfer.amount) / 1e9;
      }
    }
    // USDC transfers
    if (Array.isArray(tx.tokenTransfers)) {
      for (const transfer of tx.tokenTransfers) {
        if (transfer.mint === SOLANA_USDC_MINT) {
          if (transfer.toUserAccount === address) incomingUSDC += Number(transfer.tokenAmount) / Math.pow(10, transfer.decimals || 6);
          if (transfer.fromUserAccount === address) outgoingUSDC += Number(transfer.tokenAmount) / Math.pow(10, transfer.decimals || 6);
        }
      }
    }
  }

  return {
    address,
    transactionCount: totalTxCount,
    solBalance,
    usdcBalance,
    incomingSOL,
    outgoingSOL,
    incomingUSDC,
    outgoingUSDC,
    totalFees,
    success: true
  };
}

// Update getWalletData to support Solana
export const getWalletData = async (addressOrName, chain = 'base') => {
  console.log('[DEBUG] getWalletData called with:', { chain, addressOrName });
  try {
    if (chain === 'solana') {
      // Only support direct Solana addresses for now
      if (!addressOrName || typeof addressOrName !== 'string' || addressOrName.length < 32) {
        throw new Error('Invalid Solana address');
      }
      return await getSolanaAnalytics(addressOrName);
    }
    const scan = SCAN_CONFIG[chain] || SCAN_CONFIG.base;
    const usdcAddress = USDC_ADDRESSES[chain] || USDC_ADDRESSES.base;
    console.log(`Fetching data for: ${addressOrName} on chain: ${chain}`);
    
    let normalizedAddress;
    let baseName = null;
    let avatarUrl = '';
    let profileName = '';
    
    // TODO: Re-enable AssetChain support when tools are ready
    // if (chain === 'assetchain') {
    //   // ... all AssetChain logic ...
    //   return { address: normalizedAddress, baseName: null, transactionCount: 0, outgoingTransactions: 0, ethVolumeIn: '0', ethVolumeOut: '0', usdcVolumeIn: '0', usdcVolumeOut: '0', ethVolumeInUsd: 'N/A', ethVolumeOutUsd: 'N/A', usdcVolumeInUsd: '0', usdcVolumeOutUsd: '0', gasSpent: { ethAmount: '0', weiAmount: '0', usdAmount: 'N/A' }, ethPrice: null, usdcPrice: 1, success: true };
    // }
    // Name resolution per chain
    if (chain === 'ethereum' && typeof addressOrName === 'string' && addressOrName.endsWith('.eth')) {
      console.log('Resolving ENS name:', addressOrName);
      const ensResult = await resolveEnsNameDirectWithProfile(addressOrName);
      normalizedAddress = ensResult.address;
      baseName = addressOrName;
      if (!normalizedAddress) throw new Error('ENS name not registered or has no address record');
      avatarUrl = ensResult.avatarUrl;
      profileName = ensResult.profileName;
    } else if (chain === 'optimism' && typeof addressOrName === 'string' && addressOrName.endsWith('.op')) {
      console.log('Resolving OP name:', addressOrName);
      if (!isValidOpName(addressOrName)) {
        throw new Error('Invalid OP Name format. Must be at least 3 characters and end with .op');
      }
      normalizedAddress = await resolveOpName(addressOrName);
      baseName = addressOrName;
      if (!normalizedAddress) throw new Error('Invalid or unregistered OP name');
    } else if (chain === 'base' && isValidBaseName(addressOrName)) {
      console.log('Resolving BaseName:', addressOrName);
      baseName = addressOrName;
      const baseResult = await resolveBaseNameWithProfile(baseName);
      normalizedAddress = baseResult.address;
      if (!normalizedAddress) throw new Error('BaseName not registered or has no address record');
      avatarUrl = baseResult.avatarUrl;
      profileName = baseResult.profileName;
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
    const ethPrice = await getEthPrice();
    
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
        avatarUrl,
        profileName,
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
      avatarUrl,
      profileName,
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

// Update resolveEnsNameDirect to also fetch profile info
async function resolveEnsNameDirectWithProfile(name) {
  try {
    const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
    const provider = new ethers.providers.JsonRpcProvider(
      alchemyKey
        ? `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`
        : 'https://eth-mainnet.g.alchemy.com/v2/demo'
    );
    const node = ethers.utils.namehash(name);
    const registry = new ethers.Contract(ENS_REGISTRY, ENS_REGISTRY_ABI, provider);
    const resolverAddress = await registry.resolver(node);
    if (!resolverAddress || resolverAddress === ethers.constants.AddressZero) return { address: null, avatarUrl: '', profileName: '' };
    const resolver = new ethers.Contract(resolverAddress, ENS_RESOLVER_ABI_DIRECT, provider);
    const ethAddress = await resolver.addr(node);
    if (!ethAddress || ethAddress === ethers.constants.AddressZero) return { address: null, avatarUrl: '', profileName: '' };
    const profile = await fetchEnsProfile(name, provider, resolverAddress);
    return { address: ethAddress, ...profile };
  } catch (error) {
    console.error('Direct ENS resolution error:', error);
    return { address: null, avatarUrl: '', profileName: '' };
  }
}

// Update BaseName resolver to fetch profile info if supported
async function resolveBaseNameWithProfile(baseName) {
  try {
    if (!isValidBaseName(baseName)) {
      return { address: null, avatarUrl: '', profileName: '' };
    }
    const provider = getProvider();
    const contract = new ethers.Contract(BASENAME_RESOLVER, BASENAME_RESOLVER_ABI, provider);
    const node = namehash(baseName);
    const address = await contract.addr(node);
    if (!address || address === ethers.constants.AddressZero) {
      return { address: null, avatarUrl: '', profileName: '' };
    }
    // Try to fetch avatar and display name (if supported)
    let avatarUrl = '';
    let profileName = '';
    try {
      const resolver = new ethers.Contract(BASENAME_RESOLVER, ENS_TEXT_ABI, provider);
      avatarUrl = await resolver.text(node, 'avatar');
      profileName = await resolver.text(node, 'display');
    } catch {}
    return { address, avatarUrl, profileName };
  } catch (error) {
    return { address: null, avatarUrl: '', profileName: '' };
  }
}

async function fetchEnsProfile(name, provider, resolverAddress) {
  try {
    const node = ethers.utils.namehash(name);
    const resolver = new ethers.Contract(resolverAddress, ENS_TEXT_ABI, provider);
    const avatar = await resolver.text(node, 'avatar');
    let displayName = '';
    try {
      displayName = await resolver.text(node, 'display');
    } catch {
      // Some ENS names may not have 'display' set
      displayName = '';
    }
    return { avatarUrl: avatar, profileName: displayName };
  } catch (error) {
    return { avatarUrl: '', profileName: '' };
  }
}

// Group transactions by day (UTC) for a given wallet and chain
/**
 * Groups transactions by day (UTC).
 * @param {string} address - Wallet address
 * @param {string} chain - Chain name ('base', 'ethereum', 'optimism')
 * @param {Object} [options]
 * @param {string} [options.startDate] - ISO date string (inclusive)
 * @param {string} [options.endDate] - ISO date string (inclusive)
 * @returns {Promise<Object>} - { 'YYYY-MM-DD': count }
 */
export const groupTransactionsByDay = async (address, chain = 'base', options = {}) => {
  const { startDate, endDate } = options;
  const transactions = await getTransactions(address, chain);
  const dayMap = {};
  for (const tx of transactions) {
    // Use block timestamp if available, else fallback to timeStamp
    let ts = tx.timeStamp || tx.timestamp;
    if (!ts) continue;
    // Convert to UTC date string
    const date = new Date(Number(ts) * 1000).toISOString().slice(0, 10);
    // Filter by date range if provided
    if (startDate && date < startDate) continue;
    if (endDate && date > endDate) continue;
    dayMap[date] = (dayMap[date] || 0) + 1;
  }
  return dayMap;
}; 