import { getHistoricalBalances } from '../../lib/blockchain';

export default async function handler(req, res) {
  const { address, start, end } = req.query;
  if (!address || !start || !end) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }
  try {
    const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
    const usdcAddress = process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';
    const alchemyNetwork = 'base-mainnet';
    const data = await getHistoricalBalances({
      address,
      startDate: start,
      endDate: end,
      alchemyApiKey,
      usdcAddress,
      alchemyNetwork
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
 