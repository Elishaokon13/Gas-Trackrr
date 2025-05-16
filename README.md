# Base Analytics Dashboard

A modern, mobile-friendly analytics dashboard for Base, Optimism, and Ethereum wallets. Instantly view your transaction count, gas usage, and on-chain volume, with chain-aware name resolution and a one-click "Share as Image" export.

## Features

- **Multi-Chain Support:** Analyze wallets on Base, Optimism, and Ethereum
- **Key Metrics:** Transaction count, gas spent, incoming/outgoing ETH & USDC, all with USD values
- **Chain-Aware Name Resolution:** Supports ENS (.eth), Optimism Name Service (.op), and Base Name Service (.base.eth)
- **Dynamic UI:** Chain-specific theming, icons, and input validation
- **Share as Image:** Export your analytics as a downloadable image with one click
- **Mobile Responsive:** Pixel-art, glassmorphism, and animated backgrounds for a fun, branded experience

## Tech Stack

- **Next.js** (React framework)
- **TailwindCSS** (styling)
- **ethers.js** (blockchain data)
- **Framer Motion** (animations)
- **html2canvas** (image export)

## Getting Started

### Prerequisites
- Node.js 16+ and npm

### Installation

1. Clone the repository:
   ```bash
git clone https://github.com/Elishaokon13/DAY5.git
cd DAY5
```
2. Install dependencies:
   ```bash
npm install
```
3. Set up environment variables (optional, for better data and higher rate limits):
   Create a `.env.local` file in the root directory with any of the following:
   ```
# Base, Ethereum, and Optimism RPC URLs (defaults provided)
NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org
NEXT_PUBLIC_ETH_MAINNET_RPC_URL=https://mainnet.infura.io/v3/your_infura_key
NEXT_PUBLIC_OPTIMISM_MAINNET_RPC_URL=https://mainnet.optimism.io

# API keys for scan APIs (optional, for higher rate limits)
NEXT_PUBLIC_BASESCAN_API_KEY=your_basescan_key
NEXT_PUBLIC_ETHERSCAN_API_KEY=your_etherscan_key
NEXT_PUBLIC_OPTIMISM_ETHERSCAN_API_KEY=your_opscan_key

# Optional: Alchemy/Infura for enhanced reliability
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key
NEXT_PUBLIC_INFURA_API_KEY=your_infura_key
```
4. Start the development server:
   ```bash
npm run dev
```
5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Enter a wallet address or supported name (ENS, .op, .base.eth) on the homepage.
2. Select the chain (Base, Optimism, Ethereum) from the dropdown.
3. View your analytics: transaction count, gas spent, incoming/outgoing ETH & USDC, and more.
4. **To share your results:** Click the "Share as Image" button at the bottom of the analytics page. An image will be downloaded to your device.

## Limitations
- Some metrics may use default values if API rate limits are hit or data is unavailable.
- Name resolution depends on public RPC endpoints and may be affected by provider outages.
- The historical portfolio chart is currently disabled due to upstream API limitations.

## Future Enhancements
- Protocol/category breakdowns
- Leaderboards
- Multi-chain portfolio charts
- Social media sharing

## License

MIT License. See LICENSE file for details. 