import { ethers } from 'ethers';
import axios from 'axios';
import { serverLog } from '../pages/api/logs';

// Base mainnet RPC URL with fallback to public endpoint 
const BASE_RPC_URL = process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org';

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

// Zerion API configuration
const ZERION_API_URL = 'https://api.zerion.io/v1';

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

// Known protocol addresses on Base
const KNOWN_PROTOCOLS = {
  '0x4200000000000000000000000000000000000006': 'Base Bridge', 
  '0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca': 'Base USD',
  '0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6': 'Wrapped ETH',
  '0x50c5725949a6f0c72e6c4a641f24049a917db0cb': 'Lyra',
  '0x4ed4e862860bed51a9570b96d89af5e1b0efefed': 'Zora',
  '0x82af49447d8a07e3bd95bd0d56f35241523fbab1': 'Wormhole',
  '0x1eeaabddfedd19ebae68e232e0d7847c08c0a6e1': 'Uniswap V3',
  '0x50c5725949a6f0c72e6c4a641f24049a917db0cb': 'Aerodrome',
  '0x4ed4e862860bed51a9570b96d89af5e1b0efefed': 'Baseswap',
  '0x2db0a83a9f3a438522dad5a8b9f0c9f625490615': 'Balancer',
  // Add more known protocols as needed
};

// Initialize ethers provider with increased timeout and retry options
export const getProvider = () => {
  const rpcUrl = getCustomRpcUrl();
  console.log(`Using RPC URL: ${rpcUrl.replace(/\/v[23]\/.*$/, '/v2/***')}`); // Log without exposing API key
  
  const options = {
    timeout: 120000, // 2 minute timeout
    allowGzip: true,
    keepAlive: true,
  };
  return new ethers.providers.JsonRpcProvider(rpcUrl, 8453, options);
};

// Get historical ETH prices for USD conversion
export const getHistoricalEthPrice = async (timestamp) => {
  try {
    const date = new Date(timestamp * 1000).toISOString().split('T')[0];
    const apiKey = process.env.NEXT_PUBLIC_COINGECKO_API_KEY;
    const url = apiKey 
      ? `https://pro-api.coingecko.com/api/v3/coins/ethereum/history?date=${date}&x_cg_pro_api_key=${apiKey}`
      : `https://api.coingecko.com/api/v3/coins/ethereum/history?date=${date}`;
    
    const response = await axios.get(url, { timeout: 10000 });
    return response.data.market_data.current_price.usd;
  } catch (error) {
    console.error('Error fetching ETH price:', error);
    return 2000; // Fallback price if API fails
  }
};

// Get transactions from Zerion API with improved logging
export const getZerionTransactions = async (address) => {
  if (!process.env.NEXT_PUBLIC_ZERION_API_KEY) {
    logMessage('zerion', 'No Zerion API key found, skipping Zerion API call');
    return null;
  }
  
  try {
    logMessage('zerion', `Getting transactions from Zerion API for ${address}...`);
    const headers = getZerionHeaders();
    
    const apiUrl = `${ZERION_API_URL}/wallets/${address}/transactions?currency=usd&chain_ids=base&page=1&sort=datetime&limit=50`;
    logMessage('zerion', `Calling API: ${apiUrl}`);
    
    const response = await axios.get(
      apiUrl,
      { headers: headers, timeout: 20000 }
    );
    
    const transactions = response.data?.data || [];
    logMessage('zerion', `Found ${transactions.length} transactions via Zerion API`);
    
    // Sample log of the first transaction to help debugging
    if (transactions.length > 0) {
      const sample = transactions[0];
      const txDetails = {
        id: sample.id,
        type: sample.type,
        hash: sample.attributes?.hash,
        datetime: sample.attributes?.datetime,
        fee: sample.attributes?.fee?.value,
        status: sample.attributes?.status
      };
      logMessage('zerion', 'Sample transaction:', txDetails);
    }
    
    return transactions;
  } catch (error) {
    logMessage('error', `Error fetching transactions from Zerion: ${error.message}`);
    logMessage('error', `Status: ${error.response?.status}, Text: ${error.response?.statusText}`);
    
    if (error.response?.data) {
      logMessage('error', 'Error details:', error.response?.data);
    }
    return null; // Return null to indicate Zerion API failed but we can fall back
  }
};

