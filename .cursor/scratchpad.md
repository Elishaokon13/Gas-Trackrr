# Project Scratchpad

## Background and Motivation
This project is a multi-chain wallet analytics tool that allows users to check their transaction metrics across different chains (Base, Ethereum, and Optimism). The application has evolved from a Base-only analytics tool to a comprehensive multi-chain solution that provides detailed insights into user's onchain activity.

The project aims to expand its supported chains to include Arbitrum, Sonic, and Unichain to provide a wider view of user onchain activity.

Current Features:
- Multi-chain support (Base, Ethereum, Optimism)
- Transaction count and gas usage tracking
- USD conversion for all metrics
- Chain-specific name resolution (.eth, .op, .base.eth)
- Chain-specific rank system with custom thresholds
- Profile/avatar integration
- Modern, responsive UI with chain-specific theming

## Key Challenges and Analysis
1. Data Consistency Across Chains:
   - Different APIs (Basescan, Etherscan, Optimistic Etherscan)
   - Varying data formats and response structures
   - Chain-specific token contracts and addresses
   - Rate limiting and API reliability
   - API Rate limiting and reliability, especially for less common chains like Sonic and Unichain.

2. Name Resolution:
   - Chain-specific naming services (ENS, Optimism Name Service, Base Name Service)
   - Different resolver contracts and methods
   - Handling resolution failures gracefully
   - Caching resolved names for performance
   - Researching and integrating naming services specific to Arbitrum, Sonic, and Unichain if they exist.

3. UI/UX Considerations:
   - Chain-specific theming and branding
   - Responsive design across all device sizes
   - Clear error messaging for chain-specific issues
   - Intuitive chain switching experience
   - Updating the chain selection UI to include Arbitrum, Sonic, and Unichain.
   - Chain-specific theming and branding for the new chains.

## High-level Task Breakdown
1. Data Fetching and Processing
   - [ ] Review and optimize chain-specific API calls
     - Success Criteria:
       - Each chain's API calls are properly rate-limited
       - Error handling is consistent across all chains
       - Response formats are normalized
       - API keys are properly managed
   - [ ] Implement proper error handling for each chain's API
     - Success Criteria:
       - Clear error messages for each type of failure
       - Graceful fallbacks when APIs are unavailable
       - User-friendly error display in UI
   - [ ] Add caching layer for frequently accessed data
     - Success Criteria:
       - In-memory cache for ETH prices (1-minute TTL)
       - Redis cache for transaction history (5-minute TTL)
       - Cache invalidation on errors
   - [ ] Validate data consistency across chains
     - Success Criteria:
       - Transaction counts match between different APIs
       - Gas calculations are accurate for each chain
       - Token balances are consistent

2. Name Resolution Enhancement
   - [ ] Implement proper error handling for each naming service
     - Success Criteria:
       - Clear error messages for resolution failures
       - Proper handling of expired names
       - Support for reverse resolution
   - [ ] Add caching for resolved names
     - Success Criteria:
       - 1-hour TTL for resolved names
       - Cache invalidation on resolution failures
       - Proper handling of cache misses
   - [ ] Improve error messages for resolution failures
     - Success Criteria:
       - Chain-specific error messages
       - Clear instructions for users
       - Proper handling of invalid names
   - [ ] Add support for reverse resolution
     - Success Criteria:
       - Support for all chain naming services
       - Proper error handling
       - Cache support

3. UI/UX Improvements
   - [ ] Enhance chain switching experience
     - Success Criteria:
       - Smooth transitions between chains
       - Clear loading states
       - Proper error handling
   - [ ] Add loading states for chain-specific operations
     - Success Criteria:
       - Loading indicators for all async operations
       - Proper error states
       - Clear feedback to users
   - [ ] Improve error message presentation
     - Success Criteria:
       - Chain-specific error messages
       - Clear instructions for users
       - Proper error recovery
   - [ ] Add tooltips for chain-specific features
     - Success Criteria:
       - Clear explanations of features
       - Chain-specific information
       - Proper mobile support

