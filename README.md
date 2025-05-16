# Base Wrapped

A Spotify Wrapped-style year-in-review analytics dashboard for Base blockchain activity.

## Features

- **Interactive Slides**: Navigate through a series of animated slides showing your Base activity
- **Key Metrics**: View gas usage, transaction count, NFT minting stats, and more
- **Protocol Analysis**: See which Base protocols you interacted with most
- **Monthly Breakdown**: Discover your busiest month on Base
- **Visual Summary**: Get a "Based Baby" summary of your on-chain activity

## Tech Stack

- **Next.js**: React framework for building the UI
- **Framer Motion**: For smooth animations and transitions
- **TailwindCSS**: For styling and responsive design
- **ethers.js**: For interacting with the Base blockchain
- **react-tsparticles**: For particle background effects

## Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/base-wrapped.git
cd base-wrapped
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables (optional, for better data fetching)
Create a `.env.local` file in the root directory with the following variables:

```
# Base RPC URL - Default is the public endpoint
NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org

# Optional - If you want to use a paid API provider for better performance
# NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key_here
# NEXT_PUBLIC_INFURA_API_KEY=your_infura_key_here

# NFT data API key (for real NFT data instead of mock)
# NEXT_PUBLIC_SIMPLEHASH_API_KEY=your_simplehash_key

# CoinGecko API key (for better rate limits on price data)
# NEXT_PUBLIC_COINGECKO_API_KEY=your_coingecko_key
```

4. Run the development server
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Using API Providers for Better Data

### RPC Providers
The app uses public RPC endpoints by default, but for better performance and reliability, you can use:
- [Alchemy](https://www.alchemy.com/) - Create an account and get an API key for Base
- [Infura](https://infura.io/) - Create an account and set up a Base endpoint

### NFT Data
For real NFT data (instead of mock data):
- [SimpleHash](https://simplehash.com/) - Offers a free tier that works well for this application

### Price Data
For more reliable price data and higher rate limits:
- [CoinGecko Pro](https://www.coingecko.com/en/api/pricing) - The free API works but has rate limits

## Usage

1. Enter your Base wallet address on the homepage
2. View your personalized Base Wrapped experience
3. Navigate through slides to see different aspects of your activity

## Limitations

This is a prototype version with some limitations:

- Uses a simplified approach to fetch transaction history
- Limited to recent transactions due to RPC limitations
- Default values used for certain metrics when data is unavailable

## Future Enhancements

- Add support for comparing multiple wallets
- Integrate with more data sources for enhanced analytics
- Add sharing functionality for social media
- Implement more detailed protocol-specific metrics

## License

This project is licensed under the MIT License - see the LICENSE file for details. 