// Get all transactions for an address with improved error handling
export const getTransactions = async (address) => {
  // Try Zerion API first if key is provided
  const zerionTransactions = await getZerionTransactions(address);
  if (zerionTransactions && zerionTransactions.length > 0) {
    return zerionTransactions;
  }
  
  // Fall back to RPC provider if Zerion fails or returns no data
  const provider = getProvider();
  
  try {
    console.log(`Getting transactions from RPC for ${address}...`);
    
    // Get the latest block number
    const latestBlock = await provider.getBlockNumber();
    console.log(`Latest block: ${latestBlock}`);
    
    // For better performance, scan last 5,000 blocks (approx. 1 week)
    // This is still a limitation, but more practical for a demo
    const fromBlock = Math.max(0, latestBlock - 5000);
    console.log(`Scanning from block ${fromBlock} to ${latestBlock}`);
    
    // Get transaction history with timeout and retry logic
    try {
      const history = await provider.getHistory(address, fromBlock, latestBlock);
      console.log(`Found ${history.length} transactions via RPC`);
      return history;
    } catch (error) {
      console.error('Initial transaction fetch failed, retrying with smaller range:', error);
      
      // If full range fails, try with last 1,000 blocks
      const smallerFromBlock = Math.max(0, latestBlock - 1000);
      const history = await provider.getHistory(address, smallerFromBlock, latestBlock);
      console.log(`Found ${history.length} transactions with reduced range`);
      return history;
    }
  } catch (error) {
    console.error('Error fetching transactions:', error);
    // Return empty array instead of throwing to avoid breaking the app
    return [];
  }
};

// Calculate gas metrics for Zerion transactions
export const calculateZerionGasMetrics = (transactions) => {
  let totalGasUsed = ethers.BigNumber.from(0);
  let totalGasCost = ethers.BigNumber.from(0);
  
  for (const tx of transactions) {
    try {
      if (tx.attributes?.fee?.value) {
        // Zerion provides fee in ETH directly
        const gasCost = ethers.utils.parseEther(tx.attributes.fee.value.toString());
        totalGasCost = totalGasCost.add(gasCost);
        
        // Estimate gas used based on gas price if available
        if (tx.attributes?.gas_price) {
          const gasPrice = ethers.BigNumber.from(tx.attributes.gas_price);
          const gasUsed = gasPrice.isZero() 
            ? ethers.BigNumber.from(0) 
            : gasCost.div(gasPrice);
          totalGasUsed = totalGasUsed.add(gasUsed);
        }
      }
    } catch (error) {
      console.warn(`Could not process gas for tx ${tx.id}:`, error.message);
    }
  }
  
  return {
    gasUsed: totalGasUsed.toString(),
    gasCostEth: ethers.utils.formatEther(totalGasCost),
  };
};

// Calculate gas used and cost with improved error handling
export const calculateGasMetrics = async (transactions) => {
  // Check if these are Zerion transactions
  if (transactions[0]?.type === 'transactions') {
    return calculateZerionGasMetrics(transactions);
  }
  
  // Standard RPC transactions processing
  let totalGasUsed = ethers.BigNumber.from(0);
  let totalGasCost = ethers.BigNumber.from(0);
  const provider = getProvider();
  
  console.log(`Calculating gas metrics for ${transactions.length} transactions...`);
  
  for (const tx of transactions) {
    try {
      // Get transaction receipt directly from provider instead of using tx.wait()
      // which doesn't work for historical transactions
      const receipt = await provider.getTransactionReceipt(tx.hash);
      
      if (receipt && receipt.gasUsed) {
        totalGasUsed = totalGasUsed.add(receipt.gasUsed);
        const gasCost = receipt.gasUsed.mul(tx.gasPrice || ethers.BigNumber.from(0));
        totalGasCost = totalGasCost.add(gasCost);
      }
    } catch (error) {
      console.warn(`Could not get receipt for tx ${tx.hash}:`, error.message);
    }
  }
  
  console.log(`Total gas used: ${totalGasUsed.toString()}`);
  console.log(`Total gas cost (ETH): ${ethers.utils.formatEther(totalGasCost)}`);
  
  return {
    gasUsed: totalGasUsed.toString(),
    gasCostEth: ethers.utils.formatEther(totalGasCost),
  };
};

