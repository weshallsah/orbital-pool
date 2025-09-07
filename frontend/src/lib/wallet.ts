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
  ORBITAL_POOL: '0x83EC719A6F504583d0F88CEd111cB8e8c0956431',
  MATH_HELPER: '0x112F137fcB7fA9Ed84A54767aD4d555904F274d9',
  MUSDC_A: '0x9666526dcF585863f9ef52D76718d810EE77FB8D',
  MUSDC_B: '0x1921d350666BA0Cf9309D4DA6a033EE0f0a70bEC',
  MUSDC_C: '0xbEDC66545b8A4763eF8962860901F817DB7C2199',
  MUSDC_D: '0x13f62264A2Eb0834DEfb513D7A3c69fde9cc1fD2',
  MUSDC_E: '0x0510Bf5F38ca1Db3DE4B97E40FFfb9b195B60d41',
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