4. Testing and Validation
   - [ ] Add unit tests for chain-specific logic
     - Success Criteria:
       - Test coverage for all chain-specific functions
       - Mock API responses
       - Error case coverage
   - [ ] Implement integration tests for multi-chain features
     - Success Criteria:
       - End-to-end testing of chain switching
       - Data consistency tests
       - Error handling tests
   - [ ] Add end-to-end tests for critical user flows
     - Success Criteria:
       - Test all major user journeys
       - Cross-chain functionality
       - Error recovery flows
   - [ ] Test with various wallet addresses across chains
     - Success Criteria:
       - Test with real addresses on each chain
       - Test with ENS/BaseName addresses
       - Test error cases

## Multi-Chain Support
- Abstracting data-fetching logic to support multiple chains with different APIs and data formats.
- Handling different token/NFT contracts and explorers per chain.
- UI/UX for chain selection and cross-chain summaries.
- [ ] (next) Add support for Arbitrum, Sonic, and Unichain

## Historical Balance & Portfolio Chart
- Efficiently fetching historical balances (block-by-block or via third-party APIs).
- Getting accurate historical price data for tokens (ETH, USDC, etc.).
- Charting and visualizing time-series data in a performant, responsive way.

## Protocol/Category Breakdown
- Identifying protocols/dApps from transaction data (contract address mapping, signature decoding, or third-party APIs).
- Categorizing protocols (DEX, lending, NFT, bridge, etc.).
- Aggregating and visualizing the data (pie/bar charts, top lists).

## High-level Task Breakdown
- [Current state] The application allows users to enter a Base wallet address and view both their total transaction count and the amount of ETH spent on gas fees, with clear distinction between total and outgoing transactions.
- [Completed] Redesign the UI to match the "Based Baby" aesthetic with pixel art style, confetti elements, and engaging copy
- [Completed] Add USD conversion for gas spent using real-time ETH price from CoinGecko
- [Completed] Replace simulated NFTs with actual transaction volume data
- [Completed] Enhance the UI to be sleeker and more responsive across all device sizes
- [Completed] Add animated line background for a more professional and engaging look
- [Completed] Replace particle background with animated line background
- [Completed] Add isValidOpName helper and improve resolveOpName and getWalletData for robust OP Name Service resolution (validation, error handling, caching)
- [Completed] Fix Analytics page chain selector to update URL and UI theme when switching chains
- [ ] (next) Add support for Arbitrum, Sonic, and Unichain

## Project Status Board
- [x] Initial project setup with Next.js and Tailwind CSS
- [x] Implement main wallet lookup interface
- [x] Integrate with Basescan API for transaction data
- [x] Display transaction count and gas usage metrics
- [x] Add mobile responsiveness
- [x] Implement comprehensive logging for debugging
- [x] Optimize blockchain API calls
- [x] Implement pixel art UI with "Based Baby" branding
- [x] Add confetti/particle background effects
- [x] Create the blue wave design with year markers
- [x] Update copy to be more engaging and playful
- [x] Ensure responsive design for the new UI
- [x] Add USD value calculation for gas spent using CoinGecko API
- [x] Calculate and display total transaction volume in ETH and USD
- [x] Enhance UI with sleek animations and glass-morphism design
- [x] Optimize responsive design for all device sizes from mobile to desktop
- [x] Replace particle background with animated line background
- [x] Add isValidOpName helper and improve resolveOpName and getWalletData for robust OP Name Service resolution (validation, error handling, caching)
- [x] Fix Analytics page chain selector to update URL and UI theme when switching chains
- [x] Research and identify APIs/explorers for Arbitrum, Sonic, and Unichain
- [x] Refine/Implement chain-specific data fetching logic for Sonic and Unichain (if necessary)
- [x] Update backend to fetch transaction and gas data for Arbitrum, Sonic, and Unichain
- [x] Update UI chain selector to include Arbitrum, Sonic, and Unichain
- [x] Add chain-specific theming for Arbitrum, Sonic, and Unichain
- [x] Implement data fetching error handling for new chains
- [ ] Integrate name resolution for Arbitrum, Sonic, and Unichain (if applicable)
- [ ] Implement name resolution error handling for Arbitrum, Sonic, and Unichain
- [ ] Fetch and display Sonic token price (S) and use it for calculations
- [ ] Define chain-specific rank thresholds for Arbitrum, Sonic, and Unichain
- [ ] Add unit/integration tests for Arbitrum, Sonic, and Unichain support