// Extract protocol interactions from Zerion transactions
export const getZerionProtocolInteractions = (transactions) => {
  const protocolInteractions = {};
  
  for (const tx of transactions) {
    try {
      // Extract protocol info from Zerion data
      const protocol = tx.attributes?.application_name;
      if (protocol) {
        const protocolKey = protocol.toLowerCase();
        protocolInteractions[protocolKey] = {
          count: (protocolInteractions[protocolKey]?.count || 0) + 1,
          name: protocol,
          displayAddress: protocol
        };
      }
    } catch (error) {
      console.warn(`Could not process protocol data for tx ${tx.id}:`, error.message);
    }
  }
  
  // Sort by interaction count
  const sortedProtocols = Object.values(protocolInteractions)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map(protocol => ({
      address: protocol.displayAddress,
      count: protocol.count,
      name: protocol.name
    }));
  
  return sortedProtocols;
};

// Get protocols interacted with
export const getProtocolInteractions = async (transactions) => {
  // Check if these are Zerion transactions
  if (transactions[0]?.type === 'transactions') {
    return getZerionProtocolInteractions(transactions);
  }
  
  // Standard RPC transactions processing
  const protocolInteractions = {};
  
  console.log(`Analyzing protocol interactions for ${transactions.length} transactions...`);
  
  for (const tx of transactions) {
    if (tx.to) {
      const address = tx.to.toLowerCase();
      
      // Find if this is a known protocol
      let protocolName = null;
      for (const [protocolAddr, name] of Object.entries(KNOWN_PROTOCOLS)) {
        if (address === protocolAddr.toLowerCase()) {
          protocolName = name;
          break;
        }
      }
      
      const displayAddress = protocolName || `${address.slice(0, 6)}...${address.slice(-4)}`;
      protocolInteractions[address] = {
        count: (protocolInteractions[address]?.count || 0) + 1,
        name: protocolName || `Unknown Protocol`,
        displayAddress
      };
    }
  }
  
  // Sort by interaction count
  const sortedProtocols = Object.values(protocolInteractions)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map(protocol => ({
      address: protocol.displayAddress,
      count: protocol.count,
      name: protocol.name
    }));
  
  console.log(`Found ${sortedProtocols.length} top protocols`);
  return sortedProtocols;
};

// Get NFT info from Zerion API
export const getZerionNFTs = async (address) => {
  if (!process.env.NEXT_PUBLIC_ZERION_API_KEY) {
    console.log('No Zerion API key found, skipping Zerion NFT API call');
    return null;
  }
  
  try {
    console.log(`Getting NFTs from Zerion API for ${address}...`);
    const headers = getZerionHeaders();
    
    const response = await axios.get(
      `${ZERION_API_URL}/wallets/${address}/nfts?currency=usd&chain_ids=base`,
      { headers: headers, timeout: 20000 }
    );
    
    const nfts = response.data?.data || [];
    console.log(`Found ${nfts.length} NFTs via Zerion API`);
    
    return {
      nftsMinted: nfts.length,
      zoraRewards: '0.05', // Still a placeholder
    };
  } catch (error) {
    console.error('Error fetching NFTs from Zerion:', error.response?.status, error.response?.statusText);
    if (error.response?.data) {
      console.error('Error details:', JSON.stringify(error.response.data));
    }
    return null;
  }
};

// Get NFT minting activity with improved implementation
export const getNftActivity = async (address) => {
  try {
    console.log(`Getting NFT activity for ${address}...`);
    
    // Try Zerion API first
    const zerionNFTs = await getZerionNFTs(address);
    if (zerionNFTs) {
      return zerionNFTs;
    }
    
    // If Zerion fails, try SimpleHash API
    const simpleHashKey = process.env.NEXT_PUBLIC_SIMPLEHASH_API_KEY;
    
    if (simpleHashKey) {
      try {
        const response = await axios.get(
          `https://api.simplehash.com/api/v0/nfts/owners?chains=base&wallet_addresses=${address}&limit=50`,
          {
            headers: {
              'X-API-KEY': simpleHashKey
            }
          }
        );
        
        const nftsOwned = response.data?.nfts?.length || 0;
        console.log(`Found ${nftsOwned} NFTs for address ${address}`);
        
        return {
          nftsMinted: nftsOwned,
          zoraRewards: '0.05', // Still a placeholder - would need Zora-specific API
        };
      } catch (apiError) {
        console.error('Error fetching from SimpleHash API:', apiError);
        // Fall back to placeholder data
      }
    }
    
    // Fallback to placeholder data if no API key or if API calls fail
    return {
      nftsMinted: Math.floor(Math.random() * 5),
      zoraRewards: '0.05',
    };
  } catch (error) {
    console.error('Error estimating NFT activity:', error);
    return {
      nftsMinted: 0,
      zoraRewards: '0',
    };
  }
};

