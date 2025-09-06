/**
 * Orbital AMM - Configuration Constants
 *
 * Centralized configuration for tokens, pools, and protocol parameters.
 *
 * @author Orbital Protocol Team
 * @version 1.0.0
 */

export const TOKENS = [
  {
    symbol: "MUSDC-A",
    name: "Mock USDC A",
    address: "0xE7378470a3873Ae42f76779d2155E593C6B9c8c7",
    decimals: 18,
    logo: "/tokens/usdc.svg",
    color: "#2775CA",
  },
  {
    symbol: "MUSDC-B",
    name: "Mock USDC B",
    address: "0xFE36C66a18Bb7b41b648d38b664b7e4Aec1703B7",
    decimals: 18,
    logo: "/tokens/usdt.svg",
    color: "#26A17B",
  },
  {
    symbol: "MUSDC-C",
    name: "Mock USDC C",
    address: "0xdA1E20Be597dB6fa4cF59Bb67Fd90D28DcA76579",
    decimals: 18,
    logo: "/tokens/dai.svg",
    color: "#F5AC37",
  },
  {
    symbol: "MUSDC-D",
    name: "Mock USDC D",
    address: "0x89D8173BF35e72DC7d8627Fc4BE1a3b578e35F7B",
    decimals: 18,
    logo: "/tokens/frax.svg",
    color: "#000000",
  },
  {
    symbol: "MUSDC-E",
    name: "Mock USDC E",
    address: "0xD4C341523d5Cdb43dfBdC23A9546736b474aDdC3",
    decimals: 18,
    logo: "/tokens/lusd.svg",
    color: "#745DDF",
  },
] as const;

// Pool configuration
export const POOL_CONFIG = {
  address: "0xD22434d7c7495e4d73D66b4822B65F474E065425", // Orbital AMM Pool (redeployed)
  mathHelper: "0x112F137fcB7fA9Ed84A54767aD4d555904F274d9", // Math Helper
  fee: 0.003, // 0.3%
  maxSlippage: 0.05, // 5%
  minLiquidity: 1000,
  demoK: "3000000000000000", // Valid K value for demo
  demoAmount: "1000", // 1000 tokens for demo (will be converted to 1000 * 1e18 with parseEther)
} as const;

// UI Constants
export const ANIMATION_DURATION = 0.3;
export const DEBOUNCE_DELAY = 500;

// Orbital AMM specific constants
export const ORBITAL_CONSTANTS = {
  PRECISION: BigInt("1000000000000000000"), // 10^18
  MAX_TOKENS: 1000,
  MIN_LIQUIDITY: BigInt("1000000000000000"), // 10^15
  CONVERGENCE_TOLERANCE: BigInt("1000000"), // 10^6
  MAX_SLIPPAGE: BigInt("100000000000000000"), // 10%
} as const;

// Chart colors for different tokens
export const CHART_COLORS = [
  "#2775CA", // USDC Blue
  "#26A17B", // USDT Green
  "#F5AC37", // DAI Yellow
  "#000000", // FRAX Black
  "#745DDF", // LUSD Purple
  "#FF6B6B", // Additional colors
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
] as const;
