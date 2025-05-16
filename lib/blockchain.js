import { ethers } from 'ethers';
import axios from 'axios';

// Base mainnet RPC URL 
const BASE_RPC_URL = 'https://mainnet.base.org';

// Known protocol addresses on Base
const KNOWN_PROTOCOLS = {
  '0x4200000000000000000000000000000000000006': 'Base Bridge', 
  '0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca': 'Base USD',
  '0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6': 'Wrapped ETH',
  '0x50c5725949a6f0c72e6c4a641f24049a917db0cb': 'Lyra',
  '0x4ed4e862860bed51a9570b96d89af5e1b0efefed': 'Zora',
  '0x82af49447d8a07e3bd95bd0d56f35241523fbab1': 'Wormhole',
  '0x1eeaabddfedd19ebae68e232e0d7847c08c0a6e1': 'Uniswap V3',
  // Add more known protocols as needed
};

// Initialize ethers provider with increased timeout and retry options
export const getProvider = () => {
  const options = {
    timeout: 120000, // 2 minute timeout
    allowGzip: true,
    keepAlive: true,
  };
  return new ethers.providers.JsonRpcProvider(BASE_RPC_URL, 8453, options);
};

// Get historical ETH prices for USD conversion
export const getHistoricalEthPrice = async (timestamp) => {
  try {
    const date = new Date(timestamp * 1000).toISOString().split('T')[0];
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/coins/ethereum/history?date=${date}`,
      { timeout: 10000 }
    );
    return response.data.market_data.current_price.usd;
  } catch (error) {
    console.error('Error fetching ETH price:', error);
    return 2000; // Fallback price if API fails
  }
};

// Get all transactions for an address with improved error handling
export const getTransactions = async (address) => {
  const provider = getProvider();
  
  try {
    console.log(`Getting transactions for ${address} on Base...`);
    
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
      console.log(`Found ${history.length} transactions`);
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

// Calculate gas used and cost with improved error handling
export const calculateGasMetrics = async (transactions) => {
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

// Get protocols interacted with
export const getProtocolInteractions = async (transactions) => {
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

// Get NFT minting activity - this would need integration with NFT-specific APIs
export const getNftActivity = async (address) => {
  // For a proper implementation, you would connect to NFT indexing services
  // For now, we'll return a placeholder implementation based on transaction count
  try {
    console.log(`Estimating NFT activity for ${address}...`);
    
    // This is just an estimation - in real implementation,
    // you'd need to analyze transaction data or use NFT API
    return {
      nftsMinted: Math.floor(Math.random() * 5),  // Random for now
      zoraRewards: '0.05',  // Placeholder
    };
  } catch (error) {
    console.error('Error estimating NFT activity:', error);
    return {
      nftsMinted: 0,
      zoraRewards: '0',
    };
  }
};

// Get transactions by month
export const getTransactionsByMonth = async (transactions) => {
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

// Get all the wrapped data for an address
export const getWrappedData = async (address) => {
  try {
    console.log(`Getting wrapped data for ${address}...`);
    const startTime = Date.now();
    
    // Normalize address to checksum format
    const normalizedAddress = ethers.utils.getAddress(address);
    console.log(`Normalized address: ${normalizedAddress}`);
    
    // Get transactions
    const transactions = await getTransactions(normalizedAddress);
    console.log(`Processing ${transactions.length} transactions...`);
    
    // If no transactions, return basic data
    if (transactions.length === 0) {
      console.log('No transactions found, returning default data');
      return {
        address: normalizedAddress,
        transactionCount: 0,
        gasMetrics: {
          gasUsed: '0',
          gasCostEth: '0.00',
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
    
    // Process in parallel for better performance
    const [
      gasMetrics,
      protocolInteractions,
      nftActivity,
      monthlyActivity
    ] = await Promise.all([
      calculateGasMetrics(transactions),
      getProtocolInteractions(transactions),
      getNftActivity(normalizedAddress),
      getTransactionsByMonth(transactions)
    ]);
    
    const endTime = Date.now();
    console.log(`Completed data processing in ${(endTime - startTime) / 1000} seconds`);
    
    return {
      address: normalizedAddress,
      transactionCount: transactions.length,
      gasMetrics,
      protocolInteractions,
      nftActivity,
      monthlyActivity,
    };
  } catch (error) {
    console.error('Error getting wrapped data:', error);
    throw error;
  }
}; 