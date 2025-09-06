/**
 * Orbital AMM - Wallet Configuration
 * 
 * Wallet connection setup using Wagmi and RainbowKit.
 * 
 * @author Orbital Protocol Team
 * @version 1.0.0
 */

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { arbitrum, arbitrumSepolia, mainnet } from 'wagmi/chains';

// Wallet configuration
export const config = getDefaultConfig({
  appName: 'Orbital AMM',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'orbital-amm-default',
  chains: [arbitrumSepolia, arbitrum, mainnet],
  ssr: true,
});

// Contract addresses
export const CONTRACTS = {
  ORBITAL_POOL: '0xD22434d7c7495e4d73D66b4822B65F474E065425',
  MATH_HELPER: '0x112F137fcB7fA9Ed84A54767aD4d555904F274d9',
  MUSDC_A: '0xE7378470a3873Ae42f76779d2155E593C6B9c8c7',
  MUSDC_B: '0xFE36C66a18Bb7b41b648d38b664b7e4Aec1703B7',
  MUSDC_C: '0xdA1E20Be597dB6fa4cF59Bb67Fd90D28DcA76579',
  MUSDC_D: '0x89D8173BF35e72DC7d8627Fc4BE1a3b578e35F7B',
  MUSDC_E: '0xD4C341523d5Cdb43dfBdC23A9546736b474aDdC3',
} as const;

// Chain configuration
export const SUPPORTED_CHAINS = {
  [arbitrum.id]: {
    name: 'Arbitrum One',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    blockExplorer: 'https://arbiscan.io',
  },
  [arbitrumSepolia.id]: {
    name: 'Arbitrum Sepolia',
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    blockExplorer: 'https://sepolia.arbiscan.io',
  },
} as const;

// Default chain
export const DEFAULT_CHAIN = arbitrumSepolia;