import { ethers } from 'ethers';
import axios from 'axios';

// Base mainnet RPC URL 
const BASE_RPC_URL = 'https://mainnet.base.org';

// Initialize ethers provider
export const getProvider = () => {
  return new ethers.providers.JsonRpcProvider(BASE_RPC_URL);
};

// Get historical ETH prices for USD conversion
export const getHistoricalEthPrice = async (timestamp) => {
  try {
    const date = new Date(timestamp * 1000).toISOString().split('T')[0];
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/coins/ethereum/history?date=${date}`
    );
    return response.data.market_data.current_price.usd;
  } catch (error) {
    console.error('Error fetching ETH price:', error);
    return 2000; // Fallback price if API fails
  }
};

// Get all transactions for an address
export const getTransactions = async (address) => {
  const provider = getProvider();
  
  // This is a simplified approach. In production, you'd need to:
  // 1. Use a service like Etherscan API or The Graph for historical transactions
  // 2. Handle pagination properly
  // 3. Deal with rate limiting
  
  try {
    // Get the latest block number
    const latestBlock = await provider.getBlockNumber();
    
    // For demo purposes, we'll scan the last 10,000 blocks 
    // In production, you would use an indexing service
    const fromBlock = Math.max(0, latestBlock - 10000);
    
    // Get transaction history
    const history = await provider.getHistory(address, fromBlock, latestBlock);
    
    return history;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
};

// Calculate gas used and cost
export const calculateGasMetrics = async (transactions) => {
  let totalGasUsed = ethers.BigNumber.from(0);
  let totalGasCost = ethers.BigNumber.from(0);
  
  for (const tx of transactions) {
    // We need to get the receipt to know the actual gas used
    try {
      const receipt = await tx.wait();
      
      if (receipt && receipt.gasUsed) {
        totalGasUsed = totalGasUsed.add(receipt.gasUsed);
        const gasCost = receipt.gasUsed.mul(tx.gasPrice);
        totalGasCost = totalGasCost.add(gasCost);
      }
    } catch (error) {
      console.warn(`Could not get receipt for tx ${tx.hash}:`, error.message);
    }
  }
  
  return {
    gasUsed: totalGasUsed.toString(),
    gasCostEth: ethers.utils.formatEther(totalGasCost),
  };
};

// Get protocols interacted with
export const getProtocolInteractions = async (transactions) => {
  // In a real app, you would have a database mapping contract addresses to protocols
  // This is a simplified implementation
  const protocolInteractions = {};
  
  for (const tx of transactions) {
    if (tx.to) {
      // In production, you would look up the contract address in a database
      // Here we're just counting interactions by address
      const address = tx.to.toLowerCase();
      protocolInteractions[address] = (protocolInteractions[address] || 0) + 1;
    }
  }
  
  // Sort by interaction count
  const sortedProtocols = Object.entries(protocolInteractions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([address, count]) => ({
      address,
      count,
      // In production, you would look up the name based on the address
      name: `Protocol ${address.slice(0, 6)}...${address.slice(-4)}`,
    }));
  
  return sortedProtocols;
};

// Get NFT minting activity
export const getNftActivity = async (address) => {
  // In production, you would use an NFT indexing service
  // This is a placeholder implementation
  return {
    nftsMinted: 0,
    zoraRewards: '0',
  };
};

// Get transactions by month
export const getTransactionsByMonth = async (transactions) => {
  const monthCounts = {
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0,
    7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0
  };
  
  for (const tx of transactions) {
    const date = new Date(tx.timestamp * 1000);
    const month = date.getMonth() + 1; // JavaScript months are 0-indexed
    monthCounts[month] += 1;
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
  
  return {
    monthCounts,
    busiestMonth,
    busiestMonthName: new Date(2024, busiestMonth - 1).toLocaleString('default', { month: 'long' }),
    busiestMonthCount: maxCount,
  };
};

// Get all the wrapped data for an address
export const getWrappedData = async (address) => {
  try {
    const transactions = await getTransactions(address);
    
    // Process in parallel for better performance
    const [
      gasMetrics,
      protocolInteractions,
      nftActivity,
      monthlyActivity
    ] = await Promise.all([
      calculateGasMetrics(transactions),
      getProtocolInteractions(transactions),
      getNftActivity(address),
      getTransactionsByMonth(transactions)
    ]);
    
    return {
      address,
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