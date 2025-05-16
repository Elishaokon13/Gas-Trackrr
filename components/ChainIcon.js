import React from 'react';

export default function ChainIcon({ chain, size = 20 }) {
  // Map chain to logo filename
  const logoMap = {
    base: '/logo/base.svg',
    optimism: '/logo/op.svg',
    ethereum: '/logo/ethereum.svg',
  };
  if (logoMap[chain]) {
    return (
      <img
        src={logoMap[chain]}
        alt={`${chain} logo`}
        width={size}
        height={size}
        style={{ display: 'inline-block', verticalAlign: 'middle' }}
      />
    );
  }
  if (chain === 'assetchain') {
    // Green chain/asset icon
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#22c55e" />
        <g>
          <rect x="7" y="11" width="10" height="2" rx="1" fill="#fff" />
          <rect x="11" y="7" width="2" height="10" rx="1" fill="#fff" />
        </g>
      </svg>
    );
  }
  // Default icon
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#888" /></svg>
  );
} 