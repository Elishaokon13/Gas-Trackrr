import React from 'react';

const ChainIcon = ({ chain, size = 24 }) => {
  const getIconColor = () => {
    switch (chain) {
      case 'base':
        return '#0052FF';
      case 'optimism':
        return '#FF0420';
      case 'ethereum':
        return '#627EEA';
      default:
        return '#0052FF';
    }
  };

  const getIconPath = () => {
    switch (chain) {
      case 'base':
        return (
          <path
            d="M12 2L2 7L12 12L22 7L12 2Z"
            fill={getIconColor()}
            stroke={getIconColor()}
            strokeWidth="1"
          />
        );
      case 'optimism':
        return (
          <path
            d="M12 2L2 7L12 12L22 7L12 2Z"
            fill={getIconColor()}
            stroke={getIconColor()}
            strokeWidth="1"
          />
        );
      case 'ethereum':
        return (
          <path
            d="M12 2L2 7L12 12L22 7L12 2Z"
            fill={getIconColor()}
            stroke={getIconColor()}
            strokeWidth="1"
          />
        );
      default:
        return (
          <path
            d="M12 2L2 7L12 12L22 7L12 2Z"
            fill={getIconColor()}
            stroke={getIconColor()}
            strokeWidth="1"
          />
        );
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {getIconPath()}
    </svg>
  );
};

export default ChainIcon; 