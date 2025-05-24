# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Custom horizontal scrollbar styles for `.overflow-x-auto` containers in `globals.css` for a modern look on WebKit browsers.
- `CHANGELOG.md` to track project changes.

### Changed
- Made the OnchainHeatmap (streaks) grid fully responsive: it now scrolls horizontally on mobile and never expands the page.
- Day cells in the heatmap shrink on small screens for better usability.
- Reserved vertical space for the heatmap while loading to prevent layout shift and jumping.

### Fixed
- Fixed layout issues where the streaks/heatmap component could cause the analytics page to expand or become unresponsive.
- Fixed horizontal overflow and ensured the analytics page remains centered and visually stable.

### UI/UX
- Improved mobile and desktop experience for the analytics dashboard.
- General performance and accessibility improvements.

---

## [2024-06-09] Major Milestone & Feature History

### Initial Setup
- Project scaffolded with Next.js and TailwindCSS.
- Set up pixel-art inspired, mobile-first UI with global pixel font.
- Added Framer Motion for smooth animations.

### Core Features
- Implemented wallet lookup (address, ENS, BaseName) and analytics dashboard.
- Integrated ethers.js for real blockchain data (no mocks).
- Displayed total gas spent, top protocols, NFTs minted, rewards, busiest month, and summary slide.
- Added error handling for wallets with no transactions.

### UI/UX Enhancements
- Added blue wave and animated line/particle backgrounds.
- Ensured mobile-only experience with simulated phone frame on desktop.
- Refined action row: network selector, share/search buttons, compact layout.
- Used pixel font globally and ensured all major components are responsive.

### Heatmap & Streaks
- Implemented GitHub-style contribution heatmap with year tabs, month labels, and scrollable grid.
- Optimized heatmap for performance and mobile usability.
- Fixed bug: streaks now work for ENS/BaseName inputs.

### Bug Fixes & Refactors
- Removed large files from git, cleaned up repo, and improved error handling.
- Fixed runtime errors from unavailable Heroicons.
- Refactored code for maintainability and performance.

--- 