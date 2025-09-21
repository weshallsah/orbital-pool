// Orbital Pool Contract Configuration
export const ORBITAL_POOL_ADDRESS = '0x3f69af823ff5eae878e7fc6ddd5d89d1d0d97313' as const;

export const ORBITAL_POOL_ABI = [
  {
    inputs: [
      { internalType: "uint256", name: "k", type: "uint256" },
      { internalType: "uint256[5]", name: "amounts", type: "uint256[5]" }
    ],
    name: "addLiquidity",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "provider",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "k",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256[5]",
        name: "amounts",
        type: "uint256[5]"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "lpShares",
        type: "uint256"
      }
    ],
    name: "LiquidityAdded",
    type: "event"
  }
] as const;

// Token addresses from deployment
export const ORBITAL_TOKENS = [
  { index: 0, symbol: 'MUSDC-A', address: '0x05c99751d279c15b77f2e94e801d4dc74b62cd0d' },
  { index: 1, symbol: 'MUSDC-B', address: '0x97987dcd3c11e2ea5bc3621fcf1be123e62ce4b0' },
  { index: 2, symbol: 'MUSDC-C', address: '0xaf7ebb620eb7adf30134ec68555d8f4e2b9582ed' },
  { index: 3, symbol: 'MUSDC-D', address: '0xe56b1e9a54c6a456a40dc48406e15df89eaa9bad' },
  { index: 4, symbol: 'MUSDC-E', address: '0xcbe3de1332cd548dcf9a153d0196e73212cfc4e2' }
] as const;

// Default K value for liquidity provision (in Q96.48 format)
export const DEFAULT_K_VALUE = '100000000000000000000000000000000000000000000000000' as const;