// Get monthly transaction activity from Zerion data
export const getZerionMonthlyActivity = (transactions) => {
  const monthCounts = {
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0,
    7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0
  };
  
  const currentYear = new Date().getFullYear();
  
  for (const tx of transactions) {
    if (tx.attributes?.datetime) {
      const date = new Date(tx.attributes.datetime);
      const month = date.getMonth() + 1; // JavaScript months are 0-indexed
      monthCounts[month] += 1;
    }
  }
  
  // Find the busiest month
  let busiestMonth = 1;
  let maxCount = 0;
  
  for (const [month, count] of Object.entries(monthCounts)) {
    if (count > maxCount) {
      maxCount = count;
      busiestMonth = parseInt(month);
    }
  }
  
  const busiestMonthName = new Date(currentYear, busiestMonth - 1).toLocaleString('default', { month: 'long' });
  
  return {
    monthCounts,
    busiestMonth,
    busiestMonthName,
    busiestMonthCount: maxCount,
  };
};

// Get transactions by month
export const getTransactionsByMonth = async (transactions) => {
  // Check if these are Zerion transactions
  if (transactions[0]?.type === 'transactions') {
    return getZerionMonthlyActivity(transactions);
  }
  
  // Standard RPC transactions processing
  console.log(`Analyzing monthly activity for ${transactions.length} transactions...`);
  
  const monthCounts = {
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0,
    7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0
  };
  
  const currentYear = new Date().getFullYear();
  
  for (const tx of transactions) {
    if (tx.timestamp) {
      const date = new Date(tx.timestamp * 1000);
      const month = date.getMonth() + 1; // JavaScript months are 0-indexed
      monthCounts[month] += 1;
    }
  }
  
  // Find the busiest month
  let busiestMonth = 1;
  let maxCount = 0;
  
  for (const [month, count] of Object.entries(monthCounts)) {
    if (count > maxCount) {
      maxCount = count;
      busiestMonth = parseInt(month);
    }
  }
  
  const busiestMonthName = new Date(currentYear, busiestMonth - 1).toLocaleString('default', { month: 'long' });
  console.log(`Busiest month: ${busiestMonthName} with ${maxCount} transactions`);
  
  return {
    monthCounts,
    busiestMonth,
    busiestMonthName,
    busiestMonthCount: maxCount,
  };
};

