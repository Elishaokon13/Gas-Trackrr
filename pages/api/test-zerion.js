import axios from 'axios';

export default async function handler(req, res) {
  // Get the API key from the environment
  const apiKey = process.env.NEXT_PUBLIC_ZERION_API_KEY;
  
  if (!apiKey) {
    return res.status(400).json({ error: 'No Zerion API key found in environment variables' });
  }
  
  try {
    // Create base64 authorization
    const base64Auth = Buffer.from(`${apiKey}:`).toString('base64');
    
    // Test address to query
    const testAddress = '0x1B958A48373109E9146A950a75F5bD25B845143b';
    
    // Make a test call to Zerion API
    const response = await axios.get(
      `https://api.zerion.io/v1/wallets/${testAddress}/transactions?currency=usd&chain_ids=base&page=1&limit=1`,
      {
        headers: {
          'accept': 'application/json',
          'authorization': `Basic ${base64Auth}`
        },
        timeout: 20000
      }
    );
    
    // Return success with sample data
    return res.status(200).json({
      success: true,
      apiKeyFormat: `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`,
      base64Auth: `Basic ${base64Auth.substring(0, 10)}...`,
      sampleResponse: response.data
    });
    
  } catch (error) {
    // Return detailed error information
    return res.status(500).json({
      error: 'Failed to connect to Zerion API',
      status: error.response?.status,
      statusText: error.response?.statusText,
      details: error.response?.data || error.message
    });
  }
} 