## Current Status / Progress Tracking
The application now has a sleek, modern UI with a pixel art aesthetic for the "Based Baby" brand. It features responsive glass-morphism cards, smooth animations, and an animated line background that creates a sophisticated, dynamic feel. The app displays transaction data (count and volume) and gas usage in both ETH and USD, with the UI optimized for all device sizes from mobile to desktop.

- [2024-06-10] Limited hover/transition effects on OnchainHeatmap day cells to desktop (sm: and up) to improve mobile responsiveness. Added a note for future virtualization if needed.

Currently implementing: Backend function to fetch ETH and USDC balances for a given address at daily intervals over a date range using Alchemy.
+ Completed research for APIs and explorers for Arbitrum, Sonic, and Unichain. Findings are documented in the Executor's Feedback section.
+ Updated backend configuration (`lib/blockchain.js`) to include API endpoints and placeholder environment variables for Arbitrum, Sonic, and Unichain.
+ Completed research for name resolution services for Arbitrum (.arb by SPACE ID), Sonic (SNS - .s), and Unichain (Unichain Name Service - .uni). Findings are documented in the Executor's Feedback section.
+ Updated UI chain selectors in `pages/index.js` and `pages/analytics/[address].js` to include Arbitrum, Sonic, and Unichain.
+ Added placeholder colors and icons for Arbitrum, Sonic, and Unichain for chain-specific theming.
+ Plan revised to address task dependencies and inconsistencies, reordering tasks for logical flow (fetching/resolution before comprehensive error handling) and clarifying fetching/error handling tasks for new chains.
+ Refined chain-specific data fetching logic for Sonic and Unichain by confirming compatibility with existing functions and updating API configurations (`lib/blockchain.js`).
+ Completed updating the backend to fetch transaction and gas data for Arbitrum, Sonic, and Unichain. The existing `getWalletData` function now supports these chains due to the updated `SCAN_CONFIG` and `USDC_ADDRESSES`.
+ Implemented enhanced error handling in the `getTransactionHistoryScan` function in `lib/blockchain.js` to include HTTP status checks, more specific API error handling, and improved logging for the new chains.
+ Paused name resolution integration for Arbitrum, Sonic, and Unichain to focus on core data fetching with wallet addresses.
+ New task added to fetch and display Sonic token price (S) and use it for calculations.
+ Implemented fetching of Sonic token (S) price using Alchemy Prices API and updated `getWalletData` to use the native token price and symbol dynamically based on the selected chain for calculations and returned data.

## Executor's Feedback or Assistance Requests
- Implemented isValidOpName helper for .op names (alphanumeric/dash, min 3 chars)
- Added in-memory cache (1-hour TTL) for resolved OP names
- Improved error handling and user-facing error messages for OP Name Service resolution in getWalletData
- Now, invalid or unregistered OP names return clear errors, and valid names are cached for 1 hour
- Ready for Planner review and cross-check
- Updated the chain selector dropdown so that selecting a new chain updates the router query param (URL), keeping the UI, data, and theme in sync
- This resolves the issue where the UI theme did not update after changing chains
- Ready for Planner review and confirmation

**New Task:** Fetch and display Sonic token price (S) and use it for calculations
**Executor's Next Step:** Research APIs for Sonic token price, implement fetching logic, update calculation and display logic in `getWalletData` and UI.
+ **Research Findings (Sonic Token Price):**
+ - User provided Alchemy RPC URL for Sonic mainnet: `https://sonic-mainnet.g.alchemy.com/v2/8KqeaPDoMqTdDpR9a8r0R4NInUAu1-ss`. This is an RPC endpoint, typically used for interacting directly with the blockchain, not for historical transaction lists or market prices like a block explorer or market data provider.
+ - Need to research how to get Sonic token (S) price data. Potential sources: CoinGecko, CoinMarketCap, or a dedicated Sonic ecosystem API.