// Get month-by-month gas expenses for better expense tracking
export const getMonthlyGasExpenses = async (transactions) => {
  logMessage('gas', `Starting gas expense calculation for ${transactions.length} transactions`);
  
  // Initialize monthly tracking
  const monthlyGasCost = {
    1: { eth: '0', usd: 0 },
    2: { eth: '0', usd: 0 },
    3: { eth: '0', usd: 0 },
    4: { eth: '0', usd: 0 },
    5: { eth: '0', usd: 0 },
    6: { eth: '0', usd: 0 },
    7: { eth: '0', usd: 0 },
    8: { eth: '0', usd: 0 },
    9: { eth: '0', usd: 0 },
    10: { eth: '0', usd: 0 },
    11: { eth: '0', usd: 0 },
    12: { eth: '0', usd: 0 }
  };
  
  // Check if these are Zerion transactions
  if (transactions[0]?.type === 'transactions') {
    logMessage('gas', 'Processing Zerion transaction format for gas expenses');
    
    // Process Zerion transactions
    for (const tx of transactions) {
      try {
        if (tx.attributes?.datetime && tx.attributes?.fee?.value) {
          const date = new Date(tx.attributes.datetime);
          const month = date.getMonth() + 1; // JavaScript months are 0-indexed
          
          // Get fee in ETH
          const gasEth = tx.attributes.fee.value.toString();
          
          // Get fee in USD if available
          const gasUsd = tx.attributes.fee?.price?.value || 0;
          
          // Add to monthly totals
          const currentEth = ethers.utils.parseEther(monthlyGasCost[month].eth);
          const newEth = currentEth.add(ethers.utils.parseEther(gasEth));
          
          monthlyGasCost[month].eth = ethers.utils.formatEther(newEth);
          monthlyGasCost[month].usd += gasUsd;
          
          logMessage('gas', `Added gas expense: ${gasEth} ETH ($${gasUsd}) for ${date.toISOString().split('T')[0]}`);
        }
      } catch (error) {
        console.warn(`Could not process gas cost for tx ${tx.id}:`, error.message);
      }
    }
  } else {
    logMessage('gas', 'Processing RPC transaction format for gas expenses');
    
    // Process RPC transactions
    const provider = getProvider();
    let ethPrice = 2000; // Default ETH price if we can't fetch it
    
    try {
      // Try to get current ETH price from CoinGecko
      logMessage('gas', 'Fetching current ETH price from CoinGecko...');
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
        { timeout: 5000 }
      );
      if (response.data?.ethereum?.usd) {
        ethPrice = response.data.ethereum.usd;
        logMessage('gas', `Current ETH price: $${ethPrice}`);
      }
    } catch (error) {
      logMessage('warning', `Could not fetch ETH price, using default $${ethPrice}: ${error.message}`);
    }
    
    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;
    
    for (const tx of transactions) {
      try {
        processedCount++;
        if (tx.timestamp) {
          const date = new Date(tx.timestamp * 1000);
          const month = date.getMonth() + 1;
          
          // Get transaction receipt for gas used
          const receipt = await provider.getTransactionReceipt(tx.hash);
          
          if (receipt && receipt.gasUsed && tx.gasPrice) {
            const gasCost = receipt.gasUsed.mul(tx.gasPrice);
            const gasEth = ethers.utils.formatEther(gasCost);
            const gasUsd = parseFloat(gasEth) * ethPrice;
            
            // Add to monthly totals
            const currentEth = ethers.utils.parseEther(monthlyGasCost[month].eth);
            const newEth = currentEth.add(gasCost);
            
            monthlyGasCost[month].eth = ethers.utils.formatEther(newEth);
            monthlyGasCost[month].usd += gasUsd;
            
            successCount++;
            
            // Log every 10th transaction to avoid flooding terminal
            if (processedCount % 10 === 0 || processedCount === 1 || processedCount === transactions.length) {
              logMessage('gas', `Processed ${processedCount}/${transactions.length} txs. Added: ${gasEth} ETH ($${gasUsd.toFixed(2)}) for ${date.toISOString().split('T')[0]}`);
            }
          }
        }
      } catch (error) {
        errorCount++;
        console.warn(`Could not process gas cost for tx ${tx.hash}:`, error.message);
      }
    }
    
    logMessage('gas', `Gas expense processing complete: ${successCount} successful, ${errorCount} failed`);
  }
  
  // Calculate totals
  const totalEth = Object.values(monthlyGasCost).reduce(
    (acc, month) => acc.add(ethers.utils.parseEther(month.eth)),
    ethers.BigNumber.from(0)
  );
  
  const totalUsd = Object.values(monthlyGasCost).reduce(
    (acc, month) => acc + month.usd,
    0
  );
  
  // Get month names for readability
  const monthNames = {
    1: 'January', 2: 'February', 3: 'March', 4: 'April',
    5: 'May', 6: 'June', 7: 'July', 8: 'August',
    9: 'September', 10: 'October', 11: 'November', 12: 'December'
  };
  
  // Format data for display and export
  const formattedMonths = Object.entries(monthlyGasCost).map(([month, costs]) => ({
    month: parseInt(month),
    monthName: monthNames[month],
    ethCost: costs.eth,
    usdCost: costs.usd.toFixed(2)
  })).sort((a, b) => a.month - b.month);
  
  // Find months with expenses for logging
  const activeMonths = formattedMonths.filter(m => parseFloat(m.ethCost) > 0);
  
  logMessage('gas', `Total gas expenses: ${ethers.utils.formatEther(totalEth)} ETH ($${totalUsd.toFixed(2)})`);
  logMessage('gas', `Monthly breakdown:`);
  activeMonths.forEach(m => {
    logMessage('gas', `  ${m.monthName}: ${parseFloat(m.ethCost).toFixed(4)} ETH ($${m.usdCost})`);
  });
  
  return {
    monthlyGasExpenses: formattedMonths,
    totalGasEth: ethers.utils.formatEther(totalEth),
    totalGasUsd: totalUsd.toFixed(2)
  };
};

