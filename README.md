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

3. Run the development server
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

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