## Lessons
- Include info useful for debugging in the program output
- Read the file before trying to edit it
- Handle API rate limits and errors gracefully
- Use proxy/eth_getTransactionCount endpoint for more efficient data retrieval
- When implementing new UI designs, reuse existing components where possible to maintain consistency
- Always include error handling and fallback values when fetching external API data like cryptocurrency prices
- When displaying financial data, show both cryptocurrency and fiat values when possible
- Use CSS custom properties for better theming and consistency across components
- Implement progressive enhancement for animations to ensure they don't affect performance on lower-end devices
- Consider the visual weight of animated elements to avoid overwhelming the user interface
- For large interactive grids, avoid hover/transition effects on mobile to prevent lag. Use sm: or md: breakpoints to limit interactivity to desktop. Consider virtualization for very large grids if performance is still an issue.
- Always validate name format before attempting onchain resolution
- Use in-memory cache for name resolutions to reduce RPC calls and improve UX

## Mini App Conversion Plan (Coinbase MiniKit)

### Background and Motivation
The goal is to convert the existing multi-chain wallet analytics dashboard into a Coinbase Mini App using MiniKit. This will allow the app to run natively inside Farcaster Frames and Coinbase Wallet, leveraging MiniKit's hooks, notifications, and social features for a seamless, integrated user experience.

### Key Challenges and Analysis
- Adapting the Next.js app structure to MiniKit's requirements (provider, hooks, manifest)
- Ensuring compatibility with OnchainKit components and hooks
- Handling authentication, notifications, and frame context
- Preserving all current analytics features and UI/UX
- Testing in both standalone and mini app (frame) contexts

### High-level Task Breakdown
1. **Research & Preparation**
   - [ ] Review MiniKit and OnchainKit documentation for latest requirements
   - [ ] Identify any breaking changes or required refactors for MiniKit compatibility
   - [ ] Ensure all dependencies are up to date
   - **Success Criteria:** Clear understanding of MiniKit integration steps and requirements

2. **Install and Configure MiniKit**
   - [ ] Add `@coinbase/onchainkit` and MiniKit dependencies to the project
   - [ ] Set up required environment variables (API keys, project ID, etc.)
   - **Success Criteria:** MiniKit and dependencies installed, env vars configured

3. **Provider Integration**
   - [ ] Wrap the app with `MiniKitProvider` in `_app.js` (or equivalent)
   - [ ] Pass required props (projectId, notificationProxyUrl, etc.)
   - [ ] Remove or refactor any redundant providers (wagmi, react-query) if MiniKit handles them
   - **Success Criteria:** App runs with MiniKitProvider, no provider conflicts

4. **Frame Context & Hooks**
   - [ ] Refactor main page(s) to use `useMiniKit` for frame context
   - [ ] Implement `setFrameReady` logic for frame readiness
   - [ ] Add hooks for notifications, openUrl, close, viewProfile, and primary button as needed
   - **Success Criteria:** App responds to frame context, hooks work as expected

5. **Manifest & Account Association**
   - [ ] Generate and configure the Farcaster manifest using the CLI
   - [ ] Add required .env variables for manifest (header, payload, signature)
   - [ ] Test manifest with Warpcast Frames Developer Tools
   - **Success Criteria:** App can be added as a mini app in Warpcast, manifest is valid

6. **Notification Proxy & Webhooks**
   - [ ] Implement `/api/notification` proxy route for notifications
   - [ ] Set up webhooks for frame events if needed
   - **Success Criteria:** Notifications can be sent to users, webhooks respond to events

7. **Testing & Deployment**
   - [ ] Test locally with ngrok for live URL
   - [ ] Deploy to Vercel (recommended) and set all required environment variables
   - [ ] Test in Warpcast and Coinbase Wallet
   - **Success Criteria:** App works as a mini app in all target environments

### Success Criteria (Overall)
- All analytics features and UI/UX are preserved
- App loads and functions inside Farcaster Frames and Coinbase Wallet
- MiniKit hooks (notifications, openUrl, close, viewProfile, primary button) are integrated and working
- Manifest and account association are valid and tested
- No regressions in standalone web app mode

### Key Considerations
- Maintain backward compatibility for standalone web users if possible
- Document any new environment variables and deployment steps
- Ensure all analytics and blockchain data fetching works in the mini app context

--- 