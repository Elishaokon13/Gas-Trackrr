import { getEthPrice } from '../../lib/getEthPrice';

export default async function handler(req, res) {
  try {
    const ethPrice = await getEthPrice();
    res.status(200).json({ ethPrice });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
} 