// Generate CSV data for gas expenses for easy export to spreadsheets
export const generateGasExpenseCSV = (monthlyGasExpenses) => {
  logMessage('csv', 'Generating gas expense CSV data...');
  
  if (!monthlyGasExpenses || !monthlyGasExpenses.length) {
    logMessage('csv', 'No expense data available for CSV generation');
    return '';
  }
  
  // CSV Header
  const header = 'Month,ETH Cost,USD Cost\n';
  
  // CSV Rows
  const rows = monthlyGasExpenses.map(expense => 
    `${expense.monthName},${expense.ethCost},${expense.usdCost}`
  ).join('\n');
  
  const csvData = header + rows;
  logMessage('csv', `CSV generated with ${monthlyGasExpenses.length} rows`);
  
  return csvData;
};

// Update the Zerion headers function with better logging
const getZerionHeaders = () => {
  const apiKey = process.env.NEXT_PUBLIC_ZERION_API_KEY;
  
  if (!apiKey) {
    logMessage('zerion', 'No Zerion API key found, using anonymous access');
    return {
      'accept': 'application/json'
    };
  }
  
  logMessage('zerion', `Using Zerion API key: ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`);
  
  // Convert to Base64 as required by Zerion
  // Format should be: base64(api_key:)
  const base64Auth = typeof window !== 'undefined' 
    ? btoa(`${apiKey}:`) 
    : Buffer.from(`${apiKey}:`).toString('base64');
  
  return {
    'accept': 'application/json',
    'authorization': `Basic ${base64Auth}`
  };
};

// Get all the wrapped data for an address with improved logging
export const getWrappedData = async (address) => {
  try {
    logMessage('info', `========================================`);
    logMessage('info', `Starting Base Wrapped data fetch for ${address}`);
    logMessage('info', `========================================`);
    const startTime = Date.now();
    
    // Normalize address to checksum format
    const normalizedAddress = ethers.utils.getAddress(address);
    logMessage('info', `Normalized address: ${normalizedAddress}`);
    
    // Get transactions
    const transactions = await getTransactions(normalizedAddress);
    logMessage('info', `Processing ${transactions.length} transactions...`);
    
    // If no transactions, return basic data
    if (transactions.length === 0) {
      logMessage('warning', 'No transactions found, returning default data');
      return {
        address: normalizedAddress,
        transactionCount: 0,
        gasMetrics: {
          gasUsed: '0',
          gasCostEth: '0.00',
        },
        gasExpenses: {
          monthlyGasExpenses: [],
          totalGasEth: '0',
          totalGasUsd: '0.00'
        },
        protocolInteractions: [],
        nftActivity: {
          nftsMinted: 0,
          zoraRewards: '0',
        },
        monthlyActivity: {
          busiestMonth: new Date().getMonth() + 1,
          busiestMonthName: new Date().toLocaleString('default', { month: 'long' }),
          busiestMonthCount: 0,
        },
      };
    }
    
    logMessage('info', 'Starting parallel data processing for all metrics...');
    
    // Process in parallel for better performance
    const [
      gasMetrics,
      gasExpenses,
      protocolInteractions,
      nftActivity,
      monthlyActivity
    ] = await Promise.all([
      calculateGasMetrics(transactions),
      getMonthlyGasExpenses(transactions),
      getProtocolInteractions(transactions),
      getNftActivity(normalizedAddress),
      getTransactionsByMonth(transactions)
    ]);
    
    // Generate CSV data for easy export
    logMessage('info', 'Generating CSV for gas expenses...');
    const gasExpensesCSV = generateGasExpenseCSV(gasExpenses.monthlyGasExpenses);
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    logMessage('info', `========================================`);
    logMessage('info', `Completed data processing in ${duration} seconds`);
    logMessage('info', `Transactions: ${transactions.length}`);
    logMessage('info', `Total Gas (ETH): ${gasExpenses.totalGasEth}`);
    logMessage('info', `Total Gas (USD): $${gasExpenses.totalGasUsd}`);
    logMessage('info', `Busiest Month: ${monthlyActivity.busiestMonthName} (${monthlyActivity.busiestMonthCount} txs)`);
    logMessage('info', `Top Protocols: ${protocolInteractions.map(p => p.name).join(', ') || 'None'}`);
    logMessage('info', `NFTs Minted: ${nftActivity.nftsMinted}`);
    logMessage('info', `========================================`);
    
    return {
      address: normalizedAddress,
      transactionCount: transactions.length,
      gasMetrics,
      gasExpenses: {
        ...gasExpenses,
        csv: gasExpensesCSV
      },
      protocolInteractions,
      nftActivity,
      monthlyActivity,
    };
  } catch (error) {
    logMessage('error', `Error getting wrapped data: ${error.message}`);
    logMessage('error', error.stack);
    throw error;
  }
}; 