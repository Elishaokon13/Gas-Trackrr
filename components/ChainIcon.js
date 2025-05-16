import React from 'react';

export default function ChainIcon({ chain, size = 20 }) {
  if (chain === 'base') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#0052FF" /><text x="12" y="16" textAnchor="middle" fontSize="10" fill="#fff">BASE</text></svg>
    );
  }
  if (chain === 'optimism') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#FF0420" /><text x="12" y="16" textAnchor="middle" fontSize="10" fill="#fff">OP</text></svg>
    );
  }
  if (chain === 'ethereum') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#7c3aed" /><text x="12" y="16" textAnchor="middle" fontSize="10" fill="#fff">ETH</text></svg>
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