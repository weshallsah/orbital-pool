// Orbital Pool Contract Configuration
export const ORBITAL_POOL_ADDRESS = '0x8E27C670fA1D45a635e916F8bd60F7E5E1AcF19B' as const;

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
  { index: 0, symbol: 'USDT', address: '0x4036B58f91F2A821cB56E2921213663f58db7e6c' },
  { index: 1, symbol: 'USDC', address: '0x41906B6CBFC6a1bEd09311a88e7549a2eB34F325' },
  { index: 2, symbol: 'DAI', address: '0x28f73c76Cb06ceAAA94Adce630f012531f5E80a9' },
  { index: 3, symbol: 'FRAX', address: '0x153BD834089ad564fF33450A621EAC412cD4D8f0' },
  { index: 4, symbol: 'LUSD', address: '0x153BD834089ad564fF33450A621EAC412cD4D8f0' }
] as const;

// Default K value for liquidity provision (in Q96.48 format)
export const DEFAULT_K_VALUE = '100000000000000000000000000000000000000000000000000' as const;
