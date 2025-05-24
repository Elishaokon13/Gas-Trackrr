import { Alchemy } from "alchemy-sdk";

const apiKey = process.env.ALCHEMY_API_KEY || process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || "demo";
console.log("Using Alchemy API Key:", apiKey);
const alchemy = new Alchemy({ apiKey });

let cachedPrice = null;
let lastFetched = 0;
const CACHE_TTL = 60 * 1000; // 60 seconds

export async function getEthPrice() {
  const now = Date.now();
  if (cachedPrice && now - lastFetched < CACHE_TTL) {
    return cachedPrice;
  }
  try {
    const data = await alchemy.prices.getTokenPriceBySymbol(["ETH"]);
    console.log("Alchemy price API response:", data);
    const ethPrice = data?.data?.[0]?.prices?.find(p => p.currency.toLowerCase() === "usd")?.value;
    if (ethPrice) {
      cachedPrice = parseFloat(ethPrice);
      lastFetched = now;
      return cachedPrice;
    }
    throw new Error("Failed to fetch ETH price from Alchemy");
  } catch (err) {
    console.error('Alchemy price fetch error:', err);
    throw err;
  }
} 